require('dotenv').config()

const { Client } = require('presonus-studiolive-api')
const fastify = require('fastify')()
const { CONSOLE_HOST, CONSOLE_PORT, SERVER_HOST, SERVER_PORT } = process.env

if (!CONSOLE_HOST || !CONSOLE_PORT || !SERVER_HOST || !SERVER_PORT) {
  console.log('Misconfigured server.')
  process.exit(1)
}

fastify.decorate(
  'slApi',
  (function () {
    let api = new Client({
      host: CONSOLE_HOST,
      port: CONSOLE_PORT
    }, {
      autoreconnect: true
    })
    api.connect()
    return api
  })()
)

fastify.register(require('./routes'))

fastify.listen(SERVER_PORT, SERVER_HOST, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  let address = fastify.server.address()
  console.info(`Server listening on ${address.address}:${address.port}`)
})
