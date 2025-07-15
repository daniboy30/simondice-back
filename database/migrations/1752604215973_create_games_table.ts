import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'games'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('creator_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.json('colors').notNullable() // Array de colores disponibles en el juego
      table.enum('status', ['waiting', 'playing', 'finished']).defaultTo('waiting')
      table.integer('winner_id').unsigned().references('id').inTable('users').nullable()
      table.integer('current_player_id').unsigned().references('id').inTable('users').nullable()
      table.integer('turn_number').defaultTo(0)
      table.string('last_color_added').nullable() // Último color agregado por el jugador actual

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}