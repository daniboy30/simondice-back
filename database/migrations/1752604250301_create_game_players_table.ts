import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'game_players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.enum('player_number', ['1', '2']) // Jugador 1 o 2
      table.boolean('is_turn').defaultTo(false) // Si es su turno
      table.timestamp('joined_at').defaultTo(this.now())

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').nullable()
      
      // Un usuario solo puede estar una vez en cada juego
      table.unique(['game_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}