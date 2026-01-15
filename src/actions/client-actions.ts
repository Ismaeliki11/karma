"use server";

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteClient(email: string) {
    try {
        await db.delete(bookings).where(eq(bookings.customerEmail, email));

        revalidatePath("/admin/clients");
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error deleting client:", error);
        return { success: false, error: "Error al eliminar el cliente" };
    }
}
