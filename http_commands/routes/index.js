module.exports = require('fastify-plugin')(function (app, opts, next) {
  app.get(
    '/mute/ch/:channel',
    {
      schema: {
        description: 'Mute a line channel',
        params: {
          channel: { type: 'integer', description: 'Channel ID' }
        }
      }
    },
    (req, res) => {
      const { channel } = req.params
      app.slApi.mute({type: 'LINE', channel})
      res.send('OK')
    }
  )

  app.get(
    '/unmute/ch/:channel',
    {
      schema: {
        description: 'Unmute a line channel',
        params: {
          channel: { type: 'integer', description: 'Channel ID' }
        }
      }
    },
    (req, res) => {
      const { channel } = req.params
      app.slApi.unmute({type: 'LINE', channel})
      res.send('OK')
    }
  )

  next()
})
