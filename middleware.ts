import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // ── Protección del panel admin ──────────────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = req.cookies.get('admin_token')?.value
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret || adminToken !== adminSecret) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // ── Portal inversores ───────────────────────────────────
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (pathname.startsWith('/inversores/dashboard') && !session) {
    return NextResponse.redirect(new URL('/inversores/login', req.url))
  }

  if ((pathname === '/inversores/login' || pathname === '/inversores/register') && session) {
    return NextResponse.redirect(new URL('/inversores/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/inversores/dashboard/:path*',
    '/inversores/login',
    '/inversores/register',
  ],
}
