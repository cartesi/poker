
class Player {
    constructor(player_id) {
      this.player_id = player_id;
      this.ctr = new Date().getTime();
      this.cbks = {};
      this.worker = new Worker('poker-lib-wasm.js');
      this.worker.addEventListener('message', (event) => {
        this.runCallback(event.data);
      });
    }
    
    async init(alice_money, bob_money, big_blind) {
        // Initialize libraries
        await this.callWorker('poker_init', 0, () => 0);

        // create player instance
        await this.callWorker('poker_new_player', makeMessage(this.player_id), (results) => {
            this._p = parseInt(results[0]);
        });

        // Initialize game
        const res = await this.callWorker('player_init', makeMessage(this._p, to_bignumber(alice_money), to_bignumber(bob_money), to_bignumber(big_blind)), (results) => {
            return parseInt(results[0]);
        });
        return res;
    }

    async create_handshake() {
        return this.callWorker('player_create_handshake', makeMessage(this._p), (results) => {
            return { 
                res: parseInt(results[0]),
                msg_out: results[1]
            };
        });
    }

    async process_handshake(msg_in) {
        window.msg_in = msg_in
      return this.callWorker('player_process_handshake', makeMessage(this._p, msg_in), (results) => {
            return { 
                res: parseInt(results[0]),
                msg_out: results[1]
            };
        });
    }

    async create_bet(type, amt) {
        return this.callWorker('player_create_bet', makeMessage(this._p, type, to_bignumber(amt)), (results) => {
            return { 
                res: parseInt(results[0]),
                msg_out: results[1]
            };
        });
    }

    async process_bet(msg_in) {
        return this.callWorker('player_process_bet', makeMessage(this._p, msg_in), (results) => {
          return { 
                res: parseInt(results[0]),
                betType: parseInt(results[1]),
                amount: parseBignumber(results[2]),
                msg_out: results[3]
            };
        });
    }

    async game_state() {
        return this.callWorker('player_game_state', makeMessage(this._p), (results) => {
            return JSON.parse(parseString(results[0]));
        });
    }

    registerCallback(fn) {
        const callbackId = ++this.ctr;
        this.cbks[callbackId] = { fn, results:[] };
        return callbackId;
    }

    runCallback(evt) {
        const cb = this.cbks[evt.callbackId];
        cb.results.push(evt.data);
        if (evt.finalResponse) {
            delete this.cbks[evt.callbackId];
            var res = cb.fn(cb.results);
        }
    }

    async callWorker(funcName, data, resultHandler) {
        return new Promise((resolve, reject) => {
            const callbackId = this.registerCallback((results)=>{
                const finalResult = resultHandler(results);
                console.log('---> finalResult:', funcName,  finalResult)
                resolve(finalResult);
            })
            this.worker.postMessage( { funcName, callbackId, data });
        });

    }
}


function makeMessage(...args) {
  const enc = new TextEncoder('ascii')
  const buffers = []
  for(var i in args) {
    v = args[i];
    const t = typeof v;
    switch(t) {      
      case 'string':
        buffers.push(enc.encode(v+"\0"));
        break;
      case 'number':
        const b = new ArrayBuffer(4)
        const v32 = new Int32Array(b)
        v32[0] = v;
        buffers.push(b);
        break;
      default:
        if (v instanceof Uint8Array) {
          const b = new ArrayBuffer(4)
          const len = new Int32Array(b)
          len[0] = v.byteLength;
          buffers.push(b);
          buffers.push(v.buffer);
        } else
          throw new Error(`*** Unsupported type ${t}`);
    }
  }
  const size = buffers.reduce((m,a)=>m+a.byteLength, 0);
  const res = new Uint8Array(size);
  for(let i=0, p=0; i<buffers.length; i++) {
    res.set(new Uint8Array(buffers[i]), p);
    p += buffers[i].byteLength;
  }
  return res;
}

function parseInt(buffer) {
    const v32 = new Int32Array(buffer.buffer);
    return v32[0]
}

function parseBignumber(buffer) {
  return Number(parseString(buffer)); // TODO  
}

function parseString(buffer) {
    const dec = new TextDecoder('ascii')
    return dec.decode(buffer.buffer)
}

function to_bignumber(v) {
  return String(v) // TODO
}


