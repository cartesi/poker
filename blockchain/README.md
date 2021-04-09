# Poker Blockchain

Smart contracts for the Poker game

## Getting Started

The `Descartes Environment` should be set up as defined in the [general README.md](../README.md#Environment):


## Deploying and running

The smart contracts can be deployed to the environment's local network by executing the following commands:

```bash
$ yarn
$ yarn deploy
```

You can then interact with the application by running `npx hardhat console --network localhost`, or by executing the configured Hardhat scripts `start-game`, `join-game`, `submit-turn` and `get-context`.

For instance:

```bash
$ npx hardhat --network localhost start-game
$ npx hardhat --network localhost submit-turn --index 0 --player alice --data '["0x0000000000000003","0x0000000000000004"]'
$ npx hardhat --network localhost get-context --index 0
$ npx hardhat --network localhost join-game --player alice
$ npx hardhat --network localhost join-game --player bob
```

Each task can be executed with the option `--help` to see the available options.
