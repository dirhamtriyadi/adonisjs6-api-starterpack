import { ExceptionHandler, HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const err = (error && typeof error === 'object') ? (error as Record<string, unknown>) : {}

    const status =
      typeof err.status === 'number' ? err.status as number : 500

    const message =
      typeof err.message === 'string' ? err.message as string : 'Internal Server Error'

    const errors =
      (typeof err.messages !== 'undefined' ? err.messages :
       typeof err.errors !== 'undefined' ? err.errors : undefined)

    ctx.response.status(status)
    return ctx.response.fail(message, errors, status)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
