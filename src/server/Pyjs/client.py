import json
import sys
from socketIO_client import SocketIO

PORT = int(sys.argv[1])

def on_message(handler):
  socket = SocketIO('localhost', PORT)

  def createCallback(id):
    def callback(response):
      socket.emit(id, json.dumps(response))

    return callback

  def handle_message(data):
    handler(data['payload'], createCallback(data['id']))

  socket.on('input', handle_message)
  socket.wait()
