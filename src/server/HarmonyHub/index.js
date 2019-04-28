/*
 * Convenience utils for working with the base hub
 */

import Hub from './Hub.js'

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

export default class HarmonyHub extends Hub {
  async getConfig() {
    if (!this.DEBUG && this._cachedConfig) {
      return this._cachedConfig
    }

    const result = await this.send('get-config')

    if (!this.DEBUG) {
      this._cachedConfig = result
    }

    return result
  }

  /**
   * @arg {object} opts
   * @arg {string} opts.command
   * @arg {number} opts.delay
   * @arg {string} opts.device
   * @arg {number} opts.repeats
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
      return this.send('send-command', opts)
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
      return this.send('start-activity', { id })
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
    return this.send('start-activity', { id: '-1' })
  }
}
