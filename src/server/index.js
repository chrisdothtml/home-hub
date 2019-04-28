import http from 'http'
import express from 'express'
import SocketIO from 'socket.io'
import HarmonyHub from './HarmonyHub/index.js'

const { HARMONY_HUB_IP, PORT } = process.env
const hub = new HarmonyHub(HARMONY_HUB_IP)
const server = express()
const socket = SocketIO(http.createServer(server).listen(PORT))
let READY_PROMISE

function onReady() {
  if (!READY_PROMISE) {
    READY_PROMISE = hub.connect()
  }

  return READY_PROMISE
}

server.get('/harmony/config', (req, res) => {
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
