import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import GamePlayer from '#models/game_player'
import { createGameValidator } from '#validators/game'

export default class GamesController {
  /**
   * Listar todas las partidas disponibles
   */
  async index({ response }: HttpContext) {
    try {
      const games = await Game.query()
        .where('status', 'waiting')
        .preload('creator', (creator) => {
          creator.select('id', 'fullName', 'email')
        })
        .preload('players', (players) => {
          players.preload('user', (user) => {
            user.select('id', 'fullName', 'email')
          })
        })
        .orderBy('createdAt', 'desc')

      return response.ok({
        message: 'Partidas disponibles',
        games: games.map(game => ({
          id: game.id,
          creator: game.creator,
          colors: game.colors,
          status: game.status,
          playersCount: game.players.length,
          createdAt: game.createdAt
        }))
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al obtener partidas'
      })
    }
  }

  /**
   * Crear una nueva partida
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const payload = await createGameValidator.validate(request.all())

      const game = await Game.create({
        creatorId: (user as any).id,
        colors: payload.colors,
        status: 'waiting',
        turnNumber: 0
      })

      // Agregar al creador como jugador 1
      await GamePlayer.create({
        gameId: game.id,
        userId: (user as any).id,
        playerNumber: '1',
        isTurn: true
      })

      await game.load('creator')
      await game.load('players')

      return response.created({
        message: 'Partida creada exitosamente',
        game: {
          id: game.id,
          creator: game.creator,
          colors: game.colors,
          status: game.status,
          playersCount: game.players.length,
          createdAt: game.createdAt
        }
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error al crear partida',
        error: error.messages || error.message
      })
    }
  }

  /**
   * Obtener detalles de una partida específica
   */
  async show({ params, response }: HttpContext) {
    try {
      const game = await Game.query()
        .where('id', params.id)
        .preload('creator', (creator) => {
          creator.select('id', 'fullName', 'email')
        })
        .preload('players', (players) => {
          players.preload('user', (user) => {
            user.select('id', 'fullName', 'email')
          })
        })
        .preload('currentPlayer', (currentPlayer) => {
          currentPlayer.select('id', 'fullName', 'email')
        })
        .preload('winner', (winner) => {
          winner.select('id', 'fullName', 'email')
        })
        .first()

      if (!game) {
        return response.notFound({
          message: 'Partida no encontrada'
        })
      }

      return response.ok({
        message: 'Detalles de la partida',
        game: {
          id: game.id,
          creator: game.creator,
          colors: game.colors,
          status: game.status,
          winner: game.winner,
          currentPlayer: game.currentPlayer,
          turnNumber: game.turnNumber,
          lastColorAdded: game.lastColorAdded,
          players: game.players.map(player => ({
            id: player.id,
            user: player.user,
            playerNumber: player.playerNumber,
            isTurn: player.isTurn,
            joinedAt: player.joinedAt
          })),
          createdAt: game.createdAt
        }
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al obtener partida'
      })
    }
  }

  /**
   * Unirse a una partida
   */
  async join({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const game = await Game.findOrFail(params.id)

      // Verificar que la partida esté esperando jugadores
      if (game.status !== 'waiting') {
        return response.badRequest({
          message: 'Esta partida ya no está disponible'
        })
      }

      // Verificar que el usuario no sea el creador
      if (game.creatorId === (user as any).id) {
        return response.badRequest({
          message: 'No puedes unirte a tu propia partida'
        })
      }

      // Verificar que no esté ya en la partida
      const existingPlayer = await GamePlayer.query()
        .where('gameId', game.id)
        .where('userId', (user as any).id)
        .first()

      if (existingPlayer) {
        return response.badRequest({
          message: 'Ya estás en esta partida'
        })
      }

      // Verificar que la partida no esté llena
      const playersCount = await GamePlayer.query()
        .where('gameId', game.id)
        .count('* as total')

      if (playersCount[0].$extras.total >= 2) {
        return response.badRequest({
          message: 'Esta partida está llena'
        })
      }

      // Agregar jugador 2
      await GamePlayer.create({
        gameId: game.id,
        userId: (user as any).id,
        playerNumber: '2',
        isTurn: false
      })

      // Cambiar estado de la partida a 'playing'
      game.status = 'playing'
      game.currentPlayerId = game.creatorId // El creador empieza
      game.turnNumber = 1
      await game.save()

      await game.load('creator')
      await game.load('players', (players) => {
        players.preload('user')
      })

      return response.ok({
        message: 'Te has unido a la partida exitosamente',
        game: {
          id: game.id,
          creator: game.creator,
          colors: game.colors,
          status: game.status,
          currentPlayer: game.currentPlayerId,
          turnNumber: game.turnNumber,
          players: game.players.map(player => ({
            id: player.id,
            user: player.user,
            playerNumber: player.playerNumber,
            isTurn: player.isTurn
          }))
        }
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error al unirse a la partida',
        error: error.message
      })
    }
  }

  /**
   * Obtener las partidas del usuario autenticado
   */
  async myGames({ response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      const games = await Game.query()
        .whereHas('players', (players) => {
          players.where('userId', (user as any).id)
        })
        .preload('creator', (creator) => {
          creator.select('id', 'fullName', 'email')
        })
        .preload('players', (players) => {
          players.preload('user', (user) => {
            user.select('id', 'fullName', 'email')
          })
        })
        .preload('winner', (winner) => {
          winner.select('id', 'fullName', 'email')
        })
        .orderBy('createdAt', 'desc')

      return response.ok({
        message: 'Tus partidas',
        games: games.map(game => ({
          id: game.id,
          creator: game.creator,
          colors: game.colors,
          status: game.status,
          winner: game.winner,
          turnNumber: game.turnNumber,
          players: game.players.map(player => ({
            user: player.user,
            playerNumber: player.playerNumber
          })),
          createdAt: game.createdAt
        }))
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al obtener tus partidas'
      })
    }
  }
}