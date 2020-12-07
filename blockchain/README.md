# Poker Blockchain

Smart contracts for the Poker game

## Getting Started

The `Descartes Environment` should be set up as defined in the [general README.md](../README.md#Environment):


## Deploying and running

The smart contracts can be deployed to the environment's configured network by executing the following commands:

```bash
$ yarn
$ truffle migrate
```

You can then interact with the application by using `truffle console`, or by executing Truffle scripts. For instance:

```bash
$ truffle exec startGame.js
$ truffle exec submitTurn.js -i 0 -p 0 -d "0x1,0x2"
$ truffle exec getGameContext.js -i 0
```
