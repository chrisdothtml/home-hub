# Pyjs

> A utility for communicating with a python file via a socket server

## How to use

**index.js**

```js
import path from 'path'
import Pyjs from './Pyjs'

async function main() {
  const pyjs = new Pyjs({
    entry: path.join(__dirname, 'index.py'),
    spawnArgs: ['World'],
  })

  await pyjs.connect()
  console.log(await pyjs.send('say-hi')) //> 'Hello, World!'
  console.log(await pyjs.send('say-bye')) //> 'Goodbye, World!'
  await pyjs.disconnect()
}

main()
```

**index.py**

```py
import sys
from Pyjs.client import on_message

# args passed in `spawnArgs` start at index 2
NAME = sys.argv[2]

def handler(command, callback):
  if command == 'say-hi':
    callback('Hello, {}!'.format(NAME))
  elif command == 'say-bye':
    callback('Goodbye, {}!'.format(NAME))

on_message(handler)
```
