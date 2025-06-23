import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const token = request.cookies.get("access_token");
  const publicPaths = ["/auth/login", "/auth/register"];
  if (!publicPaths.includes(request.nextUrl.pathname)) {
    if (!token) {
      // 如果没有 token，重定向到登录页
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", request.nextUrl.pathname); // 记录原路径，登录后可以跳回
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// 配置 middleware 作用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - /api (API 路由)
     * - /_next/static (静态文件)
     * - /_next/image (图片优化文件)
     * - /favicon.ico (favicon 文件)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
