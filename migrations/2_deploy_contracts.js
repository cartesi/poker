const contract = require("@truffle/contract");
const Descartes = contract(require("../descartes-env/blockchain/node_modules/@cartesi/descartes-sdk/build/contracts/Descartes.json"));
const Logger = contract(require("../descartes-env/blockchain/node_modules/@cartesi/logger/build/contracts/Logger.json"));


const Zoom = artifacts.require("Zoom");

const TurnBasedGame = artifacts.require("Zoom");

module.exports = function(deployer) {
  // Descartes.setNetwork(deployer.network_id);
  // Logger.setNetwork(deployer.network_id);
  deployer.deploy(Zoom);
};

// const Zoom = artifacts.require("Zoom");

// module.exports = function(deployer) {
//   deployer.deploy(Zoom);
// };
