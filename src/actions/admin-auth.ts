"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Credentials should be set in Netlify Environment Variables
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

export async function loginAdmin(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        // Set HTTP-only secure cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return { success: true };
    }

    return { success: false, error: "Credenciales incorrectas" };
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/admin/login");
}
