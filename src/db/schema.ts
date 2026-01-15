
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const services = sqliteTable('services', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(), // 'manicure', 'pedicure', 'facial'
    price: integer('price').notNull(), // in cents
    duration: integer('duration').notNull(), // in minutes
    imageUrl: text('image_url'),
});

export const bookings = sqliteTable('bookings', {
    id: text('id').primaryKey(),
    locator: text('locator').notNull().unique(),
    serviceId: text('service_id').references(() => services.id),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    date: text('date').notNull(), // ISO date string YYYY-MM-DD (Maintained for indexing/partitioning)
    startTime: text('start_time').notNull(), // HH:MM (Maintained for consistency, but startAt is SOT)

    // NEW FIELDS FOR ROBUSTNESS
    startAt: integer('start_at', { mode: 'timestamp' }).notNull(), // UTC Timestamp - SOURCE OF TRUTH
    endAt: integer('end_at', { mode: 'timestamp' }).notNull(), // UTC Timestamp - SOURCE OF TRUTH

    selectedOptions: text('selected_options', { mode: 'json' }),
    status: text('status').notNull().default('PENDING'), // PENDING, CONFIRMED, CANCELLED
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const admins = sqliteTable('admins', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
});

export const verificationTokens = sqliteTable('verification_tokens', {
    token: text('token').primaryKey(),
    identifier: text('identifier').notNull(), // Email
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
    relatedBookingId: text('related_booking_id'), // Optional: to link a token to a specific booking action
});

// NEW TABLES FOR SCHEDULE MANAGEMENT

export const businessHours = sqliteTable('business_hours', {
    id: text('id').primaryKey(),
    dayOfWeek: integer('day_of_week').notNull().unique(), // 0=Sun, 1=Mon, ...
    openTime: text('open_time').notNull(), // HH:MM
    closeTime: text('close_time').notNull(), // HH:MM
    breakStart: text('break_start'), // HH:MM
    breakEnd: text('break_end'), // HH:MM
    isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
});

export const availabilityExceptions = sqliteTable('availability_exceptions', {
    id: text('id').primaryKey(),
    date: text('date').notNull().unique(), // YYYY-MM-DD
    openTime: text('open_time'), // HH:MM (Optional override)
    closeTime: text('close_time'), // HH:MM (Optional override)
    breakStart: text('break_start'), // HH:MM
    breakEnd: text('break_end'), // HH:MM
    isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
    reason: text('reason'),
});
