export const sleep = (delay: number) =>
  new Promise<void>((res) => setTimeout(res, delay))
