import { uniqueEmail } from '#validators/rules'
import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional().nullable(),
    email: vine.string().trim().email().use(uniqueEmail()),
    password: vine.string().minLength(6),
    permissions: vine.array(vine.string()).optional(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional().nullable(),
    email: vine.string().trim().email().use(uniqueEmail()).optional(),
    password: vine.string().minLength(6).optional(),
    permissions: vine.array(vine.string()).optional(),
  })
)
