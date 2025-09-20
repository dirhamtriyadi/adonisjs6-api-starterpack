import AuditLog from '#models/audit_log'
import { normalizePaginator, parseListParams } from '#utils/listing'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuditLogsController {
  async index({ request, response }: HttpContext) {
    type Sortable =
      | 'createdAt'
      | 'action'
      | 'resourceType'
      | 'resourceId'
      | 'actorEmail'
      | 'method'
      | 'path'
      | 'ip'

    const { page, limit, search, sortColumn, orderBy } = parseListParams<Sortable>(request, {
      defaultSortBy: 'createdAt',
      allowedSortBy: ['createdAt', 'action', 'resourceType', 'resourceId', 'actorEmail', 'method', 'path', 'ip'] as const,
      mapSortBy: {
        createdAt: 'created_at',
        resourceType: 'resource_type',
        resourceId: 'resource_id',
        actorEmail: 'actor_email',
      },
    })

    const q = AuditLog.query()
      .if(!!search, (qb) => {
        qb.where((builder) => {
          builder
            .orWhereILike('action', `%${search}%`)
            .orWhereILike('resource_type', `%${search}%`)
            .orWhereILike('resource_id', `%${search}%`)
            .orWhereILike('actor_email', `%${search}%`)
            .orWhereILike('ip', `%${search}%`)
            .orWhereILike('user_agent', `%${search}%`)
            .orWhereILike('method', `%${search}%`)
            .orWhereILike('path', `%${search}%`)
        })
      })

    // Optional filters
    const resourceType = request.input('resourceType') as string | undefined
    const resourceId = request.input('resourceId') as string | number | undefined
    const action = request.input('action') as string | undefined
    const actorId = request.input('actorId') as string | number | undefined
    const actorEmail = request.input('actorEmail') as string | undefined

    q.if(!!resourceType, (qb) => qb.where('resource_type', resourceType!))
      .if(!!resourceId, (qb) => qb.where('resource_id', String(resourceId!)))
      .if(!!action, (qb) => qb.where('action', action!))
      .if(!!actorId, (qb) => qb.where('actor_id', Number(actorId!)))
      .if(!!actorEmail, (qb) => qb.whereILike('actor_email', `%${actorEmail!}%`))

    const paginator = await q.orderBy(sortColumn, orderBy).paginate(page, limit)
    return response.success('Audit logs fetched successfully', normalizePaginator(paginator))
  }

  async show({ params, response }: HttpContext) {
    const log = await AuditLog.findOrFail(params.id)
    return response.success('Audit log fetched successfully', log)
  }
}
