import { Queue } from './Queue'

describe('Queue', () => {
  it('should enqueue and dequeue correctly', () => {
    const q = new Queue<string>([])

    q.enqueue('one')
    q.enqueue('two')
    q.enqueue('three')

    q.dequeue()

    expect(q.tasks).toMatchInlineSnapshot(`
      Array [
        "two",
        "three",
      ]
    `)
    expect(q.length()).toBe(2)
    expect(q.peek()).toMatchInlineSnapshot(`"two"`)

    q.dequeue()
    q.dequeue()
    q.dequeue()

    expect(q.length()).toBe(0)
    expect(q.isEmpty()).toBe(true)
  })
})
