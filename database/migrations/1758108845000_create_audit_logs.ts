import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()

      table.bigInteger('actor_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('actor_email').nullable()

      table.string('action').notNullable()
      table.string('resource_type').notNullable()
      table.string('resource_id').notNullable()

      table.jsonb('before').nullable()
      table.jsonb('after').nullable()
      table.jsonb('context').nullable()

      table.string('ip').nullable()
      table.string('user_agent').nullable()
      table.string('method').nullable()
      table.string('path').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())

      // Indexes for common query patterns
      table.index(['resource_type', 'resource_id', 'created_at'], 'audit_logs_resource_composite_idx')
      table.index(['actor_id', 'created_at'], 'audit_logs_actor_created_at_idx')
      table.index(['action'], 'audit_logs_action_idx')
    })

    // GIN indexes for JSONB columns when querying inside JSON
    this.schema.raw('CREATE INDEX IF NOT EXISTS audit_logs_before_gin ON audit_logs USING GIN (before)')
    this.schema.raw('CREATE INDEX IF NOT EXISTS audit_logs_after_gin ON audit_logs USING GIN (after)')
    this.schema.raw('CREATE INDEX IF NOT EXISTS audit_logs_context_gin ON audit_logs USING GIN (context)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
} 
