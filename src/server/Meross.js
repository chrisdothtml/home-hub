import path from 'path'
import Pyjs from './Pyjs'

export default class Meross {
  /**
   * @arg {{
   *   email: string,
   *   password: string,
   * }} opts
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
  constructor(opts) {
    if (!opts.email || !opts.password) {
      throw new Error('Meross credentials required')
    }

    this.pyjs = new Pyjs({
      // debug: true,
      entry: path.join(__dirname, 'Meross.py'),
      spawnArgs: [opts.email, opts.password],
    })
  }

  async connect() {
    return this.pyjs.connect()
  }

  async disconnect() {
    return this.pyjs.disconnect()
  }

  async getDevices() {
    return this.pyjs.send({ commandName: 'get-devices' })
  }

  /**
   * @arg {string} deviceName
   * @example
   * await meross.turnDeviceOn('Livingroom lamp')
   */
  async turnDeviceOn(deviceName) {
    return this.pyjs.send({ commandName: 'turn-device-on', deviceName })
  }

  /**
   * @arg {string} deviceName
   * @example
   * await meross.turnDeviceOff('Livingroom lamp')
   */
  async turnDeviceOff(deviceName) {
    return this.pyjs.send({ commandName: 'turn-device-off', deviceName })
  }
}
