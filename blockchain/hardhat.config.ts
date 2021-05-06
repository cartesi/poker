import { HardhatUserConfig, task, types } from "hardhat/config";

import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

const config: HardhatUserConfig = {
    networks: {
        localhost: {
            url: "http://localhost:8545",
        },
    },
    solidity: {
        version: "0.7.4",
    },
    external: {
        contracts: [
            {
                artifacts: "../node_modules/@cartesi/descartes-sdk/export/artifacts",
                deploy: "../node_modules/@cartesi/descartes-sdk/dist/deploy",
            },
        ],
        deployments: {
            localhost: ["./descartes-env/deployments/localhost"],
        },
    },
    typechain: {
        outDir: "src/types",
        target: "ethers-v5",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        alice: {
            default: 0,
        },
        bob: {
            default: 1,
        },
    },
};

// TASKS

// start-game task
task("start-game", "Starts a TurnBasedGame instance").setAction(async ({}, hre) => {
    const { ethers } = hre;
    const game = await ethers.getContract("TurnBasedGame");
    const contextLibrary = await ethers.getContract("TurnBasedGameContext");

    const { alice, bob } = await hre.getNamedAccounts();

    const gameTemplateHash = "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa";
    const gameMetadata = "0x";
    const players = [alice, bob];
    const validators = players;
    const playerfunds = [100, 100];
    const playerinfos = [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Alice")),
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Bob")),
    ];

    const tx = await game.startGame(gameTemplateHash, gameMetadata, validators, players, playerfunds, playerinfos);
    const gameReadyEventRaw = (await tx.wait()).events[0];
    const gameReadyEvent = contextLibrary.interface.parseLog(gameReadyEventRaw);
    const index = gameReadyEvent.args._index;
    console.log("");
    console.log(`Game started with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`);
});

// join-game task
task("join-game", "Registers player in the lobby in order to join a game")
    .addOptionalParam(
        "hash",
        "Game template hash to use",
        "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa",
        types.string
    )
    .addOptionalParam("metadata", "Metadata of the game", "0x", types.string)
    .addOptionalParam("validators", "Accounts names for game validator nodes", ["alice", "bob"], types.json)
    .addOptionalParam("numplayers", "Number of players in the game", 2, types.int)
    .addOptionalParam("minfunds", "Minimum amount that needs to be staked in order to join the game", 10, types.int)
    .addOptionalParam("player", "Name of the account joining the game", "alice")
    .addOptionalParam("playerfunds", "The amount being staked by the player joining the game", 100, types.int)
    .addOptionalParam("playerinfo", "Additional information for the player joining the game", "0x", types.string)
    .setAction(async ({ hash, metadata, validators, numplayers, minfunds, player, playerfunds, playerinfo }, hre) => {
        const { ethers } = hre;
        const accounts = await hre.getNamedAccounts();

        // retrieves validators according to their account names
        const validatorAddresses = validators.map((name) => accounts[name]);

        // retrieves account from configured named accounts, according to player's name
        const playerAccount = accounts[player];

        // retrieves lobby contract with signer configured for the specified account
        // - this means that any transaction submitted will be on behalf of that specified account
        const lobby = await ethers.getContract("TurnBasedGameLobby", playerAccount);
        const contextLib = await ethers.getContract("TurnBasedGameContext");

        // submits transaction to the lobby contract to join a game
        let tx = await lobby.joinGame(
            hash,
            metadata,
            validatorAddresses,
            numplayers,
            minfunds,
            playerfunds,
            playerinfo
        );

        // retrieves transaction's emitted events to report outcome
        const events = (await tx.wait()).events;

        if (events && events.length) {
            // a GameReady event is emitted by TurnBasedGame if a game starts
            // - parse event using TurnBasedGame's contract interface
            const gameReadyEvent = contextLib.interface.parseLog(events[0]);
            const index = gameReadyEvent.args._index;
            console.log(`\nGame started with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`);
        } else {
            // no event emitted: show current queue to start a game
            const queue = await lobby.getQueue(hash, metadata, validatorAddresses, numplayers, minfunds);
            console.log(`\nPlayer '${player}' enqueued. Current queue is:`);
            if (queue && queue.length) {
                for (let i = 0; i < queue.length; i++) {
                    player = queue[i];
                    console.log(`- player ${i}`);
                    console.log(`  - address: ${player.addr}`);
                    console.log(`  - funds: ${player.funds}`);
                    console.log(`  - info: ${player.info} ('${ethers.utils.toUtf8String(player.info)}')`);
                }
            }
            console.log("");
        }
    });

// get-context task
task("get-context", "Retrieves a TurnBasedGame context given its index")
    .addOptionalParam("index", "The game index", 0, types.int)
    .setAction(async ({ index }, hre) => {
        const { ethers } = hre;

        // retrieves game and logger contracts
        const game = await ethers.getContract("TurnBasedGame");
        const logger = await ethers.getContract("Logger");

        console.log("");
        console.log(`Getting game context using index '${index}'\n`);

        // queries game contract to retrieve context for the specified game index
        const ret = await game.getContext(index);

        console.log(`gameTemplateHash: ${ret[0]}`);
        console.log(`gameMetadata: ${ret[1]}`);
        console.log(`validators: ${ret[2]}`);
        console.log(`players: ${ret[3]}`);
        console.log(`playerfunds: ${ret[4]}`);
        console.log(`playerinfos: ${ret[5]}`);
        console.log(`isDescartesInstantiated: ${ret[7]}`);
        console.log(`descartesIndex: ${ret[8]}`);
        console.log(`claimer: ${ret[9]}`);
        console.log(`claimerFundsShare: ${ret[10]}`);
        console.log(`claimerAgreementMask: ${ret[11]}`);

        // displays turn info: data is retrieved from the corresponding logger events ("MerkleRootCalculatedFromData")
        const turns = ret[6];
        if (turns && turns.length) {
            for (let i = 0; i < turns.length; i++) {
                const turn = turns[i];
                let data = undefined;
                const filter = logger.filters.MerkleRootCalculatedFromData(turn.dataLogIndex);
                const logEvents = await logger.queryFilter(filter);
                if (logEvents && logEvents.length) {
                    data = logEvents[0].args._data;
                }
                console.log(`- turn ${i}`);
                console.log(`  - player: ${turn.player}`);
                console.log(`  - index: ${turn.dataLogIndex}`);
                console.log(`  - stateHash: ${turn.stateHash}`);
                console.log(`  - data: ${data}`);
            }
        }
        console.log("");
    });

// submit-turn task
task("submit-turn", "Submits a game turn for a given player")
    .addOptionalParam("index", "The game index", 0, types.int)
    .addOptionalParam(
        "player",
        "Name of the account submitting the turn, such as 'alice' or 'bob'",
        "alice",
        types.string
    )
    .addOptionalParam(
        "statehash",
        "32-bit hash of the game state for which the turn applies",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        types.string
    )
    .addOptionalParam(
        "data",
        "Turn data to submit, which must be an array of 64-bit words",
        ["0x0000000000000001", "0x0000000000000002"],
        types.json
    )
    .setAction(async ({ index, player, statehash, data }, hre) => {
        const { ethers } = hre;
        // retrieves account from configured named accounts, according to player's name
        const playerAccount = (await hre.getNamedAccounts())[player];
        // retrieves game contracts with signer configured for the specified account
        // - this means that any transaction submitted will be on behalf of that specified account
        const game = await ethers.getContract("TurnBasedGame", playerAccount);

        console.log("");
        console.log(
            `Submitting turn for index '${index}' and player '${player}' (${playerAccount}), with data '${JSON.stringify(
                data
            )}'\n`
        );

        // submits turn for the specified player
        await game.submitTurn(index, statehash, data);

        let context = await game.getContext(index);
        console.log(`Context: ${JSON.stringify(context)}\n`);
    });

// challenge-game task
task("challenge-game", "Challenges a game given its index")
    .addOptionalParam("index", "The game index", 0, types.int)
    .addOptionalParam("player", "Name of the account challenging the game", "alice")
    .setAction(async ({ index, player }, hre) => {
        const { ethers } = hre;

        // retrieves account from configured named accounts, according to player's name
        const accounts = await hre.getNamedAccounts();
        const playerAccount = accounts[player];

        // retrieves game and context contracts
        const game = await ethers.getContract("TurnBasedGame", playerAccount);
        const contextLibrary = await ethers.getContract("TurnBasedGameContext");

        console.log("");
        console.log(`Challenging game with index '${index}'\n`);

        const tx = await game.challengeGame(index);

        // looks for GameChallengedEvent (only event that can be emitted by TurnBasedGame)
        const events = (await tx.wait()).events;
        for (let event of events) {
            if (event.address == game.address) {
                const gameChallengedEvent = contextLibrary.interface.parseLog(event);
                const descartesIndex = gameChallengedEvent.args._descartesIndex;
                console.log(
                    `Game '${index}' challenged by '${player}', producing Descartes computation index '${descartesIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`
                );
                break;
            }
        }
    });

// claim-result task
task("claim-result", "Claims a game has ended with a specified result")
    .addOptionalParam("index", "The game index", 0, types.int)
    .addOptionalParam("result", "Result as a distribution of the funds previously staked", [120, 80], types.json)
    .addOptionalParam("player", "Name of the account claiming the result", "alice")
    .setAction(async ({ index, result, player }, hre) => {
        const { ethers } = hre;

        // retrieves account from configured named accounts, according to player's name
        const accounts = await hre.getNamedAccounts();
        const playerAccount = accounts[player];

        const game = await ethers.getContract("TurnBasedGame", playerAccount);
        const tx = await game.claimResult(index, result);

        console.log("");
        console.log(
            `Result '${JSON.stringify(result)}' claimed by '${player}' for game with index '${index}' (tx: ${
                tx.hash
            } ; blocknumber: ${tx.blockNumber})\n`
        );
    });

// confirm-result task
task("confirm-result", "Confirms a game result that was previously claimed")
    .addOptionalParam("index", "The game index", 0, types.int)
    .addOptionalParam("player", "Name of the account confirming the result", "bob")
    .setAction(async ({ index, player }, hre) => {
        const { ethers } = hre;

        // retrieves account from configured named accounts, according to player's name
        const accounts = await hre.getNamedAccounts();
        const playerAccount = accounts[player];

        // retrieves game and context contracts
        const game = await ethers.getContract("TurnBasedGame", playerAccount);
        const contextLibrary = await ethers.getContract("TurnBasedGameContext");

        console.log("");
        console.log(`Confirming result on behalf of '${player}' for game with index '${index}'\n`);

        const tx = await game.confirmResult(index);

        // looks for GameOverEvent (only event that can be emitted by TurnBasedGame)
        const events = (await tx.wait()).events;
        for (let event of events) {
            if (event.address == game.address) {
                const gameOverEvent = contextLibrary.interface.parseLog(event);
                const result = gameOverEvent.args._fundsShare;
                const resultPrintable = result.map((v) => v.toNumber());
                console.log(
                    `Game '${index}' ended with result '${JSON.stringify(resultPrintable)}' (tx: ${
                        tx.hash
                    } ; blocknumber: ${tx.blockNumber})\n`
                );
                break;
            }
        }
    });

// apply-result task
task("apply-result", "Applies the result of a game verified by Descartes")
    .addOptionalParam("index", "The game index", 0, types.int)
    .setAction(async ({ index, player }, hre) => {
        const { ethers } = hre;

        // retrieves game and context contracts
        const game = await ethers.getContract("TurnBasedGame");
        const contextLibrary = await ethers.getContract("TurnBasedGameContext");

        console.log("");
        console.log(`Applying verification result computed by Descartes for game with index '${index}'\n`);

        const tx = await game.applyVerificationResult(index);

        // looks for GameOverEvent (only event that can be emitted by TurnBasedGame)
        const events = (await tx.wait()).events;
        for (let event of events) {
            if (event.address == game.address) {
                const gameOverEvent = contextLibrary.interface.parseLog(event);
                const result = gameOverEvent.args._fundsShare;
                const resultPrintable = result.map((v) => v.toNumber());
                console.log(
                    `Game '${index}' ended with result '${JSON.stringify(resultPrintable)}' (tx: ${
                        tx.hash
                    } ; blocknumber: ${tx.blockNumber})\n`
                );
                break;
            }
        }
    });

export default config;
