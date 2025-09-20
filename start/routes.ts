/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import AuditLogsController from '#controllers/audit_logs_controller'
import AuthController from '#controllers/auth_controller'
import RolesController from '#controllers/roles_controller'
import UserPermissionsController from '#controllers/user_permissions_controller'
import UsersController from '#controllers/users_controller'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.group(() => {
  // Auth (tetap seperti sebelumnya)
  router.post('/auth/register', [AuthController, 'register'])
  router.post('/auth/login', [AuthController, 'login'])
  router.post('/auth/logout', [AuthController, 'logout']).use([middleware.auth()])
  router.get('/auth/me', [AuthController, 'me']).use([middleware.auth()])

  // Users
  router
    .resource('users', UsersController)
    .apiOnly()
    .use('index', [middleware.authorize(['users.list'])])
    .use('show', [middleware.authorize(['users.read'])])
    .use('store', [middleware.authorize(['users.create'])])
    .use('update', [middleware.authorize(['users.update'])])
    .use('destroy', [middleware.authorize(['users.delete'])])

  // Users - soft delete utilities
  router.post('/users/:id/restore', [UsersController, 'restore']).use([middleware.auth(), middleware.authorize(['users.restore'])])
  router.delete('/users/:id/force', [UsersController, 'forceDelete']).use([middleware.auth(), middleware.authorize(['users.force_delete'])])
  router.post('/users/bulk-delete', [UsersController, 'bulkDelete']).use([middleware.auth(), middleware.authorize(['users.bulk_delete'])])
  router.post('/users/bulk-restore', [UsersController, 'bulkRestore']).use([middleware.auth(), middleware.authorize(['users.bulk_restore'])])
  router.post('/users/bulk-force-delete', [UsersController, 'bulkForceDelete']).use([middleware.auth(), middleware.authorize(['users.bulk_force_delete'])])

  // Users - direct permissions management
  router
    .get('/users/:id/permissions', [UserPermissionsController, 'index'])
    .use([middleware.auth(), middleware.authorize(['users.permissions.read'])])
  router
    .post('/users/:id/permissions', [UserPermissionsController, 'attach'])
    .use([middleware.auth(), middleware.authorize(['users.permissions.manage'])])
  router
    .put('/users/:id/permissions', [UserPermissionsController, 'sync'])
    .use([middleware.auth(), middleware.authorize(['users.permissions.manage'])])
  router
    .delete('/users/:id/permissions', [UserPermissionsController, 'detach'])
    .use([middleware.auth(), middleware.authorize(['users.permissions.manage'])])

  // Roles
  router
    .resource('roles', RolesController)
    .apiOnly()
    .use('*', [middleware.auth()])
    .use('index', [middleware.authorize(['roles.list'])])
    .use('show', [middleware.authorize(['roles.read'])])
    .use('store', [middleware.authorize(['roles.create'])])
    .use('update', [middleware.authorize(['roles.update'])])
    .use('destroy', [middleware.authorize(['roles.delete'])])

  // Roles - soft delete utilities
  router.post('/roles/:id/restore', [RolesController, 'restore']).use([middleware.auth(), middleware.authorize(['roles.restore'])])
  router.delete('/roles/:id/force', [RolesController, 'forceDelete']).use([middleware.auth(), middleware.authorize(['roles.force_delete'])])
  router.post('/roles/bulk-delete', [RolesController, 'bulkDelete']).use([middleware.auth(), middleware.authorize(['roles.bulk_delete'])])
  router.post('/roles/bulk-restore', [RolesController, 'bulkRestore']).use([middleware.auth(), middleware.authorize(['roles.bulk_restore'])])
  router.post('/roles/bulk-force-delete', [RolesController, 'bulkForceDelete']).use([middleware.auth(), middleware.authorize(['roles.bulk_force_delete'])])

  // Audit Logs (read-only)
  router
    .resource('audit-logs', AuditLogsController)
    .apiOnly()
    .only(['index', 'show'])
    .use('*', [middleware.auth()])
    .use('index', [middleware.authorize(['audit_logs.list'])])
    .use('show', [middleware.authorize(['audit_logs.read'])])
}).prefix('/api/v1')
