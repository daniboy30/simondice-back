import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import GamePlayer from './game_player.js'
import GameMove from './game_moves.js'

export default class Game extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare creatorId: number

  @column({
    serialize: (value: string) => {
      return JSON.parse(value)
    },
    prepare: (value: string[]) => {
      return JSON.stringify(value)
    },
  })
  declare colors: string[]

  @column()
  declare status: 'waiting' | 'playing' | 'finished'

  @column()
  declare winnerId: number | null

  @column()
  declare currentPlayerId: number | null

  @column()
  declare turnNumber: number

  @column()
  declare lastColorAdded: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relaciones
  @belongsTo(() => User, {
    foreignKey: 'creatorId',
  })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'winnerId',
  })
  declare winner: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'currentPlayerId',
  })
  declare currentPlayer: BelongsTo<typeof User>

  @hasMany(() => GamePlayer)
  declare players: HasMany<typeof GamePlayer>

  @hasMany(() => GameMove)
  declare moves: HasMany<typeof GameMove>
}