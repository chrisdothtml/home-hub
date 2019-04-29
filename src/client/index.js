import io from 'socket.io-client'

const socket = io()

async function send(channel, payload = {}) {
  return new Promise((resolve) => {
    socket.emit(channel, payload, resolve)
  })
}

window.send = send
