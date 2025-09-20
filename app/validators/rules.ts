import Role from '#models/role'
import User from '#models/user'
import { uniqueBy } from '#validators/utils'

export const uniqueEmail = uniqueBy(User, 'email', 'currentUserId')

export const uniqueRoleSlug = uniqueBy(Role, 'slug', 'currentRoleId')
