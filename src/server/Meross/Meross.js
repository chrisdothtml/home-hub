import http from 'http'
import path from 'path'
import { spawn } from 'child_process'
import express from 'express'
import SocketIO from 'socket.io'

const PYTHON_CLIENT_PATH = path.join(__dirname, 'Meross.py')

export default class Meross {
  /**
   * @arg {object} opts
   * @arg {boolean} opts.debug
   * @arg {string} opts.email
   * @arg {string} opts.password
   * @example
   * const meross = new Meross({
   *   email: '...',
   *   password: '...',
   * })
   *
   * await meross.connect()
   * //...
   * await meross.disconnect()
   */
  constructor(opts = {}) {
    if (!opts.email || !opts.password) {
      throw new Error('Meross credentials required')
    }

    this.DEBUG = opts.debug
    this.clientSocket = null
    this.merossEmail = opts.email
    this.merossPassword = opts.password
    this.pythonProcess = null
    this.server = null
    this.socket = null
  }

  async connect() {
    const server = http.createServer(express()).listen()
    const socket = SocketIO(server)

    this.server = server
    this.socket = socket
    return new Promise((resolve) => {
      const spawnOpts = {}

      socket.on('connection', (client) => {
        this.clientSocket = client
        client.on('disconnect', () => {
          this.clientSocket = null
        })
        resolve()
      })

      if (this.DEBUG) {
        spawnOpts.stdio = 'inherit'
      }

      this.pythonProcess = spawn(
        'python3',
        [
          PYTHON_CLIENT_PATH,
          server.address().port,
          this.merossEmail,
          this.merossPassword,
        ],
        spawnOpts
      )
    })
  }

  /**
   * Send raw command and props
   *
   * @arg {string} command
   * @arg {object} props
   * @returns {object}
   */
  async send(command, props = {}) {
    return new Promise((resolve) => {
      if (this.clientSocket) {
        this.clientSocket.once('output', (res) => resolve(JSON.parse(res)))
        this.clientSocket.emit('input', command, props)
      } else {
        throw new Error('No client available')
      }
    })
  }

  async disconnect() {
    if (this.pythonProcess) this.pythonProcess.kill()
    if (this.socket) this.socket.close()
    if (this.server) this.server.close()
  }
}
