# Poker Contracts

Smart contracts for the Poker game


## Getting Started

### Requirements

- docker
- docker-compose
- node 12.x
- yarn
- truffle


### Environment

This project is pre-configured to interact with a local [Ganache](https://github.com/trufflesuite/ganache-cli) instance running at `localhost:8545`. Aside from that, the [TurnBasedGame](contracts/TurnBasedGame.sol) contract in this repository requires an environment supporting [Descartes](https://github.com/cartesi/descartes).

The recommended way of running this project it to download the [Descartes SDK development environment](https://cartesi.io/en/docs/tutorials/descartes-env/) provided by Cartesi. This environment includes a local `Ganache` instance as well as local `Descartes` nodes configured for two actors, `alice` and `bob`.

At the root of this project, download and extract the ready-to-use environment artifact by executing:

```bash
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


### Installing, compiling and deploying

We use `Yarn` to download dependncies, and then `Truffle` to compile and deploy the contracts to the configured network:

```bash
$ yarn
$ truffle migrate
```
