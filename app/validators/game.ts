import vine from '@vinejs/vine'

/**
 * Validador para crear un nuevo juego
 */
export const createGameValidator = vine.compile(
  vine.object({
    colors: vine.array(vine.string().minLength(1)).minLength(3).maxLength(8)
  })
)

/**
 * Validador para hacer un movimiento en el juego
 */
export const makeMoveValidator = vine.compile(
  vine.object({
    sequence: vine.array(vine.string().minLength(1)).minLength(1).maxLength(50)
  })
)