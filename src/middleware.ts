import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Protect /admin routes
    if (path.startsWith("/admin")) {
        // Allow access to login page
        if (path === "/admin/login") {
            // If already logged in, redirect to dashboard
            const isAuth = request.cookies.get("admin_session");
            if (isAuth) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            return NextResponse.next();
        }

        // Check for admin session coookie
        const isAuth = request.cookies.get("admin_session");
        if (!isAuth) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
