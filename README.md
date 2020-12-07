# Poker

Decentralized Texas Hold'em poker game using Cartesi and Matic.

## Getting Started

The project is divided into three sub-modules:
- [blockhain](blockchain/README.md): holds the smart contracts and blockchain deployment  configurations
- [engine](engine/README.md): holds the poker-specific logic, which will produce both a Javascript API for use in the web application and a Cartesi Machine for validation
- [webapp](webapp/README.md): holds the HTML/JS web application that users will access to play the game 
### Requirements

- docker
- docker-compose
- node 12.x
- yarn
- truffle


### Environment

This project is pre-configured to interact with a local [Ganache](https://github.com/trufflesuite/ganache-cli) instance running at `localhost:8545`. Aside from that, the [TurnBasedGame](blockchain/contracts/TurnBasedGame.sol) contract in this repository requires an environment supporting [Descartes](https://github.com/cartesi/descartes).

The recommended way of running this project it to download the [Descartes SDK development environment](https://cartesi.io/en/docs/tutorials/descartes-env/) provided by Cartesi. This environment includes a local `Ganache` instance as well as local `Descartes` nodes configured for two actors, `alice` and `bob`.

Download and extract the ready-to-use environment artifact within the `blockchain` directory by executing:

```bash
$ cd blockchain
$ wget https://github.com/cartesi/descartes-tutorials/releases/download/v0.2.0/descartes-env-0.2.0.tar.gz
$ tar -xzvf descartes-env-0.2.0.tar.gz
```

After that, you may start the environment by typing:
```bash
$ cd descartes-env
$ docker-compose up
```

To shutdown the environment, remember to remove volumes when stopping the containers:
```bash
$ docker-compose down -v
```


## Deploying and running

We use `Yarn` to download dependencies and run the application. `Yarn workspaces` is used to manage the three sub-modules from the root level of the project. Internally, `Truffle` is being used to compile and deploy the contracts to the configured network.

With the [Descartes environment](#Environment) in place, build and run the application by executing the following commands from the project root directory:

```bash
$ yarn
$ yarn start
```

The application will then be available on http://localhost:3000