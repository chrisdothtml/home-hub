###
# NOTE: logic referenced from here:
# https://github.com/albertogeniola/MerossIot/tree/e0e1fda#usage
###

import json
import sys

from meross_iot.api import MerossHttpClient
from socketIO_client import SocketIO

CLIENT = None
MEROSS_EMAIL = sys.argv[2]
MEROSS_PASSWORD = sys.argv[3]
SOCKET_PORT = int(sys.argv[1])

def handleInput(data):
  (commandName, props) = data

  if commandName == 'get-devices':
    devices = CLIENT.list_supported_devices()
    result = []

    for device in devices:
      result.append({
        'name': device._name
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
  socket = SocketIO('localhost', SOCKET_PORT)

  def handler(*data):
    result = handleInput(data)
    socket.emit('output', json.dumps(result))

  socket.on('input', handler)
  socket.wait()
