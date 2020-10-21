const contract = require("@truffle/contract");
const Descartes = contract(require("../descartes-env/blockchain/node_modules/@cartesi/descartes-sdk/build/contracts/Descartes.json"));
const Logger = contract(require("../descartes-env/blockchain/node_modules/@cartesi/logger/build/contracts/Logger.json"));

const TurnBasedGame = artifacts.require("TurnBasedGame");

module.exports = function(deployer) {
  Descartes.setNetwork(deployer.network_id);
  Logger.setNetwork(deployer.network_id);
  deployer.deploy(TurnBasedGame, Descartes.address, Logger.address);
};
