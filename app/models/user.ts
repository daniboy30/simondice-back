import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Game from './game.js'
import GamePlayer from './game_player.js'
import GameMove from './game_moves.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  // Relaciones para el juego
  @hasMany(() => Game, {
    foreignKey: 'creatorId',
  })
  declare createdGames: HasMany<typeof Game>

  @hasMany(() => GamePlayer)
  declare gameParticipations: HasMany<typeof GamePlayer>

  @hasMany(() => GameMove, {
    foreignKey: 'playerId',
  })
  declare gameMoves: HasMany<typeof GameMove>
}