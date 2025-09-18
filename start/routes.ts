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
    .use('*', [middleware.auth()]) // auth untuk semua aksi
    .use('index', [middleware.authorize(['users.list'])])
    .use('show', [middleware.authorize(['users.read'])])
    .use('store', [middleware.authorize(['users.create'])])
    .use('update', [middleware.authorize(['users.update'])])
    .use('destroy', [middleware.authorize(['users.delete'])])

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

  // Audit Logs (read-only)
  router
    .resource('audit-logs', AuditLogsController)
    .apiOnly()
    .only(['index', 'show'])
    .use('*', [middleware.auth()])
    .use('index', [middleware.authorize(['audit_logs.list'])])
    .use('show', [middleware.authorize(['audit_logs.read'])])
}).prefix('/api/v1')
