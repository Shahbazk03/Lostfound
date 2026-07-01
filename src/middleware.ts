import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "lost-and-found-secret-key-2026"
);

export async function middleware(request: NextRequest) {
  // We only want to protect routes that start with /admin
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  
  if (isAdminRoute) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      // No token found, redirect to login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify the JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Check if the user has the 'admin' role
      if (payload.role !== "admin") {
        // Logged in, but not an admin, redirect to home page
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
      }
      
      // Token is valid and user is an admin, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // Token verification failed (expired or invalid)
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For all other routes, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Apply middleware to all admin routes
    "/admin/:path*",
  ],
};
