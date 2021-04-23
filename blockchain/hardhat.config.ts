import { HardhatUserConfig, task, types } from "hardhat/config";

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
                artifacts:
                    "node_modules/@cartesi/descartes-sdk/export/artifacts",
                deploy: "node_modules/@cartesi/descartes-sdk/dist/deploy",
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
task("start-game", "Starts a TurnBasedGame instance").setAction(
    async ({}, hre) => {
        const { ethers } = hre;
        const game = await ethers.getContract("TurnBasedGame");

        const { alice, bob } = await hre.getNamedAccounts();

        const gameTemplateHash =
            "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa";
        const gameMetadata = "0x";
        const players = [alice, bob];
        const playerfunds = [100, 100];
        const playerinfos = [
            ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Alice")),
            ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Bob")),
        ];

        const tx = await game.startGame(
            gameTemplateHash,
            gameMetadata,
            players,
            playerfunds,
            playerinfos
        );
        const gameReadyEvent = (await tx.wait()).events[0];
        const index = gameReadyEvent.args._index;
        console.log(
            `Game started with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`
        );
    }
);

// join-game task
task("join-game", "Registers player in the lobby in order to join a game")
    .addOptionalParam(
        "hash",
        "Game template hash to use",
        "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa",
        types.string
    )
    .addOptionalParam("metadata", "Metadata of the game", "0x", types.string)
    .addOptionalParam(
        "numplayers",
        "Number of players in the game",
        2,
        types.int
    )
    .addOptionalParam(
        "minfunds",
        "Minimum amount that needs to be staked in order to join the game",
        10,
        types.int
    )
    .addOptionalParam("player", "Name of the account joining the game", "alice")
    .addOptionalParam(
        "playerfunds",
        "the amount being staked by the player joining the game",
        100,
        types.int
    )
    .addOptionalParam(
        "playerinfo",
        "additional information for the player joining the game",
        "0x",
        types.string
    )
    .setAction(
        async (
            {
                hash,
                metadata,
                numplayers,
                minfunds,
                player,
                playerfunds,
                playerinfo,
            },
            hre
        ) => {
            const { ethers } = hre;

            // retrieves account from configured named accounts, according to player's name
            const playerAccount = (await hre.getNamedAccounts())[player];

            // retrieves game and lobby contracts with signer configured for the specified account
            // - this means that any transaction submitted will be on behalf of that specified account
            const game = await ethers.getContract(
                "TurnBasedGame",
                playerAccount
            );
            const lobby = await ethers.getContract(
                "TurnBasedGameLobby",
                playerAccount
            );

            // submits transaction to the lobby contract to join a game
            let tx = await lobby.joinGame(
                hash,
                metadata,
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
                const gameReadyEvent = game.interface.parseLog(events[0]);
                const index = gameReadyEvent.args._index;
                console.log(
                    `Game started with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`
                );
            } else {
                // no event emitted: show current queue to start a game
                const queue = await lobby.getQueue(
                    hash,
                    metadata,
                    numplayers,
                    minfunds
                );
                console.log("Player enqueued. Current queue is:");
                if (queue && queue.length) {
                    for (let i = 0; i < queue.length; i++) {
                        player = queue[i];
                        console.log(`- player ${i}`);
                        console.log(`  - address: ${player.addr}`);
                        console.log(`  - funds: ${player.funds}`);
                        console.log(
                            `  - info: ${
                                player.info
                            } ('${ethers.utils.toUtf8String(player.info)}')`
                        );
                    }
                }
                console.log("");
            }
        }
    );

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

        console.log("gameTemplateHash: " + ret[0]);
        console.log("gameMetadata: " + ret[1]);
        console.log("players: " + ret[2]);
        console.log("playerfunds: " + ret[3]);
        console.log("playerinfos: " + ret[4]);
        console.log("descartesIndex: " + ret[7]);

        // displays turn info: data is retrieved from the corresponding logger events ("MerkleRootCalculatedFromData")
        const turns = ret[5];
        if (turns && turns.length) {
            for (let i = 0; i < turns.length; i++) {
                const turn = turns[i];
                let data = undefined;
                const filter = logger.filters.MerkleRootCalculatedFromData(
                    turn.dataLogIndex
                );
                const logEvents = await logger.queryFilter(filter);
                if (logEvents && logEvents.length) {
                    data = logEvents[0].args._data;
                }
                console.log("- turn " + i);
                console.log("  - player: " + turn.player);
                console.log("  - index: " + turn.dataLogIndex);
                console.log("  - stateHash: " + turn.stateHash);
                console.log("  - data: " + data);
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

export default config;
