export class EventQueue {
    constructor() {
        this.queue = [];
        this.running = false;
    }

    enqueue(fn) {
        return async (...args) => {
            this.queue.push(() => fn(...args));
            if (this.running) return;

            this.running = true;
            while (this.queue.length) {
                await this.queue.shift()();
            }
            this.running = false;
        };
    }
}
