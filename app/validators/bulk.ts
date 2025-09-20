import vine from '@vinejs/vine'

export const bulkIdsValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.number().positive()).minLength(1),
  })
)

