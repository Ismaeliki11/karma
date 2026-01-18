
import { NextResponse } from 'next/server';
export const runtime = "edge";
import { db } from '@/db';
import { services, bookings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, description, type, price, duration, imageUrl } = body;

        const updatedService = await db.update(services)
            .set({
                name,
                description,
                type,
                price: Number(price),
                duration: Number(duration),
                imageUrl,
            })
            .where(eq(services.id, id))
            .returning();

        if (!updatedService.length) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json(updatedService[0]);
    } catch (error) {
        console.error('Error updating service:', error);
        return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const associatedBookings = await db.select().from(bookings).where(eq(bookings.serviceId, id));
        if (associatedBookings.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete service because it has associated bookings. Please delete the bookings first.' },
                { status: 400 }
            );
        }

        await db.delete(services).where(eq(services.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting service:', error);
        return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }
}
