import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthorizeMiddleware {
  async handle(ctx: HttpContext, next: NextFn, requiredPermissions: string[] = []) {
    await ctx.auth.authenticate()

    const user = ctx.auth.getUserOrFail() as User

    if (requiredPermissions.length === 0) {
      return next()
    }

    await user.load('roles', (rolesQuery) => {
      rolesQuery.preload('permissions')
    })

    const userPermissions = new Set<string>()
    for (const role of user.roles) {
      for (const perm of role.permissions) {
        userPermissions.add(perm.slug)
      }
    }

    const isAllowed = requiredPermissions.every((p) => userPermissions.has(p))

    if (!isAllowed) {
      return ctx.response.fail('Insufficient permissions to access this resource', undefined, 403)
    }

    return next()
  }
} 