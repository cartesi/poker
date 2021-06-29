# poker-lib

This is the root of the mental poker game library: poker-lib. It provides the following functionality:
- Game flow control
- Deck shufling 
- Card dealing
- Betting rules
- Hand evaluation
- Game result verification
- Message encoding and decoding
- WebWorker interface

### Building

The poker-lib source code is located under `poker-lib/`. It is compiled for 3 targets:
- WebAssembly: executed in web browser during the live play
- RISC-V: executed in Cartesi Machine for verifying a game result
- x86/64: Optional. Used during development phase - faster build/testing cycles.

You must build the poker-library and its third party dependencies, for WASM and risc-v, as follows:
```bash
$ cd platforms/wasm
make toolchain
make
```
and
```bash
cd platforms/risc-v
make toolchain
make
```

This will fetch the source, configure, patch, compile and install the code of all dependencies as well as the poker-lib.

### Running

The output artifacts for each platform are stored in `platforms/[plat]/build`.

#### WebAssembly

The WebAssembly artifacts used in the borwser are stored in `platforms/wasm/build/poker-lib`:
- poker-lib-wasm.wasm : binary WebAssembly module.
- poker-lib-wasm.js : JavaScript bindings for the WebAssembly module.
- poker-lib.js: High-level JavaScript class wrapping the WebAssembly module.

These files are copied to the wep app directory and used in the web browser.

#### RISC-V

The RISC-V game verification program is written to `platforms/risc-v/poker-lib/verify`.
You can run a test game verification in the Cartesi Machine as follows:
```bash
cd platforms/risc-v
./platform-run.sh test-verifier
```

#### Miscelaneous

For opening a shell prompt inside a platform build environment:
```bash
$ cd platforms/[plat]
$ make shell
```


