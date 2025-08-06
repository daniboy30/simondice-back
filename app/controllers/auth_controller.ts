import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'

export default class AuthController {
  /**
   * Registrar un nuevo usuario
   */
  async register({ request, response }: HttpContext) {
    try {
      const payload = await registerValidator.validate(request.all())
      
      const user = await User.create(payload)
      const token = await User.accessTokens.create(user)

      return response.created({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        },
        token: token.value!.release()
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error al registrar usuario',
        error: error.messages || error.message
      })
    }
  }

  /**
   * Iniciar sesión
   */
  async login({ request, response }: HttpContext) {
    try {
      const payload = await loginValidator.validate(request.all())
      
      const user = await User.verifyCredentials(payload.email, payload.password)
      const token = await User.accessTokens.create(user)

      return response.ok({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        },
        token: token.value!.release()
      })
    } catch (error) {
      return response.unauthorized({
        message: 'Credenciales inválidas'
      })
    }
  }

  /**
   * Cerrar sesión
   */
  async logout({ auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      await User.accessTokens.delete(user, (user as any).currentAccessToken.identifier)
      
      return response.ok({
        message: 'Sesión cerrada exitosamente'
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error al cerrar sesión'
      })
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  async me({ auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      
      return response.ok({
        user: {
          id: (user as any).id,
          email: (user as any).email,
          fullName: (user as any).fullName,
          createdAt: (user as any).createdAt
        }
      })
    } catch (error) {
      return response.unauthorized({
        message: 'No autenticado'
      })
    }
  }
}