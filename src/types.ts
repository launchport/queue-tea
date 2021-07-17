interface Task<G, T extends keyof G = any> {
  id: string
  name: T
  options: any
  retries: number
  createdAt: number
}

export type QueueType<G> = Task<G, keyof G>[]

export type Taskmap<I> = {
  [K in keyof I]: (
    options: I[K],
    info: { retries: number; createdAt: number }
  ) => Promise<void> | void
}

export type QueueEvents<G> = {
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
export type Primitive = string | number | boolean | null
