import { jwtVerify } from 'jose'

// Verifies the same access token shopmarker-backend issues on login — same
// signing secret, same HS256/role claim — so this route piggybacks on the
// site's existing admin login instead of needing a backend endpoint of its
// own or a secret baked into the page.
export default defineEventHandler(async (event) => {
  const auth = getHeader(event, 'authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Не авторизовано.' })

  const config = useRuntimeConfig()
  let role: unknown
  try {
    ;({
      payload: { role },
    } = await jwtVerify(token, new TextEncoder().encode(config.jwtAccessSecret)))
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Недійсний токен.' })
  }
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Немає доступу.' })
  }

  const supabase = useSupabaseAdmin()
  const { data, error } = await supabase
    .from('bug_reports')
    .select('id, title, description, image_url, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не вдалося завантажити звіти.' })
  }

  return { data }
})
