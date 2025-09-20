import Permission from '#models/permission'
import User from '#models/user'
import AuditService from '#services/audit_service'
import { computeChangedFields } from '#utils/diff'
import { normalizePaginator, parseListParams } from '#utils/listing'
import { getEffectivePermissionSlugs } from '#utils/permissions'
import { bulkIdsValidator } from '#validators/bulk'
import { createUserValidator, updateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async index({ request, response }: HttpContext) {
    type Sortable = 'email' | 'fullName' | 'createdAt'

    const { page, limit, search, sortColumn, orderBy } = parseListParams<Sortable>(request, {
      defaultSortBy: 'createdAt',
      allowedSortBy: ['email', 'fullName', 'createdAt'] as const,
      mapSortBy: { fullName: 'full_name', createdAt: 'created_at' },
    })

    const trashed = request.input('trashed') as 'only' | 'with' | undefined

    const paginator = await User.query()
      .if(trashed === 'only', (q) => q.apply((scopes) => scopes.onlyTrashed()))
      .if(trashed === 'with', (q) => q.apply((scopes) => scopes.withTrashed()))
      .if(!!search, (q) => {
        q.where((builder) => {
          builder.whereILike('email', `%${search}%`).orWhereILike('full_name', `%${search}%`)
        })
      })
      .orderBy(sortColumn, orderBy)
      .paginate(page, limit)

    return response.success('Users fetched successfully', normalizePaginator(paginator))
  }

  async show({ params, request, response }: HttpContext) {
    const includeTrashed = request.input('withTrashed') === 'true'
    const query = User.query().where('id', params.id)
    if (includeTrashed) query.apply((scopes) => scopes.withTrashed())
    const user = await query.firstOrFail()
    return response.success('User fetched successfully', user)
  }


  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = await request.validateUsing(createUserValidator)

    const user = await User.create({ fullName: payload.fullName ?? null, email: payload.email, password: payload.password })

    if (Array.isArray(payload.permissions) && payload.permissions.length > 0) {
      const actor = ctx.auth.getUserOrFail()
      const allowed = await getEffectivePermissionSlugs(actor)
      const disallowed = payload.permissions.filter((s) => !allowed.has(s))
      if (disallowed.length > 0) {
        return response.fail('You cannot grant permissions you do not possess', { disallowed }, 403)
      }

      const perms = await Permission.query().whereIn('slug', payload.permissions)
      await user.related('permissions').sync(perms.map((p) => p.id))
    }

    await AuditService.record(ctx, {
      action: 'create',
      resourceType: 'User',
      resourceId: user.id,
      after: user.serialize(), // snapshot penuh
      context: { controller: 'UsersController', action: 'store' },
    })

    return response.success('User created successfully', user, 201)
  }

  async update(ctx: HttpContext) {
    const { params, request, response } = ctx
    const user = await User.findOrFail(params.id)

    const before = user.serialize()

    const payload = await request.validateUsing(updateUserValidator, {
      meta: { currentUserId: user.id },
    })

    if (payload.email && payload.email !== user.email) {
      user.email = payload.email
    }

    if (typeof payload.fullName !== 'undefined') {
      user.fullName = payload.fullName
    }

    if (payload.password) {
      user.password = payload.password
    }

    await user.save()

    const payloadPermissions = payload.permissions
    if (Array.isArray(payloadPermissions)) {
      const actor = ctx.auth.getUserOrFail()
      const allowed = await getEffectivePermissionSlugs(actor)
      const disallowed = payloadPermissions.filter((s) => !allowed.has(s))
      if (disallowed.length > 0) {
        return response.fail('You cannot grant permissions you do not possess', { disallowed }, 403)
      }

      const perms = await Permission.query().whereIn('slug', payloadPermissions)
      await user.related('permissions').sync(perms.map((p) => p.id))
    }
    await user.refresh()
    const after = user.serialize()

    const changedFields = computeChangedFields(before as Record<string, unknown>, after as Record<string, unknown>)
    await AuditService.record(ctx, {
      action: 'update',
      resourceType: 'User',
      resourceId: user.id,
      before,
      after,
      context: { controller: 'UsersController', action: 'update', changedFields },
    })

    return response.success('User updated successfully', user)
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const user = await User.query().where('id', params.id).firstOrFail()

    const before = user.serialize()
    await user.trash()
    await AuditService.record(ctx, {
      action: 'soft_delete',
      resourceType: 'User',
      resourceId: user.id,
      before,
      after: { deletedAt: user.deletedAt },
      context: { controller: 'UsersController', action: 'destroy' },
    })

    return response.success('User deleted successfully', user)
  }

  async restore(ctx: HttpContext) {
    const { params, response } = ctx
    const user = await User.query().apply((scopes) => scopes.onlyTrashed()).where('id', params.id).firstOrFail()
    const before = user.serialize()
    await user.restore()
    await AuditService.record(ctx, {
      action: 'restore',
      resourceType: 'User',
      resourceId: user.id,
      before,
      after: { deletedAt: user.deletedAt },
      context: { controller: 'UsersController', action: 'restore' },
    })
    return response.success('User restored successfully', user)
  }

  async forceDelete(ctx: HttpContext) {
    const { params, response } = ctx
    const user = await User.query().where('id', params.id).firstOrFail()
    const before = user.serialize()
    await user.forceDelete()
    await AuditService.record(ctx, {
      action: 'force_delete',
      resourceType: 'User',
      resourceId: user.id,
      before,
      context: { controller: 'UsersController', action: 'forceDelete' },
    })
    return response.success('User permanently deleted successfully', { id: Number(params.id) })
  }

  async bulkDelete(ctx: HttpContext) {
    const { request, response } = ctx
    const { ids } = await request.validateUsing(bulkIdsValidator)
    const affected = await (User as any).bulkTrash(ids)
    await AuditService.record(ctx, {
      action: 'soft_delete_bulk',
      resourceType: 'User',
      resourceId: 0,
      after: { ids, affected },
      context: { controller: 'UsersController', action: 'bulkDelete' },
    })
    return response.success('Users deleted successfully', { affected })
  }

  async bulkRestore(ctx: HttpContext) {
    const { request, response } = ctx
    const { ids } = await request.validateUsing(bulkIdsValidator)
    const affected = await User.bulkRestore(ids)
    await AuditService.record(ctx, {
      action: 'restore_bulk',
      resourceType: 'User',
      resourceId: 0,
      after: { ids, affected },
      context: { controller: 'UsersController', action: 'bulkRestore' },
    })
    return response.success('Users restored successfully', { affected })
  }

  async bulkForceDelete(ctx: HttpContext) {
    const { request, response } = ctx
    const { ids } = await request.validateUsing(bulkIdsValidator)
    const affected = await User.bulkForceDelete(ids)
    await AuditService.record(ctx, {
      action: 'force_delete_bulk',
      resourceType: 'User',
      resourceId: 0,
      after: { ids, affected },
      context: { controller: 'UsersController', action: 'bulkForceDelete' },
    })
    return response.success('Users permanently deleted successfully', { affected })
  }

} 
