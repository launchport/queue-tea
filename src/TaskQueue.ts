import { createNanoEvents } from 'nanoevents'

const sleep = (delay: number) =>
  new Promise<void>((res) => setTimeout(res, delay))

const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

export interface Task<G, T extends keyof G = any> {
  id: string
  name: T
  options: any
  retries: number
  createdAt: number
}

export type QueueType<G> = Task<G, keyof G>[]

type Taskmap<I> = {
  [K in keyof I]: (
    options: I[K],
    info: { retries: number; createdAt: number }
  ) => Promise<void> | void
}

class Queue<G> {
  public tasks: G[] = []

  constructor(elements: G[]) {
    this.tasks = elements
  }

  enqueue = (e: G) => {
    this.tasks = [...this.tasks, e]
  }
  dequeue = () => {
    const task = this.peek()
    this.tasks = this.tasks.slice(1)
    return task
  }
  isEmpty = () => {
    return this.tasks.length === 0
  }
  peek = () => {
    return !this.isEmpty() ? this.tasks[0] : undefined
  }
  length = () => {
    return this.tasks.length
  }
}

type QueueEvents<G> = {
  success: (task: Task<G>) => void
  fail: (task: Task<G>, error: any) => void
  change: ({
    tasks,
    remainingTasks,
  }: {
    tasks: Task<G>[]
    remainingTasks: number
  }) => void
}
type Primitives = string | number | boolean | null

export const defaultCalculateBackoff = (retryCount: number) => {
  const noise = Math.random() * 100
  return Math.min(retryCount * 1000, 5000) + noise
}

export const TaskQueue = <
  G extends Record<string, O | undefined>,
  O extends Record<string, Primitives> = any
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
    const id = uuidv4()
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
