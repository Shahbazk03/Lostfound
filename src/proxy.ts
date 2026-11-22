import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return redirectToLogin(request);

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Fail closed: without a configured secret nobody gets into /admin.
    console.error("JWT_SECRET is not configured; blocking admin access.");
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

// Page routes only. Every /api/admin/* handler and every admin server action
// must ALSO call requireAdmin() itself — middleware is not a security boundary
// for server actions or API routes.
export const config = {
  matcher: ["/admin/:path*"],
};
