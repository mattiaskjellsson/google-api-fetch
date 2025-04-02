export default class RateLimiter {
  constructor({maxConcurrent = 5, intervalMs = 1000} = {}) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
    this.intervalMs = intervalMs;
    this.lastRequestTime = 0;
  }

  async execute(fn, ...args) {
    return new Promise((resolve, reject) => {
      this.queue.push({fn, args, resolve, reject});
      this._run();
    });
  }

  async _run() {
    if(this.running >= this.maxConcurrent) return;
    if(this.queue.length === 0) return;

    const item = this.queue.shift();
    this.running++;
    const now = Date.now();
    const timeToWait = Math.max(0, this.intervalMs - (now - this.lastRequestTime));

    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }

    try {
      this.lastRequestTime = Date.now();
      const result = await item.fn(...item.args);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
    finally {
      this.running--;
      this._run();
    }
  }
}