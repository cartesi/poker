const contract = require("@truffle/contract");
const TurnBasedGame = contract(require("./build/contracts/TurnBasedGame.json"));
const TurnBasedGameLobby = contract(require("./build/contracts/TurnBasedGameLobby.json"));
const program = require("commander");

program
    .option('-h, --hash <hash>', 'Specify the game template hash to use (optional, default is "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa")', "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa")
    .option('-m, --metadata <bytes>', 'Specify the metadata of the game (optional, default is "0x0")', "0x0")
    .option('-n, --numPlayers <n>', 'Specify the number of players in the game (optional, default is 2)', 2)
    .option('-p, --player <player>', 'Specify the index of the account joining the game (optional, default is 0)', 0)
    .option('-f, --playerFunds <amount>', 'Specify the amount being staked by the player joining the game (optional, default is 10)', 10)
    .option('-i, --playerInfo <info>', 'Specify additional information for the player joining the game (optional, default is "0x0")', "0x0")

module.exports = async (callback) => {
    program.parse(process.argv);

    try {
        TurnBasedGame.setNetwork(web3.eth.net.getId());
        TurnBasedGame.setProvider(web3.currentProvider);
        TurnBasedGameLobby.setNetwork(web3.eth.net.getId());
        TurnBasedGameLobby.setProvider(web3.currentProvider);
        let lobby = await TurnBasedGameLobby.deployed();
        let game = await TurnBasedGame.deployed();

        let accounts = await web3.eth.getAccounts();
        let gameTemplateHash = program.hash;
        let gameMetadata = program.metadata;
        let numPlayers = program.numPlayers;
        let playerIndex = program.player;
        let playerFunds = program.playerFunds;
        let playerInfo = program.playerInfo;

        let gameReadyABI = game.abi.filter(o => o.name == 'GameReady')[0];

        ret = await lobby.joinGame(gameTemplateHash, gameMetadata, numPlayers, playerFunds, playerInfo, { from: accounts[playerIndex] });

        if (ret.receipt.rawLogs.length) {
            // an event log happens if a game starts
            index = web3.eth.abi.decodeLog(gameReadyABI.inputs, ret.receipt.rawLogs[0].data, '0x0')['0'];
            console.log("Game started with index '" + index + "' (tx: " + ret.tx + " ; blocknumber: " + ret.receipt.blockNumber + ")\n");
        } else {
            // show current queue
            queue = await lobby.getQueue(gameTemplateHash, gameMetadata, numPlayers, { from: accounts[playerIndex] });
            console.log("Player enqueued. Current queue is:");
            if (queue && queue.length) {
                for (i = 0; i < queue.length; i++) {
                    player = queue[i];
                    console.log("- player " + i);
                    console.log("  - address: " + player.addr);
                    console.log("  - funds: " + player.funds);
                    console.log("  - info: " + player.info + " (\"" + web3.utils.hexToAscii(player.info) + "\")");
                }
            }
            console.log("");
        }
        callback();
    } catch (e) {
        callback(e);
    }
};
