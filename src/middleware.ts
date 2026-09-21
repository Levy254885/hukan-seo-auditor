import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/api/auth") ||
          path === "/" ||
          path.startsWith("/features") ||
          path.startsWith("/pricing") ||
          path.startsWith("/how-it-works") ||
          path.startsWith("/contact") ||
          path.startsWith("/privacy") ||
          path.startsWith("/terms") ||
          path.startsWith("/refund-policy") ||
          path.startsWith("/seo-audit")
        ) {
          return true;
        }
        if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
