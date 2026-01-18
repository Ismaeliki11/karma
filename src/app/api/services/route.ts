
import { NextResponse } from 'next/server';
export const runtime = "edge";
import { db } from '@/db';
import { services } from '@/db/schema';
import { nanoid } from 'nanoid';

export async function GET() {
    try {
        const allServices = await db.select().from(services);
        return NextResponse.json(allServices);
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, type, price, duration, imageUrl } = body;

        // Basic validation
        if (!name || !type || !price || !duration) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newService = await db.insert(services).values({
            id: nanoid(),
            name,
            description,
            type,
            price: Number(price),
            duration: Number(duration),
            imageUrl,
        }).returning();

        return NextResponse.json(newService[0]);
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
}
