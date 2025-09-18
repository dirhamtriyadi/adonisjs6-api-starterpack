import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_user'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigInteger('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.unique(['role_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
} 