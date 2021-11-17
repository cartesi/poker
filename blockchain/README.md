# Poker Blockchain

Smart contracts for the [Texas HODL'em Poker](../README.md) game.

## Getting started

The `Descartes Environment` should be set up as defined in the [general README.md](../README.md#Environment).

## Deploying and running

The smart contracts can be deployed to the environment's local network by executing the following commands:

```bash
$ yarn
$ yarn deploy
```

Alternatively, to deploy to Polygon/Matic's Testnet, execute:

```bash
$ export MNEMONIC=<your_mnemonic>
$ yarn deploy:matic_testnet
```

You can then open a console to interact with the contracts by running:

```bash
$ npx hardhat console --network localhost
```

or

```bash
$ npx hardhat console --network matic_testnet
```

You may also interact with the contracts from the command line by executing a number of pre-configured _Hardhat task scripts_, such as: `start-game`, `join-game`, `submit-turn`, `get-context`, `claim-result`, `confirm-result` and `challenge-game`.

A full list of available Hardhat tasks can be retrieved by typing:

```bash
$ npx hardhat --help
```

Each task's available command line options can also be inspected by typing:

```bash
$ npx hardhat <command> --help
```

Some task command examples:

```bash
$ npx hardhat --network localhost start-game
$ npx hardhat --network localhost submit-turn --index 0 --player alice --data "0x00000000000000030000000000000004"
$ npx hardhat --network localhost get-context --index 0
$ npx hardhat --network localhost join-game --player alice
$ npx hardhat --network localhost join-game --player bob
$ npx hardhat --network localhost claim-result --player alice --index 1 --result [70,130]
$ npx hardhat --network localhost confirm-result --player bob --index 1
```

## Setting up a Verifier Cartesi Machine

At any time, a game can be _challenged_ by any one of the players by calling the `challengeGame` method of the [TurnBasedGame](contracts/TurnBasedGame.sol) contract. That situation can be simulated in the command line by using the `challenge-game` task.

When a game is challenged, a Descartes computation is triggered to determine the final outcome of the game. This computation to run will be determined by the _machine template hash_ that was specified when the game was started. In the command line, this can be configured by defining the `--hash` option when using the `start-game` task.

For the Descartes verification to work, the Cartesi Machine corresponding to the specified hash must be present inside the Descartes Environment's [machines](descartes-env/machines) directory. This machine basically encapsulates the logic of the application and is capable of defining the correct result given the input data provided by Descartes. In the case of the TurnBasedGame contract, this input data will correspond to the game's parameters along with the full log of the data exchanged between the players.

You can experiment with a mock Verifier Cartesi Machine by issuing the following commands:

```bash
$ cd verifier/mock
$ ./build-cartesi-machine.sh ../../descartes-env/machines
```

This will build the mock machine template and place it inside the appropriate `machines` directory within the Descartes Environment.

When Descartes reaches its final state (e.g., "ConsensusResult"), a `DescartesFinished` event is emitted. The computed outcome can then be made effective by calling TurnBasedGame's `applyVerificationResult` method. In the command line, that can be achieved by calling the `apply-result` task.

**NOTE**: the `start-game` and `join-game` tasks currently use the mock verifier machine's template hash as default

## Chess Verifier

A full verifier machine for a game of Chess is available within the [verifier/chess](./verifier/chess) directory. It makes use of the [chess.js](https://www.npmjs.com/package/chess.js) JavaScript library to implement the game's logic.

To run it, first build it by executing:

```bash
$ cd verifier/chess
$ ./build-cartesi-machine.sh ../../descartes-env/machines
```

Then, you can run a full integration test for the game, including a Descartes verification, with the following command:

```bash
$ npx hardhat --network localhost run --no-compile ./test-integration/test-chess.ts
```
