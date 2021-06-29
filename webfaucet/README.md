# Poker WebFaucet

Auxiliary web application to provide a faucet for POKER tokens used in the [Texas HODL'em Poker project](../README.md).

## Getting started

To interact with the project's smart contracts, the `Descartes Environment` should be set up as defined in the [general README.md](../README.md#Environment).

## Deploying and running

With the Descartes Environment running, you can build and run the application on `localhost` by executing the following commands:

```bash
$ yarn
$ yarn start
```

Or, to use Polygon/Matic's Testnet:
```bash
$ yarn
$ yarn start:matic_testnet
```

The above commands will build the smart contracts from the [blockchain](../blockchain/README.md]) module, and deploy them on the appropriate network. The application will then be accessible on http://localhost:3100.

## Using the faucet

A newly deployed faucet will be initially empty. In order to use it, you will first need to mint POKER tokens to the address of the deployed `PokerTokenFaucet` contract. This procedure can be done within the [blockchain](../blockchain/README.md]) module using the `mint-token` task.

For instance:
```bash
$ cd ../blockchain
$ npx hardhat --network localhost mint-token --address <address> --amount 100000
```

