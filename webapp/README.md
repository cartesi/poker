# Poker WebApp

Web application for the [Texas HODL'em Poker project](../README.md), representing the front-end that users will access to play the game.

## Getting Started

To interact with the project's smart contracts, the `Descartes Environment` should be set up as defined in the [general README.md](../README.md#Environment).

## Deploying and running

With the Descartes Environment running, you can build and run the entire application on `localhost` by executing the following commands:

```bash
$ yarn
$ yarn start
```

Or, to use Polygon/Matic's Testnet:
```bash
$ yarn
$ yarn start:matic_testnet
```

The above commands will build the smart contracts from the [blockchain](../blockchain/README.md]) module, and deploy them on the appropriate network. The application will then be accessible on http://localhost:3000.

Alternatively, the game can also be started in _mock_ mode, in which internal Javascript mock classes are used instead of any external service. In this case, there is no need to have a Descartes Environment running. You may start it this way by running:
```bash
$ yarn dev
```
And then accessing the application using `?mock` as a query parameter to instruct the application to use mock services. You would thus access it on http://localhost:3000?mock
