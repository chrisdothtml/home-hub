import http from 'http'
import path from 'path'
import Bundler from 'parcel-bundler'
import express from 'express'
import SocketIO from 'socket.io'
import HarmonyHub from './HarmonyHub/index.js'

const { HARMONY_HUB_IP, PORT } = process.env
const ROOT_DIR = path.resolve(__dirname, '../..')
const clientEntry = path.resolve(ROOT_DIR, 'src/client/index.html')
const bundler = new Bundler(clientEntry)
const hub = new HarmonyHub(HARMONY_HUB_IP)
const app = express()
const server = http.createServer(app)
const socket = SocketIO(server)
let READY_PROMISE

function onReady() {
  if (!READY_PROMISE) {
    READY_PROMISE = hub.connect()
  }

  return READY_PROMISE
}

app.use(bundler.middleware())
app.get('/harmony/config', (req, res) => {
  onReady()
    .then(hub.getConfig)
    .then((config) => {
      res.send(config)
    })
})

socket.on('connection', (client) => {
  const harmonyHandlers = new Map([
    ['send-command', 'sendCommand'],
    ['start-activity', 'startActivity'],
    ['stop-activity', 'stopActivity'],
  ])

  for (const [channel, method] of harmonyHandlers) {
    client.on(`harmony/${channel}`, (payload, callback) => {
      onReady()
        .then(() => hub[method](payload))
        .then(callback)
    })
  }
})

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`)
})
