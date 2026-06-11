import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  if (pathname.startsWith('/inversores/dashboard') && !session) {
    return NextResponse.redirect(new URL('/inversores/login', req.url))
  }

  if ((pathname === '/inversores/login' || pathname === '/inversores/register') && session) {
    return NextResponse.redirect(new URL('/inversores/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/inversores/dashboard/:path*', '/inversores/login', '/inversores/register'],
}
