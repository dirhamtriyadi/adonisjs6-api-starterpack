import Permission from '#models/permission'
import User from '#models/user'
import AuditService from '#services/audit_service'
import { permissionsArrayValidator } from '#validators/user_permissions'
import type { HttpContext } from '@adonisjs/core/http'

export default class UserPermissionsController {
  async index({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.load('permissions')
    return response.success('users.permissions.list', user.permissions)
  }

  async attach(ctx: HttpContext) {
    const { params, request, response } = ctx
    const user = await User.findOrFail(params.id)
    const { permissions } = await request.validateUsing(permissionsArrayValidator)

    const perms = await Permission.query().whereIn('slug', permissions)
    const foundSlugs = new Set(perms.map((p) => p.slug))
    const missing = permissions.filter((s) => !foundSlugs.has(s))
    if (missing.length > 0) {
      return response.fail('Some permissions not found', { missing }, 422)
    }

    await user.load('permissions')
    const before = user.permissions.map((p) => p.slug)
    await user.related('permissions').sync(perms.map((p) => p.id), false)
    await user.load('permissions')
    const after = user.permissions.map((p) => p.slug)

    await AuditService.record(ctx, {
      action: 'update',
      resourceType: 'User',
      resourceId: user.id,
      before: { permissions: before },
      after: { permissions: after },
      context: { controller: 'UserPermissionsController', action: 'attach' },
    })

    return response.success('users.permissions.attach', { permissions: after })
  }

  async sync(ctx: HttpContext) {
    const { params, request, response } = ctx
    const user = await User.findOrFail(params.id)
    const { permissions } = await request.validateUsing(permissionsArrayValidator)

    const perms = await Permission.query().whereIn('slug', permissions)
    const foundSlugs = new Set(perms.map((p) => p.slug))
    const missing = permissions.filter((s) => !foundSlugs.has(s))
    if (missing.length > 0) {
      return response.fail('Some permissions not found', { missing }, 422)
    }

    await user.load('permissions')
    const before = user.permissions.map((p) => p.slug)
    await user.related('permissions').detach(perms.map((p) => p.id))
    await user.load('permissions')
    const after = user.permissions.map((p) => p.slug)

    await AuditService.record(ctx, {
      action: 'update',
      resourceType: 'User',
      resourceId: user.id,
      before: { permissions: before },
      after: { permissions: after },
      context: { controller: 'UserPermissionsController', action: 'sync' },
    })

    return response.success('users.permissions.sync', { permissions: after })
  }

  async detach(ctx: HttpContext) {
    const { params, request, response } = ctx
    const user = await User.findOrFail(params.id)
    const { permissions } = await request.validateUsing(permissionsArrayValidator)

    const perms = await Permission.query().whereIn('slug', permissions)
    const foundSlugs = new Set(perms.map((p) => p.slug))
    const missing = permissions.filter((s) => !foundSlugs.has(s))
    if (missing.length > 0) {
      return response.fail('Some permissions not found', { missing }, 422)
    }

    await user.load('permissions')
    const before = user.permissions.map((p) => p.slug)
    await user.related('permissions').detach(perms.map((p) => p.id))
    await user.load('permissions')
    const after = user.permissions.map((p) => p.slug)

    await AuditService.record(ctx, {
      action: 'update',
      resourceType: 'User',
      resourceId: user.id,
      before: { permissions: before },
      after: { permissions: after },
      context: { controller: 'UserPermissionsController', action: 'detach' },
    })

    return response.success('users.permissions.detach', { permissions: after })
  }
}

