import { TurnBasedGame } from "../TurnBasedGame";

/**
 * TurnBasedGame mock implementation
 *
 * Expects to be connected to another instance of TurnBasedGameMock
 */
export class TurnBasedGameMock implements TurnBasedGame {
    other: TurnBasedGameMock;
    queue: Array<any>;
    callbacks: Array<(any) => {}>;

    constructor() {
        this.queue = [];
        this.callbacks = [];
    }

    connect(other: TurnBasedGameMock) {
        this.other = other;
        other.other = this;
    }

    send(data: any, callback?: (any) => any) {
        this.other.queue.push(data);
        this.other.dispatch();
        if (callback) {
            callback(data);
        }
    }

    receive(callback: (any) => any) {
        this.callbacks.push(callback);
        this.dispatch();
    }

    dispatch() {
        const data = this.queue.shift();
        if (!data) return;
        const callback = this.callbacks.shift();
        if (!callback) {
            this.queue.unshift(data);
            return;
        }
        callback(data);
        this.dispatch();
    }
}
