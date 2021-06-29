# Texas HODL'em Poker

Decentralized Texas Hold'em poker game using Cartesi.

## Getting started

This project is divided into four sub-modules:
- [blockhain](blockchain/README.md): holds the smart contracts and blockchain deployment  configurations
- [engine](engine/README.md): holds the poker-specific logic, which will produce both a Javascript API for use in the web application and a Cartesi Machine for validation
- [webapp](webapp/README.md): holds the HTML/JS web application that users will access to play the game
- [webfaucet](webfaucet/README.md): holds a small auxiliary HTML/JS web application for users to request tokens to play the game 

### Requirements

- docker
- docker-compose
- node 12.x
- yarn
- Hardhat


### Environment

This project is pre-configured to interact either with a local `Hardhat` node instance running at `localhost:8545`, or with [Polygon/Matic](https://polygon.technology/)'s Mumbai PoS Testnet. Aside from that, the [TurnBasedGame](blockchain/contracts/TurnBasedGame.sol) contract requires an environment supporting [Descartes](https://github.com/cartesi/descartes) in order to perform verification computations if a game is challenged.

The recommended way of running this project is to first run the [Descartes SDK development environment](blockchain/descartes-env/) contained within the `blockchain` module. This environment includes a local `Hardhat` node as well as local `Descartes` nodes configured for two actors, `alice` and `bob`.

You may start the environment using a local `Hardhat` node by typing:
```bash
$ cd blockchain/descartes-env
$ docker-compose up
```

Alternatively, you may start it pointing to Polygon/Matic's Testnet by executing:
```bash
$ export MNEMONIC=<your_mnemonic>
$ docker-compose -f docker-compose.matic_testnet.yml up
```

To shutdown the environment, remember to remove volumes when stopping the containers:
```bash
$ docker-compose down -v
```


## Deploying and running

We use `Yarn` to download dependencies and run the application. `Yarn workspaces` is used to manage the sub-modules from the root level of the project (except for the `engines` module). Internally, `Hardhat` is being used to compile and deploy the contracts to the configured network.

With the [Descartes environment](#Environment) running, you can build and run the entire application on `localhost` by executing the following commands from the project root directory:

```bash
$ yarn
$ yarn start
```

Or, to use Polygon/Matic's Testnet:
```bash
$ yarn
$ yarn start:matic_testnet
```

The application will then be available on http://localhost:3000

**NOTE**: this process currently does not include the real WASM Poker Engine in the final web application, which runs with a mock engine instead
