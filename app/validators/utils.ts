import vine from '@vinejs/vine'
import { getValidationMeta, type ValidationMeta } from '#validators/types'

interface QueryBuilder {
  where(field: string, value: unknown): QueryBuilder
  whereNot(field: string, value: unknown): QueryBuilder
  first(): Promise<unknown>
}

interface QueryableModel {
  query(): QueryBuilder
}

export function uniqueBy<M extends QueryableModel>(Model: M, fieldName: string, excludeIdMetaKey?: keyof ValidationMeta) {
  return vine.createRule(async (value, _, field) => {
    if (typeof value !== 'string') return

    const q = Model.query().where(fieldName, value)

    if (excludeIdMetaKey) {
      const meta = getValidationMeta(field.meta)
      const excludeId = meta[excludeIdMetaKey]
      if (typeof excludeId === 'number') {
        q.whereNot('id', excludeId)
      }
    }

    const exists = await q.first()
    if (exists) {
      field.report(`${fieldName} has already been taken`, 'unique', field)
    }
  })
}
