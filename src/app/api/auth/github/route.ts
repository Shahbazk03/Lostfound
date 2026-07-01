import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=GithubAuthNotConfigured", request.url));
  }

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/github/callback`;

  // Construct the GitHub OAuth URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.append("client_id", clientId);
  githubAuthUrl.searchParams.append("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.append("scope", "read:user user:email");
  githubAuthUrl.searchParams.append("response_type", "code");

  return NextResponse.redirect(githubAuthUrl.toString());
}
