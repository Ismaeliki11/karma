
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, services, verificationTokens } from '@/db/schema';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { desc, eq, and, or, gte, lte } from 'drizzle-orm';
import { addMinutes, isBefore, isAfter, addHours } from 'date-fns';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
import { MADRID_TZ } from '@/lib/time-utils';
import { getBusinessBoundaries } from '@/lib/availability';

// Schema Validation
const bookingSchema = z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    selectedOptions: z.array(z.string()),
    date: z.string(), // YYYY-MM-DD
    time: z.string(), // HH:mm
    customer: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
    }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = bookingSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Datos inválidos', details: result.error.format() }, { status: 400 });
        }

        const { serviceId, selectedOptions, date, time, customer, serviceName } = result.data;

        // 1. Transaction to guarantee atomicity and serialization
        // Note: SQLite via LibSQL single-writer mode acts as a serialized queue for writes.
        // We re-check availability INSIDE the transaction.
        const bookingResult = await db.transaction(async (tx) => {

            // 2. Fetch Service Details (Duration)
            const service = await tx.query.services.findFirst({
                where: eq(services.id, serviceId),
            });

            if (!service) {
                throw new Error("Service not found");
            }

            // 3. Calculate Intervals (Source of Truth: UTC)
            // Parse Input (Madrid) -> UTC
            const startAt = fromZonedTime(`${date} ${time}`, MADRID_TZ);
            const endAt = addMinutes(startAt, service.duration);
            const endAtWithBuffer = addMinutes(endAt, 10); // 10 min courtesy for overlap check

            // 4. Validate Business Rules (Open/Close/Break)
            // We use the same engine logic (or simplified strict check)
            const boundaries = await getBusinessBoundaries(startAt); // passing Date object works

            if (!boundaries || boundaries.isClosed) {
                throw new Error("The salon is closed on this day.");
            }

            // Parse boundaries to UTC for comparison
            const dateStr = date;
            const openMetric = fromZonedTime(`${dateStr} ${boundaries.openTime}`, MADRID_TZ);
            const closeMetric = fromZonedTime(`${dateStr} ${boundaries.closeTime}`, MADRID_TZ);

            // Rule: Must fit within [Open, Close]
            if (isBefore(startAt, openMetric) || isAfter(endAtWithBuffer, closeMetric)) {
                throw new Error("Booking is outside business hours.");
            }

            // Rule: Break
            if (boundaries.breakStart && boundaries.breakEnd) {
                const breakStart = fromZonedTime(`${dateStr} ${boundaries.breakStart}`, MADRID_TZ);
                const breakEnd = fromZonedTime(`${dateStr} ${boundaries.breakEnd}`, MADRID_TZ);

                // Overlap: (Start < BreakEnd) AND (EndWithBuffer > BreakStart)
                if (isBefore(startAt, breakEnd) && isAfter(endAtWithBuffer, breakStart)) {
                    throw new Error("Booking conflicts with break time.");
                }
            }

            // 5. Strict Overlap Check against DB
            const dayStart = fromZonedTime(`${date} 00:00`, MADRID_TZ);
            const dayEnd = fromZonedTime(`${date} 23:59`, MADRID_TZ);

            const existingBookings = await tx.select().from(bookings).where(
                and(
                    gte(bookings.startAt, dayStart),
                    lte(bookings.startAt, dayEnd),
                    or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING'))
                )
            );

            for (const b of existingBookings) {
                const bEndWithBuffer = addMinutes(b.endAt, 10);
                if (isBefore(startAt, bEndWithBuffer) && isAfter(endAtWithBuffer, b.startAt)) {
                    throw new Error("Slot is no longer available (Overlap detected).");
                }
            }

            // 6. Insert Booking
            const locator = nanoid(8).toUpperCase();
            const bookingId = nanoid();

            await tx.insert(bookings).values({
                id: bookingId,
                locator,
                serviceId,
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                date: date, // Keep metadata
                startTime: time, // Keep metadata
                startAt: startAt, // SOURCE OF TRUTH
                endAt: endAt,    // SOURCE OF TRUTH
                selectedOptions: selectedOptions,
                status: 'CONFIRMED',
                createdAt: new Date(), // Explicitly set date to avoid driver-specific SQL issues
            });

            return { success: true, id: bookingId, locator, customer, serviceName, date, time };
        });

        // 7. Generate Magic Link Token
        const magicToken = nanoid(32);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const magicLink = `${appUrl}/mis-reservas/dashboard?token=${magicToken}`;

        try {
            await db.insert(verificationTokens).values({
                token: magicToken,
                identifier: bookingResult.customer.email,
                expires: addHours(new Date(), 24),
                relatedBookingId: bookingResult.id,
            });
        } catch (tokenError) {
            console.error("Failed to generate magic token:", tokenError);
            // Continue sending email without link or with generic link? 
            // Better to log and continue, maybe email fails too if we are unlucky but transaction is safe.
        }



        return NextResponse.json(bookingResult);

    } catch (error: any) {
        console.error('Booking Transaction Error:', error);
        // Log additional details if available (common in DB errors)
        if (error.cause) console.error('Error Cause:', error.cause);
        if (error.code) console.error('Error Code:', error.code);

        const message = error instanceof Error ? error.message : 'Internal Server Error';

        // Map specific errors to status codes
        if (message.includes("Service not found")) {
            return NextResponse.json({ error: "El servicio seleccionado ya no existe. Por favor, reinicie la reserva." }, { status: 404 });
        }
        if (message.includes("Slot is no longer available") || message.includes("outside business hours") || message.includes("closed on this day") || message.includes("conflicts")) {
            return NextResponse.json({ error: message }, { status: 409 });
        }

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 });
        }

        // 1. Get current booking to check if we need to recalculate times
        const currentBookingResult = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
        const currentBooking = currentBookingResult[0];

        if (!currentBooking) {
            return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
        }

        let newStartAt = currentBooking.startAt;
        let newEndAt = currentBooking.endAt;

        // 2. If Date or Time changed, Recalculate Intervals
        if (updates.date || updates.startTime) {
            const newDate = updates.date || currentBooking.date;
            const newTime = updates.startTime || currentBooking.startTime;

            // Normalize for comparison
            const dateChanged = updates.date && updates.date !== currentBooking.date;
            const timeChanged = updates.startTime && updates.startTime !== currentBooking.startTime;
            const isReactivation = updates.status &&
                (updates.status === 'CONFIRMED' || updates.status === 'PENDING') &&
                currentBooking.status === 'CANCELLED';

            if (dateChanged || timeChanged || isReactivation) {
                // Fetch Service for duration
                const serviceId = updates.serviceId || currentBooking.serviceId;
                if (!serviceId) {
                    return NextResponse.json({ error: 'Service ID missing on booking' }, { status: 500 });
                }

                const serviceResult = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
                const service = serviceResult[0];

                if (!service) {
                    return NextResponse.json({ error: 'Servicio original no encontrado' }, { status: 404 });
                }

                // --- STRICT VALIDATION LOGIC START ---

                // A. Verify Business Rules (Open/Close/Break)
                const startAt = fromZonedTime(`${newDate} ${newTime}`, MADRID_TZ);
                const endAt = addMinutes(startAt, service.duration);
                const endAtWithBuffer = addMinutes(endAt, 10); // 10 min courtesy

                const boundaries = await getBusinessBoundaries(startAt);

                if (!boundaries || boundaries.isClosed) {
                    return NextResponse.json({ error: "El salón está cerrado en esta fecha." }, { status: 409 });
                }

                const openMetric = fromZonedTime(`${newDate} ${boundaries.openTime}`, MADRID_TZ);
                const closeMetric = fromZonedTime(`${newDate} ${boundaries.closeTime}`, MADRID_TZ);

                if (isBefore(startAt, openMetric) || isAfter(endAtWithBuffer, closeMetric)) {
                    return NextResponse.json({ error: "La hora seleccionada está fuera del horario comercial." }, { status: 409 });
                }

                if (boundaries.breakStart && boundaries.breakEnd) {
                    const breakStart = fromZonedTime(`${newDate} ${boundaries.breakStart}`, MADRID_TZ);
                    const breakEnd = fromZonedTime(`${newDate} ${boundaries.breakEnd}`, MADRID_TZ);

                    if (isBefore(startAt, breakEnd) && isAfter(endAtWithBuffer, breakStart)) {
                        return NextResponse.json({ error: "La reserva coincide con el horario de descanso." }, { status: 409 });
                    }
                }

                // B. Detect Overlaps (Excluding Self)
                const dayStart = fromZonedTime(`${newDate} 00:00`, MADRID_TZ);
                const dayEnd = fromZonedTime(`${newDate} 23:59`, MADRID_TZ);

                // Note: We need a transaction or lock ideally, but standard ACID is simplified here.
                // We check existing bookings in the same range
                const existingBookings = await db.select().from(bookings).where(
                    and(
                        gte(bookings.startAt, dayStart),
                        lte(bookings.startAt, dayEnd),
                        or(eq(bookings.status, 'CONFIRMED'), eq(bookings.status, 'PENDING')),
                        // CRITICAL: Exclude the current booking we are moving!
                        // We use `not(eq(bookings.id, id))` but pure SQL negation is safer via `ne` or checking ID in loop.
                        // Let's filter in loop for simplicity or use `ne` if imported.
                    )
                );

                for (const b of existingBookings) {
                    // Skip self
                    if (b.id === id) continue;

                    const bEndWithBuffer = addMinutes(b.endAt, 10);
                    if (isBefore(startAt, bEndWithBuffer) && isAfter(endAtWithBuffer, b.startAt)) {
                        return NextResponse.json({ error: "El hueco seleccionado ya no está disponible." }, { status: 409 });
                    }
                }

                // --- STRICT VALIDATION LOGIC END ---

                newStartAt = startAt;
                newEndAt = endAt;
            }
        }

        // 3. Update Database
        const validUpdates: any = {};
        if (updates.date) validUpdates.date = updates.date;
        if (updates.startTime) validUpdates.startTime = updates.startTime;
        if (updates.status) validUpdates.status = updates.status;
        if (updates.customerName) validUpdates.customerName = updates.customerName;
        if (updates.customerEmail) validUpdates.customerEmail = updates.customerEmail;
        if (updates.customerPhone) validUpdates.customerPhone = updates.customerPhone;
        if (updates.serviceName) validUpdates.serviceName = updates.serviceName;

        await db.update(bookings)
            .set({
                ...validUpdates,
                startAt: newStartAt,
                endAt: newEndAt,
            })
            .where(eq(bookings.id, id));

        // 4. Return updated record with Service details
        const updatedResult = await db.select({
            id: bookings.id,
            locator: bookings.locator,
            customerName: bookings.customerName,
            customerEmail: bookings.customerEmail,
            customerPhone: bookings.customerPhone,
            date: bookings.date,
            startTime: bookings.startTime,
            startAt: bookings.startAt,
            endAt: bookings.endAt,
            status: bookings.status,
            createdAt: bookings.createdAt,
            serviceName: services.name,
            servicePrice: services.price,
            serviceId: bookings.serviceId,
        })
            .from(bookings)
            .leftJoin(services, eq(bookings.serviceId, services.id))
            .where(eq(bookings.id, id));

        const updatedBooking = updatedResult[0];

        // 5. Send Update Email (Async/Blocking?)
        // Let's do it blocking for now to ensure delivery, or we could fire and forget if performance is an issue.
        // Given the user wants robust detection, blocking is safer or at least await it.
        try {
            await import('@/lib/email').then(m => m.sendBookingUpdateEmail({
                customerName: updatedBooking.customerName,
                customerEmail: updatedBooking.customerEmail,
                date: updatedBooking.date,
                startTime: updatedBooking.startTime,
                locator: updatedBooking.locator,
                serviceName: updatedBooking.serviceName || undefined
            }));
        } catch (emailError) {
            console.error('Failed to send update email', emailError);
            // We generally don't want to fail the request if email fails, but maybe log it?
        }

        return NextResponse.json(updatedBooking);

    } catch (error: any) {
        console.error('Booking Update Error:', error);
        if (error.cause) console.error('Error Cause:', error.cause);

        return NextResponse.json({ error: error.message || 'Error al actualizar la reserva' }, { status: 500 });
    }
}

// ... GET and PATCH remain similar but should likely be updated to respect startAt/endAt if used for admin.
// For now, GET is used by Admin Dashboard.

export async function GET() {
    try {
        const allBookings = await db.select({
            id: bookings.id,
            locator: bookings.locator,
            customerName: bookings.customerName,
            customerEmail: bookings.customerEmail,
            customerPhone: bookings.customerPhone,
            date: bookings.date,
            startTime: bookings.startTime,
            startAt: bookings.startAt, // Include new field
            endAt: bookings.endAt,     // Include new field
            status: bookings.status,
            createdAt: bookings.createdAt,
            serviceName: services.name,
            servicePrice: services.price,
            serviceId: bookings.serviceId,
        })
            .from(bookings)
            .leftJoin(services, eq(bookings.serviceId, services.id))
            .orderBy(desc(bookings.createdAt));

        return NextResponse.json(allBookings);
    } catch (error) {
        console.error('Fetch Bookings Error:', error);
        return NextResponse.json({ error: 'Error al obtener las reservas' }, { status: 500 });
    }
}
