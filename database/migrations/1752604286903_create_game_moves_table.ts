import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'game_moves'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('game_id').unsigned().references('id').inTable('games').onDelete('CASCADE')
      table.integer('player_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('turn_number').notNullable()
      table.json('sequence').notNullable() // Array completo de la secuencia hasta ese momento
      table.string('color_added').notNullable() // Color que agregó en este turno
      table.boolean('is_correct').defaultTo(true) // Si la secuencia fue correcta
      table.timestamp('move_time').defaultTo(this.now())

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}