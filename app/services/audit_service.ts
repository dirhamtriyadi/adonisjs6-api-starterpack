import AuditLog from '#models/audit_log'
import type User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | string

function asJsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export default class AuditService {
  static async record(
    ctx: HttpContext,
    params: {
      action: AuditAction
      resourceType: string
      resourceId: string | number
      before?: unknown
      after?: unknown
      context?: unknown
      actor?: User // Tambahkan parameter actor opsional
    }
  ) {
    const actor = params.actor || ctx.auth?.user

    await AuditLog.create({
      actorId: actor ? Number(actor.id) : null,
      actorEmail: actor?.email ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: String(params.resourceId),
      before: asJsonObject(params.before),
      after: asJsonObject(params.after),
      context: asJsonObject(params.context),
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent') ?? null,
      method: ctx.request.method(),
      path: ctx.request.url(),
    })
  }
}
