import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permission_role'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigInteger('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE')
      table.bigInteger('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table.unique(['permission_id', 'role_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
} 