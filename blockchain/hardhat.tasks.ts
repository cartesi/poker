import { task, types } from "hardhat/config";
import * as fs from "fs";

import { getEvent } from "./test/EventUtil";

const defaultGameTemplateHash = "0xe0a48889a480a63147341e87411fb7c8981c759eb245fd53afb317b527915c93";

// MINT-TOKEN
task("mint-token", "Mint token for a given address")
    .addParam("address", "Address for which account you want to mint tokens")
    .addParam("amount", "Amount of tokens to be minted")
    .addOptionalParam("erc20", "Name of the Token contract been used", "PokerToken")
    .setAction(async ({ address, amount, erc20 }, hre) => {
        const { ethers } = hre;

        // retrieves PokerToken contract
        const tokenProvider = await ethers.getContract(erc20);
        // mint tokens
        await tokenProvider.mint(address, amount);
        console.log("\n" + amount + " " + (await tokenProvider.symbol()) + " tokens minted for " + address);
        console.log("\nCurrent balance is " + (await tokenProvider.balanceOf(address)));

        console.log("");
    });

// APPROVE-SPENDING
// Note for when spenderaddress is contract: We should call the contract that will transferFrom 
// the holder account from the holder account.
// holder account calls -> spender contract -> spender contract transfer from holder account to any target account
task("approve-spending", "Approve an account to spend tokens on behalf of other")
    .addParam("holder", "Address for the holder account")
    .addParam("spender", "Address for the spender account")
    .addParam("amount", "Amount allowed", 100, types.int)
    .addOptionalParam("erc20", "Name of the Token contract been used", "PokerToken")
    .setAction(async ({ holder, spender, amount, erc20 }, hre) => {
        const { ethers } = hre;

        // retrieves PokerToken contract
        let tokenProvider = await ethers.getContract(erc20);
        await tokenProvider.mint(holder, amount);
        // approve tokens spending
        await tokenProvider.connect(holder);
        await tokenProvider.approve(spender, amount);

        let tokenSymbol = await tokenProvider.symbol();
        let allowance = await tokenProvider.allowance(holder, spender);
        console.log("\n" + spender + " can spend " + amount + " of " + tokenSymbol + " tokens on behalf of " + holder);
        console.log("\nCurrent allowance is " + allowance);

        console.log("");
    });



// SHOW-BALANCES
task("show-balance", "Show token balance for a given address")
    .addParam("address", "Address for which account you want to know the balance")
    .addOptionalParam("erc20Name", "Name of the Token contract been used", "PokerToken")
    .setAction(async ({ address, erc20Name }, hre) => {
        const { ethers } = hre;

        // retrieves PokerToken contract
        const tokenProvider = await ethers.getContract(erc20Name);

        // log balance
        let balance = await tokenProvider.balanceOf(address);
        console.log("\nAddress has " + balance + " tokens.");

        console.log("");
    });

// START-GAME
task("start-game", "Starts a TurnBasedGame instance")
    .addOptionalParam("hash", "Game template hash to use", defaultGameTemplateHash, types.string)
    .setAction(async ({ hash }, hre) => {
        const { ethers } = hre;

        const { alice, bob } = await hre.getNamedAccounts();

        // retrieve contracts
        const pokerToken = await ethers.getContract("PokerToken");
        const game = await ethers.getContract("TurnBasedGame");
        const contextLibrary = await ethers.getContract("TurnBasedGameContext");

        const gameTemplateHash = hash;
        const gameMetadata = "0x";
        const players = [alice, bob];
        const validators = players;
        const playerfunds = [100, 100];
        const playerinfos = [
            ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Alice")),
            ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Bob")),
        ];

        await pokerToken.mint(alice, 200);
        await pokerToken.approve(game.address, 200);
        const tx = await game.startGame(gameTemplateHash, gameMetadata, validators, pokerToken.address, players, playerfunds, playerinfos);

        const events = (await tx.wait()).events;
        const gameReadyEvent = getEvent("GameReady", contextLibrary, events);
        const index = gameReadyEvent.args._index;

        console.log("");
        console.log(`Game started with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`);

        return index;
    });

// JOIN-GAME
task("join-game", "Registers player in the lobby in order to join a game")
    .addOptionalParam("hash", "Game template hash to use", defaultGameTemplateHash, types.string)
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


        // deploy PokerToken contract
        const pokerToken = await ethers.getContract("PokerToken");
        // mint tokens for player
        await pokerToken.mint(playerAccount, playerfunds);
        // approve lobby to spent tokens on behalf of the player
        const playerPokerToken = await ethers.getContract("PokerToken", playerAccount);
        await playerPokerToken.approve(lobby.address, playerfunds);


        // retrieve game contract just to check GameReady event
        const game = await ethers.getContract("TurnBasedGame");


        // submits transaction to the lobby contract to join a game
        let tx = await lobby.joinGame(
            hash,
            metadata,
            validatorAddresses,
            numplayers,
            minfunds,
            pokerToken.address,
            playerfunds,
            playerinfo
        );

        // retrieves transaction's emitted events to report outcome
        const events = (await tx.wait()).events;

        for (let event of events) {
            if (event.address == game.address) {
                // a GameReady event is emitted by TurnBasedGame if a game starts
                // - parse event using contextLib because It's there where the event is emitted
                const gameReadyEvent = contextLib.interface.parseLog(event);
                const index = gameReadyEvent.args._index;
                console.log(`\nGame started with index '${index}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})\n`);
                return;
            }
            // Other events (transferring tokens from player to lobby contract) will be ignored in this task
        }

        // print queue situation if game is not ready yet
        const queue = await lobby.getQueue(hash, metadata, validatorAddresses, numplayers, minfunds, pokerToken.address);
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
    });

// GET-CONTEXT
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
        console.log(`erc20Address: ${ret[3]}`);
        console.log(`players: ${ret[4]}`);
        console.log(`playerfunds: ${ret[5]}`);
        console.log(`playerinfos: ${ret[6]}`);
        console.log(`isDescartesInstantiated: ${ret[8]}`);
        console.log(`descartesIndex: ${ret[9]}`);
        console.log(`claimer: ${ret[10]}`);
        console.log(`claimedFundsShare: ${ret[11]}`);
        console.log(`claimAgreementMask: ${ret[12]}`);

        // displays turn info: data is retrieved from the corresponding logger events ("MerkleRootCalculatedFromData")
        const turns = ret[7];
        if (turns && turns.length) {
            for (let iTurn = 0; iTurn < turns.length; iTurn++) {
                const turn = turns[iTurn];
                console.log(`- turn ${iTurn}`);
                console.log(`  - player: ${turn.player}`);
                console.log(`  - nextPlayer: ${turn.nextPlayer}`);
                console.log(`  - playerStake: ${turn.playerStake}`);
                console.log(`  - timestamp: ${new Date(turn.timestamp * 1000).toISOString()}`);
                for (let iChunk = 0; iChunk < turn.dataLogIndices.length; iChunk++) {
                    let index = turn.dataLogIndices[iChunk];
                    let data = undefined;
                    while (true) {
                        try {
                            const filter = logger.filters.MerkleRootCalculatedFromData(index);
                            const logEvents = await logger.queryFilter(filter);
                            if (logEvents && logEvents.length) {
                                data = logEvents[0].args._data;
                            }
                            console.log(`  - index[${iChunk}]: ${index}`);
                            console.log(`  - data[${iChunk}]: ${data}`);
                            break;
                        } catch (error) {
                            console.error(`Error - will try again. ${error}`);
                        }
                    }
                }
            }
        }
        console.log("");
    });

// SUBMIT-TURN
task("submit-turn", "Submits a game turn for a given player")
    .addOptionalParam("index", "The game index", 0, types.int)
    .addOptionalParam(
        "player",
        "Name of the account submitting the turn, such as 'alice' or 'bob'",
        "alice",
        types.string
    )
    .addOptionalParam(
        "nextplayer",
        "Name of the account responsible for submitting the next turn, such as 'alice' or 'bob'",
        undefined,
        types.string
    )
    .addOptionalParam(
        "playerstake",
        "Player funds at stake after the turn",
        0,
        types.int
    )
    .addOptionalParam(
        "data",
        "Turn data to submit, which must be an array of 64-bit words",
        "0x00000000000000010000000000000002",
        types.string
    )
    .addOptionalParam(
        "datastr",
        "Turn data to submit as an UTF-8 string",
        undefined,
        types.string
    )
    .addOptionalParam(
        "datafile",
        "File containing turn data to submit, whose content must be a JSON array of 64-bit words",
        undefined,
        types.string
    )
    .setAction(async ({ index, player, nextplayer, playerstake, data, datastr, datafile }, hre) => {
        const { ethers } = hre;

        // retrieves accounts from configured named accounts, according to players' names
        const playerAccount = (await hre.getNamedAccounts())[player];
        const nextPlayerAccount = (nextplayer ? (await hre.getNamedAccounts())[nextplayer] : ethers.constants.AddressZero);

        // retrieves game contracts with signer configured for the specified account
        // - this means that any transaction submitted will be on behalf of that specified account
        const game = await ethers.getContract("TurnBasedGame", playerAccount);

        // queries game contract to retrieve context for the specified game index
        let context = await game.getContext(index);
        const turnIndex = context.turns.length;

        console.log("");
        if (datafile) {
            console.log(
                `Submitting turn '${turnIndex}' for index '${index}' and player '${player}' (${playerAccount}), with data from file '${datafile}'\n`
            );
            data = fs.readFileSync(datafile).toString();
        } else if (datastr) {
            console.log(
                `Submitting turn '${turnIndex}' for index '${index}' and player '${player}' (${playerAccount}), with data converted from string '${datastr}'\n`
            );
            data = ethers.utils.toUtf8Bytes(datastr);
        } else {
            console.log(
                `Submitting turn '${turnIndex}' for index '${index}' and player '${player}' (${playerAccount}), with data '${JSON.stringify(
                    data
                )}'\n`
            );
        }
        console.log(`Player stake: ${playerstake}; next player: '${nextplayer}' (${nextPlayerAccount})\n`);

        // submits turn for the specified player
        await game.submitTurn(index, turnIndex, nextPlayerAccount, playerstake, data);

        context = await game.getContext(index);
        console.log(`Context: ${JSON.stringify(context)}\n`);
    });

// CHALLENGE-GAME
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

// CLAIM-RESULT
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
            `Result '${JSON.stringify(result)}' claimed by '${player}' for game with index '${index}' (tx: ${tx.hash
            } ; blocknumber: ${tx.blockNumber})\n`
        );
    });

// CONFIRM-RESULT
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
                    `Game '${index}' ended with result '${JSON.stringify(resultPrintable)}' (tx: ${tx.hash
                    } ; blocknumber: ${tx.blockNumber})\n`
                );
                break;
            }
        }
    });

// WAIT-VERIFICATION
task("wait-verification", "Waits for a game to be verified by Descartes")
    .addOptionalParam("index", "The game index", 0, types.int)
    .setAction(async ({ index }, hre) => {
        const { ethers } = hre;

        // retrieves game and context contracts
        const descartes = await ethers.getContract("Descartes");
        const game = await ethers.getContract("TurnBasedGame");

        const context = await game.getContext(index);
        const descartesIndex = context.descartesIndex;

        console.log("");
        console.log(`Waiting for verification result for game with index '${index}' to be computed by Descartes under computation index '${descartesIndex}'...\n`);

        const state: string = await new Promise((resolve) => {
            descartes.on("DescartesFinished", (descartesIndexFinished, state) => {
                if (descartesIndexFinished.eq(descartesIndex)) {
                    resolve(state);
                }
            })
        });

        console.log(`Game verification with Descartes index ${descartesIndex} finished with state '${ethers.utils.toUtf8String(state)}'\n`);
    });
    
// APPLY-RESULT
task("apply-result", "Applies the result of a game verified by Descartes")
    .addOptionalParam("index", "The game index", 0, types.int)
    .setAction(async ({ index }, hre) => {
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
                    `Game '${index}' ended with result '${JSON.stringify(resultPrintable)}' (tx: ${tx.hash
                    } ; blocknumber: ${tx.blockNumber})\n`
                );
                return resultPrintable;
            }
        }
    });
