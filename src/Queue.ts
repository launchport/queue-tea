export class Queue<G> {
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
