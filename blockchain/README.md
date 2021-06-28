# Poker Blockchain

Smart contracts for the Poker game

## Getting Started

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
npx hardhat console --network localhost
```
or
```bash
npx hardhat console --network matic_testnet
```

You may also interact with the contracts from the command line by executing a number of pre-configured _Hardhat task scripts_, such as: `start-game`, `join-game`, `submit-turn`, `get-context`, `claim-result`, `confirm-result` and `challenge-game`.

A full list of available Hardhat tasks can be retrieved by typing:
```bash
npx hardhat --help
```

Each task's available command line options can also be inspected by typing:
```bash
npx hardhat <command> --help
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
