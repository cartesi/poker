const contract = require("@truffle/contract");
const program = require("commander");
const TurnBasedGame = contract(require("./build/contracts/TurnBasedGame.json"));
const Logger = contract(require("./descartes-env/blockchain/node_modules/@cartesi/logger/build/contracts/Logger.json"));

program
    .option('-i, --index <index>', 'Specify the result index to use (default is index 0)', 0)

module.exports = async (callback) => {
    program.parse(process.argv);

    try {
        TurnBasedGame.setNetwork(web3.eth.net.getId());
        TurnBasedGame.setProvider(web3.currentProvider);
        let game = await TurnBasedGame.deployed();

        Logger.setNetwork(web3.eth.net.getId());
        Logger.setProvider(web3.currentProvider);
        let logger = await Logger.deployed();

        let index = program.index;
        console.log("Getting game context using index '" + index + "'\n");

        ret = await game.getContext(index);

        console.log("templateHash: " + ret[0]);
        console.log("players: " + ret[1]);
        console.log("playerFunds: " + ret[2]);
        console.log("metadata: " + ret[3]);
        console.log("descartesIndex: " + ret[5]);

        // displays turn info: data is retrieved from the corresponding logger events ("MerkleRootCalculatedFromData")
        logEvents = await logger.getPastEvents();
        turns = ret[4];
        if (turns && turns.length) {
            for (i = 0; i < turns.length; i++) {
                turn = turns[i];
                data = undefined;
                logEvents = await logger.getPastEvents(
                    "MerkleRootCalculatedFromData",
                    { filter: { _index: [turn.dataLogIndex]}, fromBlock: 0 }
                );
                if (logEvents && logEvents.length) {
                    data = logEvents[0].args._data;
                }
                console.log("- turn " + i);
                console.log("  - player: " + turn.player);
                console.log("  - index: " + turn.dataLogIndex);
                console.log("  - data: " + data);
            }
        }
        console.log("");
        callback();
    } catch (e) {
        callback(e);
    }
};
