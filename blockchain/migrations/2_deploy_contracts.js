const contract = require("@truffle/contract");
const Descartes = contract(
  require("../descartes-env/blockchain/node_modules/@cartesi/descartes-sdk/build/contracts/Descartes.json")
);
const Logger = contract(
  require("../descartes-env/blockchain/node_modules/@cartesi/logger/build/contracts/Logger.json")
);

const TurnBasedGame = artifacts.require("TurnBasedGame");
const TurnBasedGameLobby = artifacts.require("TurnBasedGameLobby");

module.exports = async function (deployer) {
  Descartes.setNetwork(deployer.network_id);
  Logger.setNetwork(deployer.network_id);
  await deployer.deploy(TurnBasedGame, Descartes.address, Logger.address);
  await deployer.deploy(TurnBasedGameLobby, TurnBasedGame.address);
};
