const contract = require("@truffle/contract");
const TurnBasedGame = contract(require("./build/contracts/TurnBasedGame.json"));
const program = require("commander");

program
    .option('-i, --index <index>', 'Specify the index to use (optional, default is index 0)', 0)
    .option('-p, --player <player>', 'Specify the index of the account submitting the turn (optional, default is to use accounts[0])', 0)
    .option('-d, --data <bytes8...>', 'Specify the data to submit, which must be an array of 64-bit words (optional, default is "0x1,0x2")', s => s.split(","), ['0x1','0x2'])

module.exports = async (callback) => {
    program.parse(process.argv);

    try {
        TurnBasedGame.setNetwork(web3.eth.net.getId());
        TurnBasedGame.setProvider(web3.currentProvider);
        let game = await TurnBasedGame.deployed();
        
        let accounts = await web3.eth.getAccounts();
        let index = program.index;
        let data = program.data;
        let playerIndex = program.player;
        let player = accounts[playerIndex];
        let stateHash = '0x0';

        console.log("Submitting turn for index '" + index + "' and player '" + playerIndex + "' (" + player + "), with data " + JSON.stringify(data) + "\n");

        await game.submitTurn(index, stateHash, data, { from: player });

        let context = await game.getContext(index);
        console.log("Context: " + JSON.stringify(context));

        console.log("");
        callback();

    } catch (e) {
        callback(e);
    }
};
