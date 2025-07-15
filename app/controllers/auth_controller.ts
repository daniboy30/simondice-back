import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'

export default class AuthController {
  /**
   * Registrar un nuevo usuario
   */
  async register({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerValidator)
      
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
      const payload = await request.validateUsing(loginValidator)
      
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
      const user = auth.getUserOrFail()
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
      
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
      const user = auth.getUserOrFail()
      
      return response.ok({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt
        }
      })
    } catch (error) {
      return response.unauthorized({
        message: 'No autenticado'
      })
    }
  }
}