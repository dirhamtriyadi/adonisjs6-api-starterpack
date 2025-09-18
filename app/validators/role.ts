import { uniqueRoleSlug } from '#validators/rules'
import vine from '@vinejs/vine'

export const createRoleValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2),
    slug: vine.string().trim().regex(/^[a-z0-9]+[a-z0-9\-_\.]*[a-z0-9]+$/).use(uniqueRoleSlug()),
    permissions: vine.array(vine.string()).optional(),
  })
)

export const updateRoleValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).optional(),
    slug: vine
      .string()
      .trim()
      .regex(/^[a-z0-9]+[a-z0-9\-_\.]*[a-z0-9]+$/)
      .use(uniqueRoleSlug())
      .optional(),
    permissions: vine.array(vine.string()).optional(),
  })
) 