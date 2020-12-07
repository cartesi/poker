const contract = require("@truffle/contract");
const TurnBasedGame = contract(require("./build/contracts/TurnBasedGame.json"));

module.exports = async (callback) => {
    try {
        TurnBasedGame.setNetwork(web3.eth.net.getId());
        TurnBasedGame.setProvider(web3.currentProvider);
        let game = await TurnBasedGame.deployed();

        let accounts = await web3.eth.getAccounts();
        let templateHash = "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa";
        let players = accounts;
        let playerFunds = [10, 10];
        let metadata = "0x0";
        let gameReadyABI = game.abi.filter(o => o.name == 'GameReady')[0];

        ret = await game.startGame(templateHash, players, playerFunds, metadata, { from: accounts[0] });
        index = web3.eth.abi.decodeLog(gameReadyABI.inputs, ret.receipt.rawLogs[0].data, '0x0')['0'];
        console.log("Game started with index '" + index + "' (tx: " + ret.tx + " ; blocknumber: " + ret.receipt.blockNumber + ")\n");
        callback();
    } catch (e) {
        callback(e);
    }
};
