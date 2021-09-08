import { BigNumber } from "ethers";
import { Engine, EngineBetType, EngineResult, EngineState, StatusCode } from "./Engine";

//TODO: reject promises when something fails
export class PokerEngine implements Engine {
    _player: number; //Player* address in C++ memory
    player_id: number;
    counter: number;
    callbacks: {};
    worker: Worker;

    constructor(player_id: number, wasm_path: string = null) {
        if (wasm_path == null)
          wasm_path = `${__dirname}/poker-lib-wasm.js`;
        
        this.player_id = player_id;
        this.counter = new Date().getTime();
        this.callbacks = {};
        this.worker = new Worker(wasm_path);
        this.worker.addEventListener("message", (event) => {           
            this._runCallback(event.data);
        });
    }

    async init(
        alice_funds: BigNumber,
        bob_funds: BigNumber,
        big_blind: BigNumber,
        encryption: boolean = true
    ): Promise<EngineResult> {
        // Initialize libraries
        await this._callWorker("poker_init", makeMessage(encryption), () => StatusCode.SUCCESS);

        // create player instance
        await this._callWorker("poker_new_player", makeMessage(this.player_id), (results) => {
            this._player = parseInt(results[0]);
        });

        // Initialize game
        const result = await this._callWorker(
            "player_init",
            makeMessage(this._player, alice_funds.toString(), bob_funds.toString(), big_blind.toString()),
            (results) => {
                return parseInt(results[0]);
            }
        );
        return result;
    }

    async create_handshake(): Promise<EngineResult> {
        return this._callWorker("player_create_handshake", makeMessage(this._player), (results) => {
            return {
                status: parseInt(results[0]),
                message_out: results[1],
            };
        });
    }

    async process_handshake(message_in: Uint8Array): Promise<EngineResult> {
        return this._callWorker("player_process_handshake", makeMessage(this._player, message_in), (results) => {
            return {
                status: parseInt(results[0]),
                message_out: results[1],
            };
        });
    }

    async create_bet(type: EngineBetType, amount: BigNumber): Promise<EngineResult> {
        return this._callWorker("player_create_bet", makeMessage(this._player, type, amount.toString()), (results) => {
            return {
                status: parseInt(results[0]),
                message_out: results[1],
            };
        });
    }

    async process_bet(message_in: Uint8Array): Promise<EngineResult> {
        return this._callWorker("player_process_bet", makeMessage(this._player, message_in), (results) => {
            return {
                status: parseInt(results[0]),
                betType: parseInt(results[1]),
                amount: parseBigNumber(results[2]),
                message_out: results[3],
            };
        });
    }

    async game_state(): Promise<EngineState> {
        return this._callWorker("player_game_state", makeMessage(this._player), (results) => {
            let state = JSON.parse(parseString(results[0]), (key, value) => {
                return key == "total_funds" || key == "bets" ? BigNumber.from(value) : value;
            });

            const fundsShare = Array(2);
            const alice = state.players[0];
            const bob = state.players[1];
            if (state.winner == 2) {
                fundsShare[0] = alice.total_funds;
                fundsShare[1] = bob.total_funds;
            } else if (state.winner == 0) {
                fundsShare[0] = alice.total_funds.add(bob.bets);
                fundsShare[1] = bob.total_funds.sub(bob.bets);
            } else if (state.winner == 1) {
                fundsShare[0] = alice.total_funds.sub(alice.bets);
                fundsShare[1] = bob.total_funds.add(alice.bets);
            }
            state.funds_share = fundsShare;

            return state;
        });
    }

    async _callWorker(funcName, data, resultHandler): Promise<any> {
        return new Promise((resolve, reject) => {
            const callbackId = this._registerCallback((results) => {
                const finalResult = resultHandler(results);
                console.log(`[Player ${this.player_id}] ---> finalResult:`, funcName, finalResult);
                resolve(finalResult);
            });
            this.worker.postMessage({ funcName, callbackId, data });
        });
    }

    _registerCallback(fn) {
        const callbackId = ++this.counter;
        this.callbacks[callbackId] = { fn, results: [] };
        return callbackId;
    }

    _runCallback(event) {
        const callback = this.callbacks[String(event.callbackId)];
        callback.results.push(event.data);
        if (event.finalResponse) {
            delete this.callbacks[event.callbackId];
            var result = callback.fn(callback.results);
        }
    }
}

function makeMessage(...args): Uint8Array {
    const enc = new TextEncoder();
    const buffers = [];
    for (var i in args) {
        let v = args[i];
        const t = typeof v;
        switch (t) {
            case "string":
                buffers.push(enc.encode(v + "\0"));
                break;
            case "boolean":
            case "number":
                const b = new ArrayBuffer(4);
                const v32 = new Int32Array(b);
                v32[0] = v;
                buffers.push(b);
                break;
            default:
                if (v instanceof Uint8Array) {
                    const b = new ArrayBuffer(4);
                    const len = new Int32Array(b);
                    len[0] = v.byteLength;
                    buffers.push(b);
                    buffers.push(v.buffer);
                } else throw new Error(`*** Unsupported type ${t}`);
        }
    }
    const size = buffers.reduce((m, a) => m + a.byteLength, 0);
    const result = new Uint8Array(size);
    for (let i = 0, p = 0; i < buffers.length; i++) {
        result.set(new Uint8Array(buffers[i]), p);
        p += buffers[i].byteLength;
    }
    return result;
}

function parseInt(buffer) {
    const v32 = new Int32Array(buffer.buffer);
    return v32[0];
}

function parseBigNumber(buffer) {
    return BigNumber.from(parseString(buffer));
}

function parseString(buffer) {
    const dec = new TextDecoder("ascii");
    return dec.decode(buffer.buffer);
}
