require("./tests/WebWorker.js");
import path from "path";
import { WasmEngine } from "./src/WasmEngine"

const wasm_path = `${__dirname}/lib/poker-lib-wasm.js`;

async function test() {
  // There is nothing going on here - just boilerplate code for future work
  const alice = new WasmEngine(0, wasm_path);
  console.log('OK')
}

test();

console.log('OK');
