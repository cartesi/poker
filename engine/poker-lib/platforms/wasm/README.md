# poker-lib / WASM

WebAssembly build environment of the mental poker library

## Reqirements

1. Docker

## Build artifacts

### hello

Simple console app for sanity check
```bash
$ ./platform-run.sh run-hello
```

### poker-lib-sample

Poker-lib sample written in C++ 
```bash
$ ./platform-run.sh run-poker-lib-sample
```

### run-poker-lib-js-sample:
Poker-lib sample written in JavaScript
```bash
$ ./platform-run.sh run-poker-lib-js-sample:
```


### server
Poker-lib sample running on the web browser.
Navigate to http://localhost:1234 after the server is started
```bash
$ ./platform-run.sh run-server
```