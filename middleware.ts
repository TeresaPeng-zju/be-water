import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

export async function middleware(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  if (pathname === "/workspace") return NextResponse.next();

  let response = NextResponse.next({request});
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
        response = NextResponse.next({request});
        cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options));
      }
    }
  });

  const {data: {user}} = await supabase.auth.getUser();
  if (user) return response;

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {matcher: ["/workspace/:path+", "/diagnosis"]};
