###
# NOTE: most of this logic was referenced from here:
# https://github.com/ehendrix23/aioharmony/blob/0961024/aioharmony/__main__.py
###

import asyncio
import sys
import aioharmony.exceptions
from aioharmony.harmonyapi import HarmonyAPI, SendCommandDevice
from aioharmony.responsehandler import Handler
from Pyjs.client import on_message

CLIENT = None
HUB_IP = sys.argv[2]

async def getClient(ip_address):
  client = HarmonyAPI(ip_address)

  if await client.connect():
    return client

  return None

# TODO: combine with getClient
async def setGlobalClient():
  global CLIENT

  try:
    CLIENT = await getClient(HUB_IP)
  except aioharmony.exceptions.TimeOut:
    print('Timed out when trying to connect to hub')
    raise

async def handleInput(props):
  commandName = props['commandName']

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

  def handler(data, callback):
    result = loop.run_until_complete(asyncio.gather(
      handleInput(data)
    ))
    callback(result[0])

  on_message(handler)
