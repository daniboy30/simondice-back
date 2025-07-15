import vine from '@vinejs/vine'

/**
 * Validador para registro de usuarios
 */
export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().minLength(2).maxLength(50),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(6).maxLength(32)
  })
)

/**
 * Validador para login de usuarios
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(1)
  })
)