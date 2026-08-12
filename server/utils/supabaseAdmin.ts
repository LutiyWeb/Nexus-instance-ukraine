import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

// Service-role client — server-only, must never be imported by client code.
// Files under server/ are excluded from the client bundle by Nitro, which is
// the only thing keeping this key off the wire.
export function useSupabaseAdmin() {
  if (client) return client

  const config = useRuntimeConfig()
  client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })
  return client
}
