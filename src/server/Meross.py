###
# NOTE: logic referenced from here:
# https://github.com/albertogeniola/MerossIot/tree/e0e1fda#usage
###

import sys
from meross_iot.api import MerossHttpClient
from Pyjs.client import on_message

CLIENT = None
MEROSS_EMAIL = sys.argv[2]
MEROSS_PASSWORD = sys.argv[3]

def handleInput(props):
  commandName = props['commandName']

  if commandName == 'get-devices':
    devices = CLIENT.list_supported_devices()
    result = []

    for device in devices:
      result.append({
        'name': device._name,
        'isOn': device.get_status(0)
      })

    return result

  elif commandName == 'turn-device-on':
    for device in CLIENT.list_supported_devices():
      if device._name == props['deviceName']:
        device.turn_on()

  elif commandName == 'turn-device-off':
    for device in CLIENT.list_supported_devices():
      if device._name == props['deviceName']:
        device.turn_off()

  return {}

if __name__ == '__main__':
  CLIENT = MerossHttpClient(email=MEROSS_EMAIL, password=MEROSS_PASSWORD)

  def handler(data, callback):
    callback(handleInput(data))

  on_message(handler)
