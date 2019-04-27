import HarmonyHub from './index.js'

const commands = [
  {
    device: 'Samsung TV',
    command: 'VolumeDown',
  },
  {
    device: 'Samsung TV',
    command: 'VolumeUp',
  },
]

async function main() {
  const hub = new HarmonyHub('...')
  await hub.connect()

  try {
    for (const command of commands) {
      console.log(`sending ${command.command} to ${command.device}`)
      await hub.sendCommand(command)
    }
  } finally {
    await hub.disconnect()
  }
}

main().catch(console.error)
