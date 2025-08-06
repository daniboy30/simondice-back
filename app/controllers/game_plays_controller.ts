import type { HttpContext } from '@adonisjs/core/http'
import Game from '#models/game'
import GamePlayer from '#models/game_player'
import GameMove from '#models/game_moves'
import { makeMoveValidator } from '#validators/game'

export default class GamePlaysController {

  async makeMove({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const gameId = params.id
      
      // Validar datos de entrada
      let payload
      try {
        payload = await request.validateUsing(makeMoveValidator)
      } catch (error) {
        return response.badRequest({
          message: 'Error de validación',
          error: 'La secuencia debe ser un array de colores válidos'
        })
      }

      const game = await Game.query()
        .where('id', gameId)
        .preload('currentPlayer')
        .preload('players')
        .firstOrFail()
      
      // Verificar que el juego esté en progreso
      if (game.status !== 'playing') {
        return response.badRequest({
          message: 'Este juego no está en progreso'
        })
      }

      // Verificar que sea el turno del jugador
      console.log('Verificando turno:', {
        currentPlayerId: game.currentPlayerId,
        userId: user.id,
        gameStatus: game.status,
        turnNumber: game.turnNumber
      })
      
      if (game.currentPlayerId !== user.id) {
        return response.badRequest({
          message: 'No es tu turno'
        })
      }

      // Obtener el último movimiento para validar la secuencia
      const lastMove = await GameMove.query()
        .where('gameId', gameId)
        .orderBy('turnNumber', 'desc')
        .first()

      console.log('Último movimiento:', lastMove)
      console.log('Secuencia recibida:', payload.sequence)

      let expectedSequence: string[] = []
      let isCorrect = true

      if (lastMove) {
        // Validar que la secuencia del jugador contenga la secuencia anterior
        // Asegurar que expectedSequence sea un array
        if (typeof lastMove.sequence === 'string') {
          try {
            expectedSequence = JSON.parse(lastMove.sequence)
          } catch (error) {
            // Si no se puede parsear como JSON, intentar split por comas
            expectedSequence = (lastMove.sequence as string).split(',').map((s: string) => s.trim())
          }
        } else {
          expectedSequence = lastMove.sequence as string[]
        }
        
        console.log('Secuencia esperada (procesada):', expectedSequence)
        
        // Verificar que los primeros colores coincidan con la secuencia anterior
        for (let i = 0; i < expectedSequence.length; i++) {
          if (payload.sequence[i] !== expectedSequence[i]) {
            isCorrect = false
            break
          }
        }

        // Verificar que se agregó exactamente un color más
        if (payload.sequence.length !== expectedSequence.length + 1) {
          isCorrect = false
        }
      } else {
        // Es el primer movimiento, debe tener exactamente 1 color
        if (payload.sequence.length !== 1) {
          isCorrect = false
        }
      }

      // Verificar que el color agregado esté en los colores permitidos del juego
      const newColor = payload.sequence[payload.sequence.length - 1]
      console.log('Nuevo color agregado:', newColor)
      console.log('Colores permitidos en el juego:', game.colors)
      
      if (!game.colors.includes(newColor)) {
        console.log('Color no permitido!')
        isCorrect = false
      }

      console.log('Resultado de validación:', {
        isCorrect,
        expectedSequence,
        receivedSequence: payload.sequence,
        newColor
      })

      // Crear el movimiento
      const move = await GameMove.create({
        gameId: gameId,
        playerId: user.id,
        turnNumber: game.turnNumber,
        sequence: payload.sequence,
        colorAdded: newColor,
        isCorrect: isCorrect
      })

      if (!isCorrect) {
        console.log('Movimiento incorrecto, terminando juego')
        // El jugador se equivocó, terminar el juego
        const otherPlayer = await GamePlayer.query()
          .where('gameId', gameId)
          .where('userId', '!=', user.id)
          .firstOrFail()

        game.status = 'finished'
        game.winnerId = otherPlayer.userId
        game.currentPlayerId = null
        await game.save()

        await game.load('winner')

        console.log('Juego terminado, ganador:', game.winner?.fullName)

        return response.ok({
          message: 'Movimiento incorrecto. Has perdido el juego',
          game: {
            id: game.id,
            status: game.status,
            winner: game.winner,
            lastMove: move,
            isCorrect: false
          }
        })
      }

      console.log('Movimiento correcto, cambiando turno')
      // Movimiento correcto, cambiar turno
      const otherPlayer = await GamePlayer.query()
        .where('gameId', gameId)
        .where('userId', '!=', user.id)
        .firstOrFail()

      game.currentPlayerId = otherPlayer.userId
      game.turnNumber = game.turnNumber + 1
      game.lastColorAdded = newColor
      await game.save()

      // Actualizar turnos de los jugadores
      await GamePlayer.query()
        .where('gameId', gameId)
        .update({ isTurn: false })

      await GamePlayer.query()
        .where('gameId', gameId)
        .where('userId', otherPlayer.userId)
        .update({ isTurn: true })

      await game.load('currentPlayer')

      return response.ok({
        message: 'Movimiento realizado exitosamente',
        game: {
          id: game.id,
          status: game.status,
          currentPlayer: game.currentPlayer,
          turnNumber: game.turnNumber,
          lastColorAdded: game.lastColorAdded,
          lastMove: {
            id: move.id,
            sequence: move.sequence,
            colorAdded: move.colorAdded,
            isCorrect: move.isCorrect,
            turnNumber: move.turnNumber
          }
        }
      })
    } catch (error) {
      console.error('Error en makeMove:', error)
      return response.badRequest({
        message: 'Error al realizar movimiento',
        error: error.message || 'Error desconocido'
      })
    }
  }

  /**
   * Obtener el historial de movimientos de un juego
   */
  async getMoves({ params, response }: HttpContext) {
    try {
      const gameId = params.id
      
      const moves = await GameMove.query()
        .where('gameId', gameId)
        .preload('player', (player) => {
          player.select('id', 'fullName', 'email')
        })
        .orderBy('turnNumber', 'asc')

      return response.ok({
        message: 'Historial de movimientos',
        moves: moves.map(move => ({
          id: move.id,
          player: move.player,
          turnNumber: move.turnNumber,
          sequence: move.sequence,
          colorAdded: move.colorAdded,
          isCorrect: move.isCorrect,
          moveTime: move.moveTime
        }))
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error al obtener movimientos'
      })
    }
  }

  /**
   * Obtener el estado actual del juego para un jugador
   */
  async getGameState({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const gameId = params.id

      const game = await Game.query()
        .where('id', gameId)
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
        .firstOrFail()

      // Verificar que el usuario esté en el juego
      const playerInGame = game.players.find(player => player.userId === user.id)
      if (!playerInGame) {
        return response.forbidden({
          message: 'No estás en este juego'
        })
      }

      // Obtener el último movimiento
      const lastMove = await GameMove.query()
        .where('gameId', gameId)
        .orderBy('turnNumber', 'desc')
        .first()

      // Obtener solo el último color agregado por el oponente
      let opponentLastColor = null
      if (lastMove && lastMove.playerId !== user.id) {
        opponentLastColor = lastMove.colorAdded
      }

      return response.ok({
        message: 'Estado del juego',
        game: {
          id: game.id,
          colors: game.colors,
          status: game.status,
          creator: game.creator,
          currentPlayer: game.currentPlayer,
          winner: game.winner,
          turnNumber: game.turnNumber,
          isMyTurn: game.currentPlayerId === user.id,
          myPlayerNumber: playerInGame.playerNumber,
          opponentLastColor: opponentLastColor, // Solo el último color del oponente
          players: game.players.map(player => ({
            id: player.id,
            user: player.user,
            playerNumber: player.playerNumber,
            isTurn: player.isTurn
          })),
          lastMove: lastMove ? {
            turnNumber: lastMove.turnNumber,
            colorAdded: lastMove.colorAdded,
            isCorrect: lastMove.isCorrect
          } : null
        }
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error al obtener estado del juego',
        error: error.message
      })
    }
  }

  /**
   * Abandonar un juego
   */
  async forfeit({ params, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const gameId = params.id

      const game = await Game.findOrFail(gameId)

      // Verificar que el juego esté en progreso
      if (game.status !== 'playing') {
        return response.badRequest({
          message: 'Este juego no está en progreso'
        })
      }

      // Verificar que el usuario esté en el juego
      const playerInGame = await GamePlayer.query()
        .where('gameId', gameId)
        .where('userId', user.id)
        .first()

      if (!playerInGame) {
        return response.forbidden({
          message: 'No estás en este juego'
        })
      }

      // Obtener el oponente
      const opponent = await GamePlayer.query()
        .where('gameId', gameId)
        .where('userId', '!=', user.id)
        .firstOrFail()

      // El oponente gana por forfeit
      game.status = 'finished'
      game.winnerId = opponent.userId
      game.currentPlayerId = null
      await game.save()

      await game.load('winner')

      return response.ok({
        message: 'Has abandonado el juego',
        game: {
          id: game.id,
          status: game.status,
          winner: game.winner
        }
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error al abandonar el juego',
        error: error.message
      })
    }
  }
}