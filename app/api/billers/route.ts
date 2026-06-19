import { HttpError, requireSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'

type BillerRow = {
  id: number
  slug: string
  name: string
  category: string
  logo_path: string | null
}

export async function GET() {
  try {
    await requireSession()

    const result = await query<BillerRow>(
      'SELECT id, slug, name, category, logo_path FROM billers ORDER BY name'
    )

    return Response.json({
      ok: true,
      billers: result.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        logoPath: row.logo_path
      }))
    })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}
