# poker-lib / RISC-V

RISC-V build environment of the mental poker library

## Reqirements

1. Docker
2. Cartesi machine toolchain docker image: `cartesi/toolchain:latest`
3. cartesi-machine.lua 

## Build artifacts

### hello

Simple console app for sanity check
```bash
$ ./platform-run.sh run-hello
```

### poker-lib-sample

Poker-lib sample program
```bash
$ ./platform-run.sh run-poker-lib-sample
```


