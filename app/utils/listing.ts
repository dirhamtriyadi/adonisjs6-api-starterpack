import type { HttpContext } from '@adonisjs/core/http'

export type Order = 'asc' | 'desc'

export function parseListParams<TSortable extends string>(
  request: HttpContext['request'],
  options: {
    defaultSortBy: TSortable
    allowedSortBy: readonly TSortable[]
    mapSortBy?: Record<string, string>
    defaultOrderBy?: Order
    defaultPage?: number
    defaultLimit?: number
  }
) {
  const page = Number(request.input('page', options.defaultPage ?? 1)) || (options.defaultPage ?? 1)
  const limit = Number(request.input('limit', options.defaultLimit ?? 10)) || (options.defaultLimit ?? 10)

  const rawSearch = (request.input('search') || '').toString()
  const search = rawSearch.trim()

  const rawSortBy = (request.input('sortBy') || options.defaultSortBy).toString()
  const sortBy = (options.allowedSortBy as readonly string[]).includes(rawSortBy)
    ? (rawSortBy as TSortable)
    : options.defaultSortBy

  const rawOrderBy = (request.input('orderBy') || options.defaultOrderBy || 'desc').toString().toLowerCase()
  const orderBy: Order = rawOrderBy === 'asc' ? 'asc' : 'desc'

  const sortColumn = options.mapSortBy?.[sortBy] ?? sortBy

  return { page, limit, search, sortBy, sortColumn, orderBy }
}

export function normalizePaginator<TItem, TMeta extends Record<string, unknown> = Record<string, unknown>>(
  paginator: { serialize: () => { meta: TMeta; data: TItem[] } }
) {
  const { meta, data } = paginator.serialize()
  return { meta, items: data }
} 