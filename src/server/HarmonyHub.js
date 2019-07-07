import path from 'path'
import Pyjs from './Pyjs'

export function getId(config, type, name) {
  for (const [key, value] of Object.entries(config[type])) {
    if (type === 'Activities' && value === name) {
      return key
    } else if (type === 'Devices' && key === name) {
      return value.id
    }
  }

  return null
}

export default class HarmonyHub {
  /**
   * @arg {string} hubIP
   * @example
   * const hub = new HarmonyHub('10.0.0...')
   *
   * await hub.connect()
   * //...
   * await hub.disconnect()
   */
  constructor(hubIP) {
    this.pyjs = new Pyjs({
      // debug: true,
      entry: path.join(__dirname, 'HarmonyHub.py'),
      spawnArgs: [hubIP],
    })
  }

  async connect() {
    return this.pyjs.connect()
  }

  async disconnect() {
    return this.pyjs
      .send({ commandName: 'close' })
      .then(() => this.pyjs.disconnect())
  }

  async getConfig() {
    if (!this.DEBUG && this._cachedConfig) {
      return this._cachedConfig
    }

    const result = await this.pyjs.send({ commandName: 'get-config' })

    if (!this.DEBUG) {
      this._cachedConfig = result
    }

    return result
  }

  /**
   * @arg {{
   *   command: string,
   *   delay: number,
   *   device: string,
   *   repeats: number,
   * }} opts
   * @example
   * await hub.sendCommand({
   *   device: 'Samsung TV',
   *   command: 'VolumeUp',
   * })
   */
  async sendCommand(opts) {
    const config = await this.getConfig()
    const deviceId = getId(config, 'Devices', opts.device)

    if (deviceId) {
      opts = {
        delay: 0,
        repeats: 1,
        ...opts,
      }

      opts.deviceId = deviceId
      delete opts.device
      return this.pyjs.send({ commandName: 'send-command', ...opts })
    } else {
      throw new Error(`Device doesn't exist in hub: ${opts.device}`)
    }
  }

  /**
   * @arg {string} activity
   * @example
   * await hub.startActivity('Watch TV')
   */
  async startActivity(activity) {
    const config = await this.getConfig()
    const id = getId(config, 'Activities', activity)

    if (id) {
      return this.pyjs.send({ commandName: 'start-activity', id })
    } else {
      throw new Error(`Activity doesn't exist in hub: ${activity}`)
    }
  }

  /**
   * Stop current activity
   * @example
   * await hub.stopActivity()
   */
  async stopActivity() {
    return this.pyjs.send({ commandName: 'start-activity', id: '-1' })
  }
}
