import Role from '#models/role'
import User from '#models/user'
import { column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SoftDeletes from './traits/soft_deletes.js'

export default class Permission extends SoftDeletes {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @manyToMany(() => Role, {
    pivotTable: 'permission_role',
    localKey: 'id',
    pivotForeignKey: 'permission_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare roles: ManyToMany<typeof Role>

  @manyToMany(() => User, {
    pivotTable: 'permission_user',
    localKey: 'id',
    pivotForeignKey: 'permission_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null
}
