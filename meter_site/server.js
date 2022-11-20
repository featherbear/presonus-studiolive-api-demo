require('dotenv').config()

const fastify = require('fastify')()
const socketio = require('socket.io')(fastify.server).of('/meter')
const path = require('path')
const winston = require('winston')
let { Client: APIClient } = require('presonus-studiolive-api')
const EventEmitter = require('events')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
})

logger.info('PreSonus StudioLive API meter demo starting')

const error = message => (error.errors = [...(error.errors || []), message])

const opts = {
  consoleAddress: [
    process.env.CONSOLE_HOST || error('CONSOLE_HOST not set'),
    Math.trunc(process.env.CONSOLE_PORT) || error('CONSOLE_PORT not set')
  ],
  serverAddress: [
    process.env.SERVER_HOST || error('SERVER_HOST not set'),
    Math.trunc(process.env.SERVER_PORT) || error('SERVER_PORT NOT SET')
  ],
  emulateConsole: process.env.EMULATE_CONSOLE === 'true'
}

if (error.errors) {
  logger.error(error.errors)
  process.exit(1)
}

if (opts.emulateConsole) {
  logger.info('Using dummy client')

  /**
   * Dummy client
   */
  APIClient = class ThisIsADummyClient extends EventEmitter {
    constructor () {
      super()
      this.i = 0 // Emulate rise and fall of values
      this.meteringInterval = null
    }

    meterSubscribe () {
      // Emit a metering event every 50ms
      clearInterval(this.meteringInterval)
      this.meteringInterval = setInterval(() => {
        this.emit('meter', this.metering)
      }, 50)
    }
    async connect () {
      return this
    }

    state = {
      get (path) {
        switch (path) {
          case 'global.devicename':
            return 'Dummy Console'

          default:
            logger.warn({
              message: 'Dummy client did not have a response',
              path
            })
        }
      }
    }
    get metering () {
      let data = []
      for (var i = 0; i < 32; i++) {
        data.push(
          Math.abs(
            parseInt(
              65535 * (Math.random() * 0.05 + 0.95 * Math.sin(this.i / 50))
            )
          )
        )
      }

      return {
        level: data
      }
    }
  }
}

logger.info('Creating API client instance')
const client = new APIClient({
  host: opts.consoleAddress[0],
  port: opts.consoleAddress[1]
}, {
    autoreconnect: true
})

logger.info(
  `Connecting to console on ${opts.consoleAddress[0]}:${opts.consoleAddress[1]}`
)
client
  .connect({
    clientDescription: 'Meter Demo'
  })
  .then(() => {
    logger.info(
      'Connected to console: ' + client.state.get('global.devicename')
    )

    logger.info(`Subscribing to metering data`)
    client.on('meter', data => socketio.emit('meter', data))
    client.meterSubscribe()
  })

fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public')
})

fastify.listen(opts.serverAddress[1], opts.serverAddress[0], err => {
  if (err) {
    logger.error(err)
    process.exit(1)
  }
  let address = fastify.server.address()
  logger.info(`Webserver listening on ${address.address}:${address.port}`)
})
