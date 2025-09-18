import Permission from '#models/permission'
import Role from '#models/role'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // Ensure roles exist
    const adminRole = await Role.firstOrCreate(
      { slug: 'admin' },
      { name: 'Administrator' }
    )

    const userRole = await Role.firstOrCreate(
      { slug: 'user' },
      { name: 'User' }
    )

    // Ensure permissions are attached to roles
    // Admin: all permissions
    const allPermissions = await Permission.all()
    if (allPermissions.length > 0) {
      await adminRole.related('permissions').sync(allPermissions.map((p) => p.id), false)
    }

    // User: only users.list and users.read
    const basicPerms = await Permission.query().whereIn('slug', ['users.list', 'users.read'])
    await userRole.related('permissions').sync(basicPerms.map((p) => p.id), false)

    const admin = await User.firstOrCreate(
      { email: 'admin@belibayar.id' },
      { email: 'admin@belibayar.id', password: 'password' }
    )

    const normalUser = await User.firstOrCreate(
      { email: 'user@belibayar.id' },
      { email: 'user@belibayar.id', password: 'password' }
    )

    // Attach roles to users (avoid duplicates)
    await admin.related('roles').sync([adminRole.id], false)
    await normalUser.related('roles').sync([userRole.id], false)
  }
}