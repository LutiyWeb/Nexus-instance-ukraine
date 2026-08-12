function safeExtension(filename: string, type: string) {
  const match = filename.match(/\.([a-zA-Z0-9]{1,6})$/)
  if (match) return match[1].toLowerCase()
  const [, subtype] = type.split('/')
  return subtype ? subtype.split(';')[0].trim().toLowerCase() : 'bin'
}

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 400, statusMessage: 'Очікувались form-data.' })
  }

  const title =
    parts
      .find((p) => p.name === 'title')
      ?.data.toString('utf-8')
      .trim() ?? ''
  const description =
    parts
      .find((p) => p.name === 'description')
      ?.data.toString('utf-8')
      .trim() ?? ''
  const screenshot = parts.find((p) => p.name === 'screenshot' && p.filename)

  if (!title || !description) {
    throw createError({ statusCode: 400, statusMessage: 'Заголовок і опис обов’язкові.' })
  }

  const config = useRuntimeConfig()
  const supabase = useSupabaseAdmin()

  let imageUrl: string | null = null
  if (screenshot && screenshot.filename && screenshot.type?.startsWith('image/')) {
    const ext = safeExtension(screenshot.filename, screenshot.type)
    const rand = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join(
      '',
    )
    const path = `bug-reports/${Date.now()}-${rand}.${ext}`

    const { error } = await supabase.storage
      .from(config.supabaseStorageBucket)
      .upload(path, screenshot.data, { contentType: screenshot.type, cacheControl: '31536000' })

    if (!error) {
      imageUrl = supabase.storage.from(config.supabaseStorageBucket).getPublicUrl(path)
        .data.publicUrl
    }
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({ title, description, image_url: imageUrl })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Не вдалося зберегти звіт.' })
  }

  return { data }
})
