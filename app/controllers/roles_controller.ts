import Permission from '#models/permission'
import Role from '#models/role'
import AuditService from '#services/audit_service'
import { normalizePaginator, parseListParams } from '#utils/listing'
import { computeChangedFields } from '#utils/diff'
import { createRoleValidator, updateRoleValidator } from '#validators/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class RolesController {
  async index({ request, response }: HttpContext) {
    type Sortable = 'name' | 'slug' | 'createdAt'

    const { page, limit, search, sortColumn, orderBy } = parseListParams<Sortable>(request, {
      defaultSortBy: 'createdAt',
      allowedSortBy: ['name', 'slug', 'createdAt'] as const,
      mapSortBy: { createdAt: 'created_at' },
    })

    const paginator = await Role.query()
      .if(!!search, (q) => {
        q.where((builder) => {
          builder.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`)
        })
      })
      .orderBy(sortColumn, orderBy)
      .preload('permissions')
      .paginate(page, limit)

    return response.success('roles.list', normalizePaginator(paginator))
  }

  async show({ params, response }: HttpContext) {
    const role = await Role.query().where('id', params.id).preload('permissions').firstOrFail()
    return response.success('roles.read', role)
  }

  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = await request.validateUsing(createRoleValidator)

    const role = await Role.create({ name: payload.name, slug: payload.slug })

    if (Array.isArray(payload.permissions) && payload.permissions.length > 0) {
      const perms = await Permission.query().whereIn('slug', payload.permissions)
      await role.related('permissions').sync(perms.map((p) => p.id))
    }

    await role.load('permissions')

    await AuditService.record(ctx, {
      action: 'create',
      resourceType: 'Role',
      resourceId: role.id,
      after: role.serialize(),
      context: { controller: 'RolesController', action: 'store' },
    })

    return response.success('roles.create', role, 201)
  }

  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const role = await Role.findOrFail(params.id)

    await role.load('permissions')
    const before = role.serialize()

    const payload = await request.validateUsing(updateRoleValidator, {
      meta: { currentRoleId: role.id },
    })

    if (payload.slug && payload.slug !== role.slug) {
      role.slug = payload.slug
    }

    if (typeof payload.name !== 'undefined') {
      role.name = payload.name
    }

    await role.save()

    if (Array.isArray(payload.permissions)) {
      const perms = await Permission.query().whereIn('slug', payload.permissions)
      await role.related('permissions').sync(perms.map((p) => p.id))
    }

    await role.load('permissions')
    const after = role.serialize()

    const changedFields = computeChangedFields(before as Record<string, unknown>, after as Record<string, unknown>)
    await AuditService.record(ctx, {
      action: 'update',
      resourceType: 'Role',
      resourceId: role.id,
      before,
      after,
      context: { controller: 'RolesController', action: 'update', changedFields },
    })

    return response.success('roles.update', role)
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const role = await Role.findOrFail(params.id)

    await role.load('permissions')
    const before = role.serialize()

    await role.delete()

    await AuditService.record(ctx, {
      action: 'delete',
      resourceType: 'Role',
      resourceId: role.id,
      before,
      context: { controller: 'RolesController', action: 'destroy' },
    })

    return response.success('roles.delete', { id: role.id })
  }
} 
