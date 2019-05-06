###
# NOTE: most of this logic was referenced from here:
# https://github.com/ehendrix23/aioharmony/blob/0961024/aioharmony/__main__.py
###

import asyncio
import json
import sys

import aioharmony.exceptions
from aioharmony.harmonyapi import HarmonyAPI, SendCommandDevice
from aioharmony.responsehandler import Handler
from socketIO_client import SocketIO

CLIENT = None
HUB_IP = sys.argv[2]
SOCKET_PORT = int(sys.argv[1])

async def getClient(ip_address):
  client = HarmonyAPI(ip_address)

  if await client.connect():
    print('Connected to HUB {}'.format(client.name))
    return client

  print('Unable to connect to hub')
  return None

# TODO: combine with getClient
async def setGlobalClient():
  global CLIENT

  try:
    CLIENT = await getClient(HUB_IP)
  except aioharmony.exceptions.TimeOut:
    print('Timed out when trying to connect to hub')
    raise

async def handleInput(data):
  (commandName, props) = data

  if commandName == 'close':
    await CLIENT.close()

  elif commandName == 'get-config':
    return CLIENT.json_config

  elif commandName == 'send-command':
    command = SendCommandDevice(
      device=props['deviceId'],
      command=props['command'],
      delay=props['delay']
    )

    commandList = []
    for _ in range(props['repeats']):
      commandList.append(command)
      if props['delay'] > 0:
        commandList.append(props['delay'])

    resultList = await CLIENT.send_commands(commandList)

    if resultList:
      errorList = []

      for result in resultList:
        errorList.append(result.msg)

      return { 'errors': errorList }

  elif commandName == 'start-activity':
    response = await CLIENT.start_activity(props['id'])

    if not response[0]:
      return { 'errors': [ response[1] ] }

  return {}

if __name__ == '__main__':
  loop = asyncio.new_event_loop()
  asyncio.set_event_loop(loop)
  loop.run_until_complete(setGlobalClient())
  socket = SocketIO('localhost', SOCKET_PORT)

  def handler(*data):
    result = loop.run_until_complete(asyncio.gather(
      handleInput(data)
    ))

    socket.emit('output', json.dumps(result[0]))

  socket.on('input', handler)
  socket.wait()
