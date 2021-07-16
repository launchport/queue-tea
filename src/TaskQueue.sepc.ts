import waitForExpect from "wait-for-expect";
import { TaskQueue } from "./TaskQueue";

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe("TaskQueue", () => {
  it.todo("should execute one task at a time");

  it("should be able to run and pause the queue", async () => {
    const mocka = jest.fn();
    const queue = TaskQueue<{ run: undefined }>({ tasks: { run: mocka } });

    jest.useFakeTimers();
    queue.queueTask("run");
    queue.queueTask("run");
    queue.queueTask("run");

    queue.run();
    queue.pause();

    await waitForExpect(() => {
      expect(queue.getQueueItems().length).toBe(2);
      expect(mocka).toHaveBeenCalledTimes(1);
    });

    jest.runAllTicks();
    expect(mocka).not.toHaveBeenCalledTimes(2);

    queue.run();

    await waitForExpect(() => {
      expect(queue.getQueueItems().length).toBe(0);
      expect(mocka).toHaveBeenCalledTimes(3);
    });

    jest.useRealTimers();
  });

  it("should retry a task when it fails", async () => {
    const mocka = jest
      .fn()
      .mockRejectedValueOnce("ERROR 01")
      .mockRejectedValueOnce("ERROR 02")
      .mockResolvedValue("SUCCESS 01");

    const queue = TaskQueue<{ run: undefined }>({
      tasks: { run: mocka },
    });

    jest.useFakeTimers();
    queue.queueTask("run");
    queue.run();

    jest.advanceTimersToNextTimer();
    await flushPromises();
    expect(mocka).toHaveBeenCalledTimes(1);

    jest.advanceTimersToNextTimer();
    await flushPromises();
    expect(mocka).toHaveBeenCalledTimes(2);

    jest.advanceTimersToNextTimer();
    await flushPromises();
    expect(mocka).toHaveBeenCalledTimes(3);

    expect(queue.getQueueItems().length).toBe(0);

    jest.useRealTimers();
  });

  // @todo
  // it('should execute one task at a time', async () => {
  //   const mocka = jest.fn()
  //   const queue = TaskQueue<{ run1: undefined; run2: undefined }>({
  //     tasks: {
  //       run1: mocka,
  //       run2: () => new Promise(() => {}),
  //     },
  //   })
  //
  //   jest.useFakeTimers()
  //   queue.queueTask('run2')
  //   queue.queueTask('run1')
  //
  //   queue.run()
  //
  //   jest.advanceTimersToNextTimer()
  //   await flushPromises()
  //
  //   expect(mocka).not.toHaveBeenCalled()
  //   jest.useRealTimers()
  // })
});
