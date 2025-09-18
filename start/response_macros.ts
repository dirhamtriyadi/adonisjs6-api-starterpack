import { Response } from '@adonisjs/core/http'

declare module '@adonisjs/core/http' {
  interface Response {
    success<T = unknown>(message: string, data?: T, statusCode?: number): this
    fail<E = unknown>(message: string, errors?: E, statusCode?: number): this
  }
}

Response.macro('success', function <T>(this: Response, message: string, data?: T, statusCode = 200) {
  this.status(statusCode)
  this.send({ success: true, message, ...(data !== undefined ? { data } : {}) })
  return this
})

Response.macro('fail', function <E>(this: Response, message: string, errors?: E, statusCode = 400) {
  this.status(statusCode)
  this.send({ success: false, message, ...(errors !== undefined ? { errors } : {}) })
  return this
}) 