import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Game from './game.js'
import User from './user.js'

export default class GamePlayer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare gameId: number

  @column()
  declare userId: number

  @column()
  declare playerNumber: '1' | '2'

  @column()
  declare isTurn: boolean

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relaciones
  @belongsTo(() => Game)
  declare game: BelongsTo<typeof Game>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}