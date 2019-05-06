/*
 * Convenience utils for working with the base class
 */

import BaseMeross from './Meross.js'

export default class Meross extends BaseMeross {
  async getDevices() {
    return this.send('get-devices')
  }

  /**
   * @arg {string} deviceName
   * @example
   * await meross.turnDeviceOn('Livingroom lamp')
   */
  async turnDeviceOn(deviceName) {
    return this.send('turn-device-on', { deviceName })
  }

  /**
   * @arg {string} deviceName
   * @example
   * await meross.turnDeviceOff('Livingroom lamp')
   */
  async turnDeviceOff(deviceName) {
    return this.send('turn-device-off', { deviceName })
  }
}
