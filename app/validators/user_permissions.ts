import vine from '@vinejs/vine'

export const permissionsArrayValidator = vine.compile(
  vine.object({
    permissions: vine.array(vine.string()),
  })
)

