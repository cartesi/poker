# Poker Engine

Main logic for the [Texas HODL'em Poker](../README.md) game.

## Getting started

The Poker Engine makes use of the [LibTMCG](https://www.nongnu.org/libtmcg/)  C++ library in order to have the necessary cryptographic toolbox for implementing a [Mental Poker](https://en.wikipedia.org/wiki/Mental_poker) solution, enabling users to play card games without the need of a trusted third party.

This implementation also includes a special setup to ensure a game can be fully verified using only the information already exchanged, without requiring the players to disclose any additional data. This is achieved by using a special “Referee” design in which an additional deterministic participant is included in the game and used to run the verification.

Other than that, the engine provides the following specific functionalities:

- Game flow control
- Deck shufling
- Card dealing
- Betting rules
- Hand evaluation
- Game result verification
- Message encoding and decoding
- WebWorker interface

## Building

The main source code is located under `poker-lib/`. It is compiled for 3 targets:

- `WebAssembly`: executed in web browser during the live play
- `RISC-V`: executed in Cartesi Machine for verifying a game result
- `x86/64`: Optional. Used during development phase - faster build/testing cycles.

You must build the poker library and its third party dependencies, for WASM and RISC-V, as follows:

```bash
$ cd platforms/wasm
$ make toolchain
$ make
```

and

```bash
$ cd platforms/risc-v
$ make toolchain
$ make
```

This will fetch the source, configure, patch, compile and install the code of all dependencies as well as the `poker-lib` itself.

Alternatively, you may simply run `make` within the `engine` directory to build all platforms, including x86/64.

## Running

The output artifacts for each platform are stored in `platforms/[plat]/build`.

### WebAssembly

The WebAssembly artifacts used in the browser are stored in `platforms/wasm/build/poker-lib`:

- `poker-lib-wasm.wasm`: binary WebAssembly module.
- `poker-lib-wasm.js`: JavaScript bindings for the WebAssembly module.
- `poker-lib.js`: high-level JavaScript class wrapping the WebAssembly module.

These files will later be copied to the wep app directory and used in the web browser.

### RISC-V

The RISC-V game verification program is written to `platforms/risc-v/poker-lib/verify`.

You can run a test game verification in the Cartesi Machine as follows:

```bash
$ cd platforms/risc-v
$ ./platform-run.sh test-verifier
```

### Miscelaneous

For opening a shell prompt inside a platform build environment, execute the following commands:

```bash
$ cd platforms/[plat]
$ make shell
```
