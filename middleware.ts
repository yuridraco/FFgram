import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("ff_session")?.value
  const { pathname } = request.nextUrl

  // Rotas públicas
  const publicPaths = ["/", "/login", "/cadastro", "/api/auth/login", "/api/auth/cadastro", "/api/verify-uid"]
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith("/api/auth/"))

  // Se não tem sessão e tenta acessar rota protegida
  if (!sessionToken && !isPublicPath && !pathname.startsWith("/_next") && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Se tem sessão e tenta acessar login/cadastro
  if (sessionToken && (pathname === "/login" || pathname === "/cadastro")) {
    const url = request.nextUrl.clone()
    url.pathname = "/feed"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
