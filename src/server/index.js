import http from 'http'
import path from 'path'
import Bundler from 'parcel-bundler'
import express from 'express'
import kebabCase from 'just-kebab-case'
import SocketIO from 'socket.io'
import HarmonyHub from './HarmonyHub.js'
import Meross from './Meross.js'

const { HARMONY_HUB_IP, MEROSS_EMAIL, MEROSS_PASSWORD, PORT } = process.env
const ROOT_DIR = path.resolve(__dirname, '../..')

const clientEntry = path.resolve(ROOT_DIR, 'src/client/index.html')
const bundler = new Bundler(clientEntry)
const hub = new HarmonyHub(HARMONY_HUB_IP)
const meross = new Meross({ email: MEROSS_EMAIL, password: MEROSS_PASSWORD })
const app = express()
const server = http.createServer(app)
const socket = SocketIO(server)

const READY_PROMISE = Promise.all([hub.connect(), meross.connect()])
const CLIENT_SOCKET_CHANNELS = {
  harmony: {
    client: hub,
    methods: ['getConfig', 'sendCommand', 'startActivity', 'stopActivity'],
  },
  meross: {
    client: meross,
    methods: ['getDevices', 'turnDeviceOff', 'turnDeviceOn'],
  },
}

// add parcel middleware to server
app.use(bundler.middleware())

socket.on('connection', (clientSocket) => {
  for (const [prefix, props] of Object.entries(CLIENT_SOCKET_CHANNELS)) {
    const { client, methods } = props

    for (const methodName of methods) {
      const channelName = `${prefix}/${kebabCase(methodName)}`

      clientSocket.on(channelName, (payload, callback) => {
        READY_PROMISE.then(() => client[methodName](payload)).then(callback)
      })
    }
  }
})

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`)
})
