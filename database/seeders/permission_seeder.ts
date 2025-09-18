import Permission from '#models/permission'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Permission.createMany([
      // Users
      { name: 'List Users', slug: 'users.list' },
      { name: 'Read User', slug: 'users.read' },
      { name: 'Create User', slug: 'users.create' },
      { name: 'Update User', slug: 'users.update' },
      { name: 'Delete User', slug: 'users.delete' },
      { name: 'Manage Users', slug: 'users.manage' },

      // Roles and Permissions
      { name: 'List Permissions', slug: 'permissions.list' },
      { name: 'List Roles', slug: 'roles.list' },
      { name: 'Read Role', slug: 'roles.read' },
      { name: 'Create Role', slug: 'roles.create' },
      { name: 'Update Role', slug: 'roles.update' },
      { name: 'Delete Role', slug: 'roles.delete' },
      { name: 'Manage Roles', slug: 'roles.manage' },

      // Audit Logs
      { name: 'List Audit Logs', slug: 'audit_logs.list' },
      { name: 'Read Audit Log', slug: 'audit_logs.read' },
    ])
  }
}
