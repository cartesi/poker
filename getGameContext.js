const contract = require("@truffle/contract");
const program = require("commander");
const TurnBasedGame = contract(require("./build/contracts/TurnBasedGame.json"));

program
    .option('-i, --index <index>', 'Specify the result index to use (default is index 0)')

module.exports = async (callback) => {
    program.parse(process.argv);

    try {
        TurnBasedGame.setNetwork(web3.eth.net.getId());
        TurnBasedGame.setProvider(web3.currentProvider);
        let game = await TurnBasedGame.deployed();

        let index = 0;
        if (program.index) {
            index = program.index;
        }
        console.log("Getting game context using index '" + index + "'\n");

        ret = await game.getContext(index);
        console.log("GameContext: " + JSON.stringify(ret));
        console.log("");
        callback();
    } catch (e) {
        callback(e);
    }
};
