import events from 'events'
import co from 'co'
import compose from 'koa-compose'

export default class Bot extends events.EventEmitter {
  constructor (options) {
    super()
    this.middleware = []
    this.providers = options.providers
  }

  listen (options) {
    let fn = co.wrap(compose(this.middleware))

    for (let provider of this.providers) {
      provider.onMessage = (ctx) => {

        // TODO: add aliases of unified actions
        ctx.action = (name, msg) => {
          let action = provider.actions[name]
          if (!action) throw `Unsupported method ${action}!`

          if (action.type !== msg.type) {
            throw `Unsupported message type ${msg.type}!`
          }

          // TODO: support nested method props
          for (let method in msg.data) {
            if (msg.data.hasOwnProperty(method) && !action.API[method]) {
              throw `Unsupported method ${method}!`
            }
          }

          // XXX: it feels like a hack
          msg.data.target = msg.target.data || ctx.source.data

          action.fn.call(provider._api, msg.data)
        }

        fn.call(ctx).catch((err) => { console.error(err.stack) })
      }

      provider.listen()
    }

    return this
  }

  use (fn) {
    this.middleware.push(fn)
    return this
  }
}
