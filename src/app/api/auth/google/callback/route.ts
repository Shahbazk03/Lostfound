import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setAuthCookie, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=NoCodeProvided", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Google OAuth credentials");
    return NextResponse.redirect(new URL("/login?error=ServerConfigurationError", request.url));
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify and decode the ID token
    if (!tokens.id_token) {
      throw new Error("No ID token returned from Google");
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error("Invalid token payload");
    }

    const { email, name } = payload;

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      // User doesn't exist, create a new one.
      // Generate a secure random password since password is NOT NULL in schema
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await hashPassword(randomPassword);

      const newUsers = await db
        .insert(users)
        .values({
          email: email,
          name: name || "Google User",
          password: hashedPassword,
          verified: true, // Google users are implicitly verified
          role: "user",
        })
        .returning();

      user = newUsers[0];
    }

    // Generate token and set cookie
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Google auth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=GoogleAuthFailed", request.url));
  }
}
