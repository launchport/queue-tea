![](docs/logo.png)

Cute & simple, robust, persistable **job & task queue** written in typescript. _Full type safety included._ ✌🏼

```ts
import createQueue from 'queue-tea'

interface Tasks {
  syncDataWithCloud: { username: string; count: number }
  runInBackground: undefined
}

const queue = createQueue<Tasks>({
  tasks: {
    syncDataWithCloud: async ({ username, count }) => {
      fetch('http://example.com/api/', {
        body: JSON.stringify({ username, count }),
      })
    },
    runInBackground: async (_options, { createdAt, retries }) => {
      // This is a fun task, that fails 3 times, than succeeds
      if (retries < 2) {
        throw new Error('Not this time')
      }

      return
    },
  },
})

queue.queueTask('syncDataWithCloud', { username: 'rainbow cat', count: 69 })
queue.queueTask('runInBackground')

queue.run()

```

## Installation

You know the drill 👏

```sh
yarn add queue-tea

### or for the npm fans

npm install --save queue-tea
```

## Introduction

**Queue Tea** is meant to be a local queue for Javascript applications running for React Native, Electron or the Browser.

We use it to ensure some tasks that should be performed in the background, can fail and can be retried. It's also **persistable by serializing** it and providing the state as `initialState`.

## How it works

### Options

| Option       | Value                                                |
| ------------ | ---------------------------------------------------- |
| initialState | `{}`                                                 |
| onChange     | `onChange?: (queue: QueueType<G>) => Promise<void>;` |
| retryDelay   | `(retries: number) => number`                        |

### Retrying

The queue relies on **Exceptions**. When a tasks fails, it should throw an exception. It then will be retried.

> _**Info:** By default, the task will be retried every "1 second \* retries" with a maximum of 5 seconds. You can change this by providing a function to the **retryDelay** option._
