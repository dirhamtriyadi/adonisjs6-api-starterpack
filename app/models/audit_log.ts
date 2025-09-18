import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'actor_id' })
  declare actorId: number | null

  @column({ columnName: 'actor_email' })
  declare actorEmail: string | null

  @column()
  declare action: string

  @column({ columnName: 'resource_type' })
  declare resourceType: string

  @column({ columnName: 'resource_id' })
  declare resourceId: string

  @column()
  declare before: Record<string, unknown> | null

  @column()
  declare after: Record<string, unknown> | null

  @column()
  declare context: Record<string, unknown> | null

  @column()
  declare ip: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column()
  declare method: string | null

  @column()
  declare path: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
} 
