import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

function getEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
const supabaseAnonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

let supabaseAuthDisconnected = false
let databaseDisconnected = false

export const isSupabaseAuthDisconnected = () => supabaseAuthDisconnected
export const isDatabaseDisconnected = () => databaseDisconnected
export const isSupabaseDisconnected = () => supabaseAuthDisconnected || databaseDisconnected
export const markAuthDisconnected = () => {
  supabaseAuthDisconnected = true
}
export const markDatabaseDisconnected = () => {
  databaseDisconnected = true
}
export const resetSupabaseConnection = () => {
  supabaseAuthDisconnected = false
  databaseDisconnected = false
}

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

export const createSupabaseProxyClient = (request: NextRequest, signal?: AbortSignal) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: signal
      ? {
          fetch: (url, options) => fetch(url, { ...options, signal }),
        }
      : undefined,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  return { supabase, response }
}
