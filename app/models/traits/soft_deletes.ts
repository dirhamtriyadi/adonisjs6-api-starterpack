import { BaseModel, beforeFetch, beforeFind, beforePaginate, column, scope } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

type TrashedFlag = 'with' | 'only' | undefined

export default class SoftDeletes extends BaseModel {
  @column.dateTime()
  declare deletedAt: DateTime | null

  // Scopes
  static withTrashed = scope((query: any) => {
    ;(query as any).softDeleteFlag = 'with' as TrashedFlag
  })

  static onlyTrashed = scope((query: any) => {
    ;(query as any).softDeleteFlag = 'only' as TrashedFlag
    if (query.model?.table) {
      query.whereNotNull(`${query.model.table}.deleted_at`)
    }
  })

  // Global hooks: hide trashed by default
  @beforeFind()
  static ignoreTrashedOnFind(query: any) {
    const flag: TrashedFlag = (query as any).softDeleteFlag
    if (flag === 'with' || flag === 'only') return
    if (!query.model?.table) return
    query.whereNull(`${query.model.table}.deleted_at`)
  }

  @beforeFetch()
  static ignoreTrashedOnFetch(query: any) {
    const flag: TrashedFlag = (query as any).softDeleteFlag
    if (flag === 'with' || flag === 'only') return
    if (!query.model?.table) return
    query.whereNull(`${query.model.table}.deleted_at`)
  }

  @beforePaginate()
  static ignoreTrashedOnPaginate(query: any) {
    const flag: TrashedFlag = (query as any).softDeleteFlag
    if (flag === 'with' || flag === 'only') return
    if (!query.model?.table) return
    query.whereNull(`${query.model.table}.deleted_at`)
  }

  // Instance helpers
  async trash() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  async softDelete() {
    await this.trash()
  }

  async restore() {
    this.deletedAt = null
    await this.save()
  }

  async forceDelete() {
    await (this.constructor as typeof SoftDeletes).query().apply((scopes) => scopes.withTrashed()).where('id', this.$attributes.id).delete()
  }

  // Static bulk helpers
  static async bulkTrash(ids: (number | string)[]) {
    return this.query().update({ deleted_at: DateTime.now().toSQL() }).whereIn('id', ids)
  }

  static async bulkRestore(ids: (number | string)[]) {
    return this.query().apply((scopes) => scopes.withTrashed()).update({ deleted_at: null }).whereIn('id', ids)
  }

  static async bulkForceDelete(ids: (number | string)[]) {
    return this.query().apply((scopes) => scopes.withTrashed()).whereIn('id', ids).delete()
  }
}
