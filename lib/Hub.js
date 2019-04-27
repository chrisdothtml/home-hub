/*
 * The base class that handles connection and communication with
 * the python process and hub
 */

import http from 'http'
import path from 'path'
import { spawn } from 'child_process'
import express from 'express'
import SocketIO from 'socket.io'

const PYTHON_CLIENT_PATH = path.join(__dirname, 'Hub.py')

export default class Hub {
  /**
   * @arg {string} hubIP
   * @arg {object} opts
   * @example
   * const hub = new HarmonyHub('10.0.0...')
   *
   * await hub.connect()
   * //...
   * await hub.disconnect()
   */
  constructor(hubIP, opts = {}) {
    this.DEBUG = opts.debug
    this.clientSocket = null
    this.hubIP = hubIP
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
        [PYTHON_CLIENT_PATH, server.address().port, this.hubIP],
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
    return this.send('close').finally(() => {
      if (this.pythonProcess) this.pythonProcess.kill()
      if (this.socket) this.socket.close()
      if (this.server) this.server.close()
    })
  }
}
