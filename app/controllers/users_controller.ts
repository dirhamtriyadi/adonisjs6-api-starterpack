import User from '#models/user'
import AuditService from '#services/audit_service'
import { computeChangedFields } from '#utils/diff'
import { normalizePaginator, parseListParams } from '#utils/listing'
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

    const paginator = await User.query()
      .if(!!search, (q) => {
        q.where((builder) => {
          builder.whereILike('email', `%${search}%`).orWhereILike('full_name', `%${search}%`)
        })
      })
      .orderBy(sortColumn, orderBy)
      .paginate(page, limit)

    return response.success('users.list', normalizePaginator(paginator))
  }

  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.success('users.read', user)
  }

  async store(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = await request.validateUsing(createUserValidator)

    const user = await User.create({ fullName: payload.fullName ?? null, email: payload.email, password: payload.password })

    if (Array.isArray(payload.permissions) && payload.permissions.length > 0) {
      //  lazy-load (memuat model Permission hanya saat diperlukan) 
      const Permission = (await import('#models/permission')).default
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

    return response.success('users.create', user, 201)
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
      // lazy-load (memuat model Permission hanya saat diperlukan) 
      const Permission = (await import('#models/permission')).default
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

    return response.success('users.update', user)
  }

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const user = await User.findOrFail(params.id)

    const before = user.serialize()
    await user.delete()
    await AuditService.record(ctx, {
      action: 'delete',
      resourceType: 'User',
      resourceId: user.id,
      before,
      context: { controller: 'UsersController', action: 'destroy' },
    })

    return response.success('users.delete', user)
  }
} 
