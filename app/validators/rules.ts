import Role from '#models/role'
import User from '#models/user'
import vine from '@vinejs/vine'

export const uniqueEmail = vine.createRule(async (value, _, field) => {
  if (typeof value !== 'string') return

  const currentUserId = (field.meta as any)?.currentUserId as number | undefined

  const query = User.query().where('email', value)
  if (currentUserId) {
    query.whereNot('id', currentUserId)
  }

  const exists = await query.first()
  if (exists) {
    field.report('email has already been taken', 'unique', field)
  }
})

export const uniqueRoleSlug = vine.createRule(async (value, _, field) => {
  if (typeof value !== 'string') return

  const currentRoleId = (field.meta as any)?.currentRoleId as number | undefined

  const query = Role.query().where('slug', value)
  if (currentRoleId) {
    query.whereNot('id', currentRoleId)
  }

  const exists = await query.first()
  if (exists) {
    field.report('slug has already been taken', 'unique', field)
  }
}) 