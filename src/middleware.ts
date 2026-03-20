import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function isValidToken(token: string): Promise<boolean> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("auth_token")?.value;
    if (!token || !(await isValidToken(token))) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/api/dashboard")) {
    const token = req.cookies.get("auth_token")?.value;
    if (!token || !(await isValidToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
