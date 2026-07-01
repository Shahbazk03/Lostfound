import { NextRequest, NextResponse } from "next/server";
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

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing GitHub OAuth credentials");
    return NextResponse.redirect(new URL("/login?error=ServerConfigurationError", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("GitHub token error:", tokenData.error_description || tokenData.error);
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data from GitHub");
    }

    const githubUser = await userResponse.json();
    
    // Fetch user emails (GitHub primary email might not be in the public profile)
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail ? primaryEmail.email : emails[0]?.email;
      }
    }

    if (!email) {
      throw new Error("No email returned from GitHub");
    }

    const name = githubUser.name || githubUser.login;

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
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await hashPassword(randomPassword);

      const newUsers = await db
        .insert(users)
        .values({
          email: email,
          name: name || "GitHub User",
          password: hashedPassword,
          verified: true, // GitHub users are implicitly verified
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
    console.error("GitHub auth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=GithubAuthFailed", request.url));
  }
}
