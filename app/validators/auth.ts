import { uniqueEmail } from '#validators/rules'
import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional().nullable(),
    email: vine.string().trim().email().use(uniqueEmail()),
    password: vine.string().minLength(6),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().minLength(6),
  })
)
