import { spawn } from 'child_process'
import Queue from 'p-queue'
import { getPortPromise as getPort } from 'portfinder'
import socketIO from 'socket.io'
import uuid from 'uuid/v4'

const PORT_QUEUE = new Queue({ concurrency: 1 })

export default class Pyjs {
  /**
   * @param {{
   *   entry: string,
   *   debug?: boolean,
   *   pythonPath?: boolean,
   *   spawnArgs?: string[],
   * }} opts
   */
  constructor(opts) {
    this.clientSocket = null
    this.process = null
    this.socket = null
    this.opts = {
      debug: false,
      pythonPath: 'python3',
      spawnArgs: [],
      ...opts,
    }
  }

  /**
   * Start up socket server and spawn python process
   * @returns {Promise<void>}
   */
  async connect() {
    // use a queue for this to support parallel calls
    const port = await PORT_QUEUE.add(() => getPort())
    const socket = socketIO.listen(port)

    this.socket = socket
    return new Promise((resolve) => {
      socket.on('connection', (client) => {
        this.clientSocket = client

        client.once('disconnect', () => {
          this.clientSocket = null
        })

        resolve()
      })

      this.process = spawn(
        this.opts.pythonPath,
        [this.opts.entry, port, ...this.opts.spawnArgs],
        { stdio: this.opts.debug ? 'inherit' : 'pipe' }
      )
    })
  }

  /**
   * @param {object} payload
   * @returns {Promise<object>} response
   */
  async send(payload = {}) {
    return new Promise((resolve, reject) => {
      if (this.clientSocket) {
        const requestID = uuid()

        this.clientSocket.once(requestID, (res) => resolve(JSON.parse(res)))
        this.clientSocket.emit('input', { id: requestID, payload })
      } else {
        reject(new Error('Python client not available'))
      }
    })
  }

  /**
   * Cleanly close server and subprocess
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.process) this.process.kill()
    if (this.socket) this.socket.close()
  }
}
