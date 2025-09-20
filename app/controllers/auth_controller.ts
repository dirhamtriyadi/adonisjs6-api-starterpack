import User from '#models/user'
import AuditService from '#services/audit_service'
import { loginValidator, registerValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async register(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = await request.validateUsing(registerValidator)

    const user = await User.create({ fullName: payload.fullName ?? null, email: payload.email, password: payload.password })

    await AuditService.record(ctx, {
      action: 'register',
      resourceType: 'User',
      resourceId: user.id,
      after: { email: user.email, fullName: user.fullName },
      context: { controller: 'AuthController', action: 'register' },
      actor: user,
    })

    return response.success('User registered successfully', { id: user.id, email: user.email, fullName: user.fullName }, 201)
  }

  async login(ctx: HttpContext) {
    const { request, response } = ctx
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.findBy('email', email)
    if (!user) {
      return response.fail('Invalid credentials', undefined, 401)
    }

    const valid = await hash.verify(user.password, password)
    if (!valid) {
      return response.fail('Invalid credentials', undefined, 401)
    }

    const token = await User.accessTokens.create(user)

    await AuditService.record(ctx, {
      action: 'login',
      resourceType: 'Auth',
      resourceId: user.id,
      after: { email: user.email },
      context: { controller: 'AuthController', action: 'login' },
      actor: user, // Tambahkan actor yang sudah ditemukan
    })

    return response.success('Authenticated successfully', { token: token.value?.release(), type: token.type, expiresAt: token.expiresAt })
  }

  async logout(ctx: HttpContext) {
    const { auth, response } = ctx
    await auth.authenticate()

    const user = auth.getUserOrFail()

    await AuditService.record(ctx, {
      action: 'logout',
      resourceType: 'Auth',
      resourceId: user.id,
      before: { email: user.email },
      context: { controller: 'AuthController', action: 'logout' },
    })

    return response.success('Logged out successfully')
  }

  async me({ auth, response }: HttpContext) {
    await auth.authenticate()
    const user = auth.getUserOrFail()
    return response.success('Profile fetched successfully', { id: user.id, email: user.email, fullName: user.fullName })
  }

} 
