import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Game from './game.js'
import User from './user.js'

export default class GameMove extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gameId: number

  @column()
  declare playerId: number

  @column()
  declare turnNumber: number

  @column({
    serialize: (value: string) => {
      try {
        // Si ya es un array, devolvelo tal como está
        if (Array.isArray(value)) {
          return value
        }
        // Si es una cadena JSON, parseala
        if (typeof value === 'string' && value.startsWith('[')) {
          return JSON.parse(value)
        }
        // Si es una cadena separada por comas, convertirla a array
        if (typeof value === 'string' && value.includes(',')) {
          return value.split(',').map(s => s.trim())
        }
        // Si es una cadena simple, convertirla a array
        if (typeof value === 'string') {
          return [value]
        }
        return value
      } catch (error) {
        console.error('Error al serializar sequence:', error, value)
        return []
      }
    },
    prepare: (value: string[]) => {
      return JSON.stringify(value)
    },
  })
  declare sequence: string[]

  @column()
  declare colorAdded: string

  @column()
  declare isCorrect: boolean

  @column.dateTime()
  declare moveTime: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relaciones
  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>

  @belongsTo(() => User, {
    foreignKey: 'playerId',
  })
  declare player: BelongsTo<typeof User>
}