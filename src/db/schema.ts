
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

    // Morning Shift
    morningStart: text('morning_start'), // HH:MM
    morningEnd: text('morning_end'), // HH:MM

    // Afternoon Shift
    afternoonStart: text('afternoon_start'), // HH:MM
    afternoonEnd: text('afternoon_end'), // HH:MM

    isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
});

export const availabilityExceptions = sqliteTable('availability_exceptions', {
    id: text('id').primaryKey(),
    startDate: text('start_date').notNull(), // YYYY-MM-DD
    endDate: text('end_date').notNull(), // YYYY-MM-DD

    // Morning Shift Override
    morningStart: text('morning_start'),
    morningEnd: text('morning_end'),

    // Afternoon Shift Override
    afternoonStart: text('afternoon_start'),
    afternoonEnd: text('afternoon_end'),

    isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
    reason: text('reason'),
});

export const settings = sqliteTable('settings', {
    id: text('id').primaryKey(), // Singleton row, always "1"
    publicNoticeActive: integer('public_notice_active', { mode: 'boolean' }).notNull().default(false),
    publicNoticeMessage: text('public_notice_message').notNull().default(""),
});
