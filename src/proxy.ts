import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PROTECTED = ["/dashboard", "/chores", "/members", "/rewards"];
const AUTH_PAGES = ["/login", "/join"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Optimistic gate only — it checks that a valid session cookie exists so we can
 * redirect early. Real authorization (role checks, family scoping) happens in
 * `requireUser` / `requireParent` on every page and action.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (matches(pathname, PROTECTED) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (matches(pathname, AUTH_PAGES) && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chores/:path*",
    "/members/:path*",
    "/rewards/:path*",
    "/login",
    "/join",
  ],
};
