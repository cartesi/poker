# Poker Engine

Main logic for the Poker game, intended to be both translated into WebAssembly, providing a Javascript API, and packaged inside a Cartesi Machine.

The Poker engine core is made up of C++ libraries, most notably [Heiko Stamer's LibTMCG library].

## Building
```bash
$ make
```

## Running

### Poker compiled to x86-64
```bash
$ make run-poker-native
```

### Poker compiled to WebAssembly in NodeJS
```bash
$ make run-poker-js
```

### Poker compiled to WebAssembly in web browser
```bash
$ make run-poker-server
```
Then navigate to http://localhost:1234

## Mock JS implementation

A simple Javascript API intended to mimic the expected behavior of the real engine, in order to allow for testing the game's UI. It can be found in the [mock] directory.
