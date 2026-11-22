import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Being logged out is a normal state, not an error: answer 200 with
// `{ user: null }` so browsers don't log a failed request on every page view.
// Pages that need a session enforce it with their own 401s.
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { headers: NO_STORE });
    }
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          verified: user.verified,
          avatar: user.avatar,
          hasSubscription: user.hasSubscription,
        },
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    // Treat an unreadable session as logged out, but keep the cause visible.
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { headers: NO_STORE });
  }
}
