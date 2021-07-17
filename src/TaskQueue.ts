import { createNanoEvents } from 'nanoevents'

import { Queue } from './Queue'
import { sleep } from './utils/sleep'
import { uuid } from './utils/uuid'
import type { Primitive, QueueEvents, QueueType, Taskmap } from './types'

export const defaultCalculateBackoff = (retryCount: number) => {
  const noise = Math.random() * 100
  return Math.min(retryCount * 1000, 5000) + noise
}

export const TaskQueue = <
  G extends Record<string, O | undefined>,
  O extends Record<string, Primitive> = any
>({
  initialState = [],
  tasks,
  onChange,
  retryDelay = defaultCalculateBackoff,
}: {
  initialState?: QueueType<G>
  tasks: Taskmap<G>
  onChange?: (queue: QueueType<G>) => Promise<void>
  retryDelay?: (retries: number) => number
}) => {
  const events = createNanoEvents<QueueEvents<G>>()

  const queuedTasks = new Queue(initialState)

  let state: 'paused' | 'running' | 'idle' = 'paused'

  const queueTask = <K extends keyof G>(
    name: K,
    ...options: G[K] extends undefined ? never : [G[K]]
  ) => {
    const id = uuid()
    queuedTasks.enqueue({
      id,
      name,
      retries: 0,
      options: options[0],
      createdAt: Date.now(),
    })

    if (state === 'idle') {
      run()
    }

    const task = new Promise<void>((res, rej) => {
      events.on('success', (task) => {
        if (task.id === id) {
          res()
        }
        events.on('fail', (task, error) => {
          if (task.id === id) {
            rej(error)
          }
        })
      })
    })
    return { id, task }
  }

  const pause = () => {
    state = 'paused'
  }

  const isPaused = () => state === 'paused'

  const run = async () => {
    state = 'running'

    while (!queuedTasks.isEmpty()) {
      if (isPaused()) {
        break
      }

      const task = queuedTasks.peek()
      if (!task) {
        break
      }
      try {
        await tasks[task.name](task.options, {
          createdAt: task.createdAt,
          retries: task.retries,
        })
        queuedTasks.dequeue()
        onChange?.(queuedTasks.tasks)
        events.emit('success', task)
      } catch (e) {
        events.emit('fail', task, e)

        await sleep(retryDelay(++task.retries))
      } finally {
        events.emit('change', {
          tasks: [...queuedTasks.tasks],
          remainingTasks: queuedTasks.length(),
        })
      }
    }

    state = 'idle'
  }

  return {
    run,
    getState: () => state,
    pause,
    getQueueItems: () => [...queuedTasks.tasks],
    addEventListener: <E extends keyof QueueEvents<G>>(
      event: E,
      callback: QueueEvents<G>[E]
    ) => events.on(event, callback),
    queueTask,
  }
}
