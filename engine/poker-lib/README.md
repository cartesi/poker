# poker-lib

Mental poker game library.

## Reqirements

Refer to platforms-spacific README file in `platforms/`.

## Directory structure
- poker-lib - Our mental poker source code
- platforms - Platform-spacific 3rd party code and  build environments

## Target Platforms
The library builds for 3 platforms:
- x64
- WASM
- RISC-V

For platform-spacific innformation, refer to the platform's README.

## Building

Build all platforms:

```bash
$ make
```

Build artifacts are stored in 

```
<platform-dir>/build
```

You can build individual platforms as follows:

```bash
$ cd platforms/<platform>
$ make
```
## Running
From the platform directory, use the script `platform-run.sh` to run programs.
```bash
$ cd wasm
$ ./platform-run.sh run-hello
$ ./platform-run.sh run-poker-lib-sample
$ ./platform-run.sh run-poker-lib-js-sample
$ ./platform-run.sh run-server
```

For opening a shell prompt inside the platform's build environment 
```bash
$ cd wasm
$ make shell
```



