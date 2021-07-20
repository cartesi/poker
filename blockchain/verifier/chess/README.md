# TurnBasedGame Chess Verifier

Verifier machine for a game of chess, implemented using [chess.js](https://www.npmjs.com/package/chess.js).

## Overview

This verifier is composed of the following files/modules:
- The core verifier logic is defined in [chess-verifier.js](./chess-verifier.js). It runs a chess game according to the specified turn data, checks for illegal moves, and decides whether the given claimed results are false or not, punishing whichever player misbehaved.
- General purpose JavaScript code for reading TurnBasedGame input data and writing TurnBasedGame output (as a redistribution of the player's funds) is encoded in [turnbasedgame-io.js](./turnbasedgame-io.js). This code works both on NodeJS (for running on the host) and on QuickJS (used inside a Cartesi Machine).
- The script [chess-run.js](./chess-run.js) puts both modules together, reading TurnBasedGame inputs, executing the chess verifier logic, and writing the final output.
- The script [chess-run.sh](./chess-run.sh) is used exclusively inside a Cartesi Machine, and serves only to interface between mounted machine devices and input/output files.


## Running with test data

### Running on the host

You can run the chess verifier with test data on your host machine using NodeJS, by executing the following commands:

```bash
$ yarn
$ ./create-test-data.sh
$ node chess-run.js
```

### Running inside a Cartesi Machine

The same execution can be done inside a Cartesi Machine, using the bundled QuickJS JavaScript runtime.

First, run the `cartesi/playground` Docker in order to have access to the `cartesi-machine` CLI:

```bash
$ docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -w /home/$(id -u -n) \
  --rm -it cartesi/playground:0.3.0 /bin/bash
```

Once inside, prepare the test data and execute the machine as follows:
```bash
$ ./create-test-data.sh
$ cartesi-machine \
    --flash-drive="label:verifier,filename:chess-verifier.ext2" \
    --flash-drive="label:metadata,filename:metadata.raw" \
    --flash-drive="label:players,filename:players.raw" \
    --flash-drive="label:turnsMetadata,filename:turnsMetadata.raw" \
    --flash-drive="label:turnsData,filename:turnsData.raw" \
    --flash-drive="label:verificationInfo,filename:verificationInfo.raw" \
    --flash-drive="label:output,filename:output.raw,shared" \
    -- $'/mnt/verifier/chess-run.sh'
```

## Running with Descartes

### Setting up the Chess Verifier Cartesi Machine

In order to run the Chess Verifier with Descartes, the appropriate Cartesi Machine must be present inside the Descartes Environment's [machines](../../descartes-env/machines) directory. This machine will be triggered by Descartes when a player challenges a game of chess, which is specified by the hash of the verifier machine's template. Descartes will ensure that the verifier is executed with appropriate game data, and will enforce the computed result on the blockchain.

You can build the Chess Verifier Cartesi Machine by issuing the following command:
```bash
$ ./build-cartesi-machine.sh ../../descartes-env/machines
```

This will build the machine template and place it inside the appropriate `machines` directory within the Descartes Environment.

### Running a Chess TurnBasedGame from the command line

You may run a full chess game from the command line by using the TurnBasedGame _Hardhat task scripts_. Chess moves are given as strings in [Standard Algebraic Notation (SAN)](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)). For instance, "b3" means to move a pawn to column "b" and line "3", while "Nf6" means moving a knight to column "f" and line "6".

Remember that first the `Descartes Environment` should be set up as defined in the [general README.md](../../../README.md#Environment). Additionally, execute the following commands to ensure the TurnBasedGame contracts are deployed:

```bash
$ cd ../..
$ yarn
$ yarn deploy
```

Some task command examples to play a chess game:

```bash
$ npx hardhat --network localhost start-game --hash "0xbc3f901f75e08bba22f0e9497ee3478e5fafca94a78910732100981b31ed85ac"
$ npx hardhat --network localhost submit-turn --index 0 --player alice --datastr "b3"
$ npx hardhat --network localhost submit-turn --index 0 --player bob --datastr "g5"
$ npx hardhat --network localhost get-context --index 0
$ npx hardhat --network localhost claim-result --player alice --index 0 --result [70,130]
$ npx hardhat --network localhost challenge-game --player bob --index 0
$ npx hardhat --network localhost apply-result --index 0
```

**NOTE**: the actual hash of the chess machine template may vary, and will change whenever the `chess-verifier.ext2` file is rebuilt
