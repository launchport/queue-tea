# queue-tea

Cute & simple, robust, persistable job & task queue written in typescript. Full type safety included.

```ts
import Queue from 'queue-tea'

interface Tasks {
  syncDataWithCloud: { username: string; count: number; }
  doSomethingInBackground: { }
}

const queue = Queue<Tasks>({
  tasks: {
    syncDataWithCloud: async ({ username, count }) => {
      fetch('http://example.com/api/', {
        body: JSON.stringify({ username, count })
      })
    },
    doSomethingInBackground: async ({}, { createdAt, retries }) => {
      // This is a fun task, that fails 3 times, than succeeds
      if (retries < 2) {
        throw new Error('Not this time')
      }

      return
    },
  }
}

queue.run();
```

## Introduction

**Queue Tee** is meant to be a local queue for Javascript applications running for React Native, Electron or the Browser.

We use it to ensure some tasks that should be performed in the background, can fail and can be retried. It's also **persistable by serializing** it and providing the state as `initialState`.

## How it works

### Options

| Option       | Value                                                |
| ------------ | ---------------------------------------------------- |
| initialState | `{}`                                                |
| onChange     | `onChange?: (queue: QueueType<G>) => Promise<void>;` |
| retryDelay   | `(retries: number) => number`                        |

### Retrying

The queue relies on **Exceptions**. When a tasks fails, it should throw an exception. It then will be retried.

> _**Info:** By default, the task will be retried every "1 second \* retries" with a maximum of 5 seconds. You can change this by providing a function to the **retryDelay** option._
