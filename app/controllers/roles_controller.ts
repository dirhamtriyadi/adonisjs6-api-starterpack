import Permission from '#models/permission'
import Role from '#models/role'
import AuditService from '#services/audit_service'
import { computeChangedFields } from '#utils/diff'
import { normalizePaginator, parseListParams } from '#utils/listing'
import { getEffectivePermissionSlugs } from '#utils/permissions'
import { bulkIdsValidator } from '#validators/bulk'
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

    const trashed = request.input('trashed') as 'only' | 'with' | undefined

    const paginator = await Role.query()
      .if(trashed === 'only', (q) => q.apply((scopes) => scopes.onlyTrashed()))
      .if(trashed === 'with', (q) => q.apply((scopes) => scopes.withTrashed()))
      .if(!!search, (q) => {
        q.where((builder) => {
          builder.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`)
        })
      })
      .orderBy(sortColumn, orderBy)
      .preload('permissions')
      .paginate(page, limit)

    return response.success('Roles fetched successfully', normalizePaginator(paginator))
  }

  async show({ params, request, response }: HttpContext) {
    const includeTrashed = request.input('withTrashed') === 'true'
    const q = Role.query().where('id', params.id)
    if (includeTrashed) q.apply((scopes) => scopes.withTrashed())
    const role = await q.preload('permissions').firstOrFail()
    return response.success('Role fetched successfully', role)
  }

  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = await request.validateUsing(createRoleValidator)

    const role = await Role.create({ name: payload.name, slug: payload.slug })

    if (Array.isArray(payload.permissions) && payload.permissions.length > 0) {
      const actor = ctx.auth.getUserOrFail()
      const allowed = await getEffectivePermissionSlugs(actor)
      const disallowed = payload.permissions.filter((s) => !allowed.has(s))
      if (disallowed.length > 0) {
        return ctx.response.fail('You cannot grant permissions you do not possess', { disallowed }, 403)
      }

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

    return response.success('Role created successfully', role, 201)
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
      const actor = ctx.auth.getUserOrFail()
      const allowed = await getEffectivePermissionSlugs(actor)
      const disallowed = payload.permissions.filter((s) => !allowed.has(s))
      if (disallowed.length > 0) {
        return ctx.response.fail('You cannot grant permissions you do not possess', { disallowed }, 403)
      }

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

    return response.success('Role updated successfully', role)
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const role = await Role.query().where('id', params.id).firstOrFail()

    await role.load('permissions')
    const before = role.serialize()
    await role.trash()

    await AuditService.record(ctx, {
      action: 'soft_delete',
      resourceType: 'Role',
      resourceId: role.id,
      before,
      after: { deletedAt: role.deletedAt },
      context: { controller: 'RolesController', action: 'destroy' },
    })

    return response.success('Role deleted successfully', { id: role.id })
  }

  async restore(ctx: HttpContext) {
    const { params, response } = ctx
    const role = await Role.query().apply((scopes) => scopes.onlyTrashed()).where('id', params.id).firstOrFail()
    const before = role.serialize()
    await role.restore()
    await AuditService.record(ctx, {
      action: 'restore',
      resourceType: 'Role',
      resourceId: role.id,
      before,
      after: { deletedAt: role.deletedAt },
      context: { controller: 'RolesController', action: 'restore' },
    })
    return response.success('Role restored successfully', role)
  }

  async forceDelete(ctx: HttpContext) {
    const { params, response } = ctx
    const role = await Role.query().where('id', params.id).firstOrFail()
    await role.load('permissions')
    const before = role.serialize()
    await role.forceDelete()
    await AuditService.record(ctx, {
      action: 'force_delete',
      resourceType: 'Role',
      resourceId: role.id,
      before,
      context: { controller: 'RolesController', action: 'forceDelete' },
    })
    return response.success('Role permanently deleted successfully', { id: role.id })
  }

  async bulkDelete(ctx: HttpContext) {
    const { request, response } = ctx
    const { ids } = await request.validateUsing(bulkIdsValidator)
    const affected = await (Role as any).bulkTrash(ids)
    await AuditService.record(ctx, {
      action: 'soft_delete_bulk',
      resourceType: 'Role',
      resourceId: 0,
      after: { ids, affected },
      context: { controller: 'RolesController', action: 'bulkDelete' },
    })
    return response.success('Roles deleted successfully', { affected })
  }

  async bulkRestore(ctx: HttpContext) {
    const { request, response } = ctx
    const { ids } = await request.validateUsing(bulkIdsValidator)
    const affected = await Role.bulkRestore(ids)
    await AuditService.record(ctx, {
      action: 'restore_bulk',
      resourceType: 'Role',
      resourceId: 0,
      after: { ids, affected },
      context: { controller: 'RolesController', action: 'bulkRestore' },
    })
    return response.success('Roles restored successfully', { affected })
  }

  async bulkForceDelete(ctx: HttpContext) {
    const { request, response } = ctx
    const { ids } = await request.validateUsing(bulkIdsValidator)
    const affected = await Role.bulkForceDelete(ids)
    await AuditService.record(ctx, {
      action: 'force_delete_bulk',
      resourceType: 'Role',
      resourceId: 0,
      after: { ids, affected },
      context: { controller: 'RolesController', action: 'bulkForceDelete' },
    })
    return response.success('Roles permanently deleted successfully', { affected })
  }
} 
