// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { describe } from "mocha";
import { expect, use } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { MockContract, deployMockContract, solidity } from "ethereum-waffle";

import { TurnBasedGame } from "../src/types/TurnBasedGame";
import { TurnBasedGameContext } from "../src/types/TurnBasedGameContext";
import { TurnBasedGame__factory } from "../src/types/factories/TurnBasedGame__factory";
import { TurnBasedGameContext__factory } from "../src/types/factories/TurnBasedGameContext__factory";

use(solidity);

describe("TurnBasedGame", async () => {
    let gameContract: TurnBasedGame;
    let gameContractPlayer1: TurnBasedGame;
    let gameContractNonPlayer: TurnBasedGame;
    let contextLibrary: TurnBasedGameContext;
    let mockDescartes: MockContract;
    let mockLogger: MockContract;

    const EMPTY_DATA_LOG_HASH: string = "0x8e7a427fa943d9966b389f4f257173676090c6e95f43e2cb6d65f8758111e309";
    const EMPTY_DATA_LOG_INDEX: number = 1;

    const gameTemplateHash = "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa";
    const gameMetadata = "0x";
    const playerFunds = [ethers.BigNumber.from(100), ethers.BigNumber.from(100)];
    const playerInfos = [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Alice")),
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Bob")),
    ];
    const turnData = "0x325E3731202B2033365E3132";
    const descartesIndex = ethers.BigNumber.from(13);

    let players;
    let validators;

    beforeEach(async () => {
        const [signer, player1, nonPlayer] = await ethers.getSigners();

        const { alice, bob } = await getNamedAccounts();
        players = [alice, bob];
        validators = players;

        const Descartes = await deployments.getArtifact("Descartes");
        const Logger = await deployments.getArtifact("Logger");

        mockDescartes = await deployMockContract(signer, Descartes.abi);
        mockLogger = await deployMockContract(signer, Logger.abi);

        await mockLogger.mock.calculateMerkleRootFromData.returns(EMPTY_DATA_LOG_HASH);
        await mockLogger.mock.getLogIndex.returns(EMPTY_DATA_LOG_INDEX);
        await mockDescartes.mock.destruct.returns();

        const { deploy } = deployments;
        const TurnBasedGameContext = await deploy("TurnBasedGameContext", {
            from: signer.address,
            log: true,
        });
        const TurnBasedGame = await deploy("TurnBasedGame", {
            from: signer.address,
            log: true,
            args: [mockDescartes.address, mockLogger.address],
            libraries: { TurnBasedGameContext: TurnBasedGameContext.address },
        });

        gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        gameContractPlayer1 = gameContract.connect(player1);
        gameContractNonPlayer = gameContract.connect(nonPlayer);

        contextLibrary = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        contextLibrary = contextLibrary.attach(gameContract.address);
    });

    // prepares mock responses so that TurnBasedGame.challengeGame() can be called
    const prepareChallengeGame = async () => {
        await mockDescartes.mock.instantiate.returns(descartesIndex);
        await mockLogger.mock.calculateMerkleRootFromHistory.returns(EMPTY_DATA_LOG_HASH);
    };

    // START GAME

    it("startGame: should activate game instance", async () => {
        expect(await gameContract.isActive(0), "1st game should be inactive before calling startGame").to.equal(false);

        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        expect(await gameContract.isActive(0), "1st game should be active after calling startGame once").to.equal(true);
        expect(await gameContract.isActive(1), "2nd game should be inactive before calling startGame twice").to.equal(
            false
        );

        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        expect(await gameContract.isActive(0), "1st game should be active after calling startGame twice").to.equal(
            true
        );
        expect(await gameContract.isActive(1), "2nd game should be active after calling startGame twice").to.equal(
            true
        );
    });

    it("startGame: should emit GameReady event", async () => {
        // 1st game
        let tx = await gameContract.startGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        let gameReadyEventRaw = (await tx.wait()).events[0];
        expect(gameReadyEventRaw).not.equal(undefined, "No event emitted");
        let gameReadyEvent = contextLibrary.interface.parseLog(gameReadyEventRaw);
        expect(gameReadyEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
        let index = gameReadyEvent.args._index;
        let context = gameReadyEvent.args._context;

        expect(index).to.eql(ethers.BigNumber.from(0), "1st game should emit event with index 0");
        expect(context[0]).to.eql(gameTemplateHash, "1st game should emit event with appropriate context");
        expect(context[1]).to.eql(gameMetadata, "1st game should emit event with appropriate context");
        expect(context[2]).to.eql(validators, "1st game should emit event with appropriate context");
        expect(context[3]).to.eql(players, "1st game should emit event with appropriate context");
        expect(context[4]).to.eql(playerFunds, "1st game should emit event with appropriate context");
        expect(context[5]).to.eql(playerInfos, "1st game should emit event with appropriate context");
        expect(context[6]).to.eql([], "1st game should emit event with appropriate context"); // turns
        expect(context[7]).to.eql(false, "1st game should emit event with appropriate context"); // null isDescartesInstantiated
        expect(context[8]).to.eql(ethers.constants.Zero, "1st game should emit event with appropriate context"); // null descartesIndex
        expect(context[9]).to.eql(ethers.constants.AddressZero, "1st game should emit event with appropriate context"); // null claimer
        expect(context[10]).to.eql([], "1st game should emit event with appropriate context"); // null claimedFundsShare
        expect(context[11]).to.eql(ethers.constants.Zero, "1st game should emit event with appropriate context"); // null claimAgreementMask

        // 2nd game: same params
        tx = await gameContract.startGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        gameReadyEventRaw = (await tx.wait()).events[0];
        expect(gameReadyEventRaw).not.equal(undefined, "No event emitted");
        gameReadyEvent = contextLibrary.interface.parseLog(gameReadyEventRaw);
        expect(gameReadyEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
        index = gameReadyEvent.args._index;
        context = gameReadyEvent.args._context;

        expect(index).to.eql(ethers.BigNumber.from(1), "2nd game should emit event with index 1");
        expect(context[0]).to.eql(gameTemplateHash, "2nd game should emit event with appropriate context");
        expect(context[1]).to.eql(gameMetadata, "2nd game should emit event with appropriate context");
        expect(context[2]).to.eql(validators, "2nd game should emit event with appropriate context");
        expect(context[3]).to.eql(players, "2nd game should emit event with appropriate context");
        expect(context[4]).to.eql(playerFunds, "2nd game should emit event with appropriate context");
        expect(context[5]).to.eql(playerInfos, "2nd game should emit event with appropriate context");
        expect(context[6]).to.eql([], "2nd game should emit event with appropriate context"); // turns
        expect(context[7]).to.eql(false, "2nd game should emit event with appropriate context"); // null isDescartesInstantiated
        expect(context[8]).to.eql(ethers.constants.Zero, "2nd game should emit event with appropriate context"); // null descartesIndex
        expect(context[9]).to.eql(ethers.constants.AddressZero, "2nd game should emit event with appropriate context"); // null claimer
        expect(context[10]).to.eql([], "2nd game should emit event with appropriate context"); // null claimedFundsShare
        expect(context[11]).to.eql(ethers.constants.Zero, "2nd game should emit event with appropriate context"); // null claimAgreementMask

        // 3rd game: different metadata
        const gameMetadata2 = "0x123456";
        tx = await gameContract.startGame(
            gameTemplateHash,
            gameMetadata2,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        gameReadyEventRaw = (await tx.wait()).events[0];
        expect(gameReadyEventRaw).not.equal(undefined, "No event emitted");
        gameReadyEvent = contextLibrary.interface.parseLog(gameReadyEventRaw);
        expect(gameReadyEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
        index = gameReadyEvent.args._index;
        context = gameReadyEvent.args._context;

        expect(index).to.eql(ethers.BigNumber.from(2), "3rd game should emit event with index 2");
        expect(context[0]).to.eql(gameTemplateHash, "3rd game should emit event with appropriate context");
        expect(context[1]).to.eql(gameMetadata2, "3rd game should emit event with appropriate context");
        expect(context[2]).to.eql(validators, "3rd game should emit event with appropriate context");
        expect(context[3]).to.eql(players, "3rd game should emit event with appropriate context");
        expect(context[4]).to.eql(playerFunds, "3rd game should emit event with appropriate context");
        expect(context[5]).to.eql(playerInfos, "3rd game should emit event with appropriate context");
        expect(context[6]).to.eql([], "3rd game should emit event with appropriate context"); // turns
        expect(context[7]).to.eql(false, "3rd game should emit event with appropriate context"); // null isDescartesInstantiated
        expect(context[8]).to.eql(ethers.constants.Zero, "3rd game should emit event with appropriate context"); // null descartesIndex
        expect(context[9]).to.eql(ethers.constants.AddressZero, "3rd game should emit event with appropriate context"); // null claimer
        expect(context[10]).to.eql([], "3rd game should emit event with appropriate context"); // null claimedFundsShare
        expect(context[11]).to.eql(ethers.constants.Zero, "3rd game should emit event with appropriate context"); // null claimAgreementMask
    });

    // GET CONTEXT

    it("getContext: should only be allowed for instantiated games", async () => {
        await expect(gameContract.getContext(0)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.getContext(0)).not.to.be.reverted;
    });

    it("getContext: should return correct values", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        let context = await gameContract.getContext(0);
        expect(context[0]).to.eql(gameTemplateHash);
        expect(context[1]).to.eql(gameMetadata);
        expect(context[2]).to.eql(validators);
        expect(context[3]).to.eql(players);
        expect(context[4]).to.eql(playerFunds);
        expect(context[5]).to.eql(playerInfos);
        expect(context[6]).to.eql([]); // turns
        expect(context[7]).to.eql(false); // null isDescartesInstantiated
        expect(context[8]).to.eql(ethers.constants.Zero); // null descartesIndex
        expect(context[9]).to.eql(ethers.constants.AddressZero); // null claimer
        expect(context[10]).to.eql([]); // null claimedFundsShare
        expect(context[11]).to.eql(ethers.constants.Zero); // null claimAgreementMask

        // 2nd game: different metadata should reflect in the context
        const gameMetadata2 = "0x123456";
        await gameContract.startGame(gameTemplateHash, gameMetadata2, validators, players, playerFunds, playerInfos);
        context = await gameContract.getContext(1);
        expect(context[1]).to.eql(gameMetadata2);
    });

    // SUBMIT TURN

    it("submitTurn: should only be allowed for active games", async () => {
        await expect(gameContract.submitTurn(0, 0, turnData)).to.be.revertedWith("Index not instantiated");
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(0, 0, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should only be allowed from participating players", async () => {
        await gameContractNonPlayer.startGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        await expect(gameContractNonPlayer.submitTurn(0, 0, turnData)).to.be.revertedWith(
            "Player is not participating in the game"
        );
        await expect(gameContract.submitTurn(0, 0, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should not be allowed when game result has been claimed", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.submitTurn(0, 0, turnData)).to.be.revertedWith("Game end has been claimed");

        // new games should be ok
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(1, 0, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should not be allowed when game verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        // challenges game
        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await expect(gameContract.submitTurn(0, 0, turnData)).to.be.revertedWith("Game verification in progress");

        // new games should be ok
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(1, 0, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should only be allowed with correct turnIndex sequence", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        // 1st submission must have turnIndex 0
        await expect(gameContract.submitTurn(0, 1, turnData)).to.be.revertedWith("Invalid turn submission sequence");
        await expect(gameContract.submitTurn(0, 5, turnData)).to.be.revertedWith("Invalid turn submission sequence");
        await expect(gameContract.submitTurn(0, 0, turnData)).not.to.be.reverted;

        // 2nd submission must have turnIndex 1
        await expect(gameContract.submitTurn(0, 0, turnData)).to.be.revertedWith("Invalid turn submission sequence");
        await expect(gameContract.submitTurn(0, 2, turnData)).to.be.revertedWith("Invalid turn submission sequence");
        await expect(gameContract.submitTurn(0, 5, turnData)).to.be.revertedWith("Invalid turn submission sequence");
        await expect(gameContract.submitTurn(0, 1, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should emit TurnOver event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        // forcing next block's timestamp, which is only allowed if it's in the future (must be larger than previous block's timestamp)
        let timestampSeconds = Math.ceil(Date.now() / 1000) + 1000;
        await network.provider.send("evm_setNextBlockTimestamp", [timestampSeconds]);

        // turn from player 0
        let tx = await gameContract.submitTurn(0, 0, turnData);
        let turnOverEventRaw = (await tx.wait()).events[0];
        expect(turnOverEventRaw).not.equal(undefined, "No event emitted");
        let turnOverEvent = contextLibrary.interface.parseLog(turnOverEventRaw);
        expect(turnOverEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
        expect(turnOverEvent).not.equal(undefined, "No event emitted");
        let index = turnOverEvent.args._index;
        let turnIndex = turnOverEvent.args._turnIndex;
        let turn = turnOverEvent.args._turn;
        expect(index).to.eql(ethers.BigNumber.from(0), "1st turn should have game index 0");
        expect(turnIndex).to.eql(ethers.BigNumber.from(0), "1st turn should refer to turnIndex 0");
        expect(turn[0]).to.eql(players[0], "1st turn should be emitted by player0");
        expect(turn[1]).to.eql(
            ethers.BigNumber.from(timestampSeconds),
            "1st turn should be emitted with the correct timestamp"
        );
        expect(turn[2]).to.eql(
            [ethers.BigNumber.from(EMPTY_DATA_LOG_INDEX)],
            "1st turn should refer to the appropriate log index"
        );

        // turn from player 1 with different data (log hash/index)
        const player1LogHash = ethers.utils.formatBytes32String("player1 log hash");
        const player1LogIndex = 3;
        await mockLogger.mock.calculateMerkleRootFromData.returns(player1LogHash);
        await mockLogger.mock.getLogIndex.returns(player1LogIndex);
        tx = await gameContractPlayer1.submitTurn(0, 1, turnData);
        turnOverEventRaw = (await tx.wait()).events[0];
        expect(turnOverEventRaw).not.equal(undefined, "No event emitted");
        turnOverEvent = contextLibrary.interface.parseLog(turnOverEventRaw);
        expect(turnOverEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
        expect(turnOverEvent).not.equal(undefined, "No event emitted");
        index = turnOverEvent.args._index;
        turnIndex = turnOverEvent.args._turnIndex;
        turn = turnOverEvent.args._turn;
        expect(index).to.eql(ethers.BigNumber.from(0), "2nd turn should have game index 0");
        expect(turnIndex).to.eql(ethers.BigNumber.from(1), "2nd turn should refer to turnIndex 1");
        expect(turn[0]).to.eql(players[1], "2nd turn should be emitted by player1");
        expect(turn[1]).to.be.above(
            ethers.BigNumber.from(timestampSeconds),
            "2nd turn should be emitted with the correct timestamp"
        );
        expect(turn[2]).to.eql(
            [ethers.BigNumber.from(player1LogIndex)],
            "2nd turn should refer to the appropriate log index"
        );
    });

    it("submitTurn: should update context", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        const turnData0 = "0x325E3731202B2033365E313200000000";
        const turnData1 = "0x325E3731202B2099365E313200000088365E3132000099";
        const logIndex0 = 25;
        const logIndex1 = 28;
        await mockLogger.mock.getLogIndex.returns(logIndex0);
        await gameContract.submitTurn(0, 0, turnData0);
        await mockLogger.mock.getLogIndex.returns(logIndex1);
        await gameContractPlayer1.submitTurn(0, 1, turnData1);
        let context = await gameContract.getContext(0);
        let turns = context[6];
        expect(turns.length).to.eql(2);
        expect(turns[0].player).to.eql(players[0]);
        expect(turns[0].dataLogIndices[0]).to.eql(ethers.BigNumber.from(logIndex0));
        expect(turns[1].player).to.eql(players[1]);
        expect(turns[1].dataLogIndices[0]).to.eql(ethers.BigNumber.from(logIndex1));
    });

    it("submitTurn: should update context with large data", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        // 8-byte entry
        const bytes8 = "325E3731202B2033";

        // data with 10 * 8-byte entries (80 bytes): should fit into one chunk
        let turnData = "0x";
        for (let i = 0; i < 10; i++) {
            turnData = turnData.concat(bytes8);
        }
        await gameContract.submitTurn(0, 0, turnData);
        let context = await gameContract.getContext(0);
        let turns = context[6];
        expect(turns.length).to.eql(1, "Should contain one turn");
        expect(turns[0].dataLogIndices.length).to.eql(1, "10 8-byte entries should fit into one chunk");

        // data with 128 * 8-byte entries (1024 bytes): should fit into one chunk
        turnData = "0x";
        for (let i = 0; i < 128; i++) {
            turnData = turnData.concat(bytes8);
        }
        await gameContract.submitTurn(0, 1, turnData);
        context = await gameContract.getContext(0);
        turns = context[6];
        expect(turns.length).to.eql(2, "Should contain two turns");
        expect(turns[1].dataLogIndices.length).to.eql(1, "128 8-byte entries should fit into one chunk");

        // data with 129 * 8-byte entries (1032 bytes): should need two chunks
        turnData = "0x";
        for (let i = 0; i < 129; i++) {
            turnData = turnData.concat(bytes8);
        }
        await gameContract.submitTurn(0, 2, turnData);
        context = await gameContract.getContext(0);
        turns = context[6];
        expect(turns.length).to.eql(3, "Should contain three turns");
        expect(turns[2].dataLogIndices.length).to.eql(2, "129 8-byte entries should require two chunks");

        // data with 500 * 8-byte entries (4000 bytes): should need four chunks
        turnData = "0x";
        for (let i = 0; i < 500; i++) {
            turnData = turnData.concat(bytes8);
        }
        await gameContract.submitTurn(0, 3, turnData);
        context = await gameContract.getContext(0);
        turns = context[6];
        expect(turns.length).to.eql(4, "Should contain four turns");
        expect(turns[3].dataLogIndices.length).to.eql(4, "500 8-byte entries should require four chunks");
    });

    // CHALLENGE GAME

    it("challengeGame: should only be allowed for active games", async () => {
        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.challengeGame(0)).not.to.be.reverted;
    });

    it("challengeGame: should only be allowed by participating players", async () => {
        await gameContractNonPlayer.startGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        await expect(gameContractNonPlayer.challengeGame(0)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0)).not.to.be.reverted;
    });

    it("challengeGame: should not be allowed when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes informing that computation is still going on
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(false, true, ethers.constants.AddressZero, "0x");

        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Game verification already in progress");
    });

    it("challengeGame: should not be allowed when Descartes verification has been fully performed", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes informing that computation is complete and results are available
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");

        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Game verification has already been performed");
    });

    it("challengeGame: should emit GameChallenged event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        // game challenged by player 0
        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0))
            .to.emit(contextLibrary, "GameChallenged")
            .withArgs(0, descartesIndex, players[0]);

        // another game challenged by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await mockDescartes.mock.instantiate.returns(descartesIndex.add(1));
        await expect(gameContractPlayer1.challengeGame(1))
            .to.emit(contextLibrary, "GameChallenged")
            .withArgs(1, descartesIndex.add(1), players[1]);
    });

    it("challengeGame: should update context", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);
        let context = await gameContract.getContext(0);
        expect(context[7]).to.eql(true); // isDescartesInstantiated
        expect(context[8]).to.eql(descartesIndex); // descartesIndex
    });

    // CLAIM RESULT

    it("claimResult: should only be allowed for active games", async () => {
        await expect(gameContract.claimResult(0, playerFunds)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(0, playerFunds)).not.to.be.reverted;
    });

    it("claimResult: should only be allowed by participating players", async () => {
        await gameContractNonPlayer.startGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        await expect(gameContractNonPlayer.claimResult(0, playerFunds)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await expect(gameContract.claimResult(0, playerFunds)).not.to.be.reverted;
    });

    it("claimResult: should not be allowed more than once", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(0, playerFunds)).not.to.be.reverted;
        await expect(gameContract.claimResult(0, playerFunds)).to.be.revertedWith(
            "Result has already been claimed for this game: it must now be either confirmed or challenged"
        );
    });

    it("claimResult: should not be allowed when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await expect(gameContract.claimResult(0, playerFunds)).to.be.revertedWith(
            "Game has been challenged and a verification has been requested"
        );
    });

    it("claimResult: should check if claimed result is valid", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(0, [201, 0])).to.be.revertedWith(
            "Resulting funds distribution exceeds amount locked by the players for the game"
        );
        await expect(gameContract.claimResult(0, [99, 102])).to.be.revertedWith(
            "Resulting funds distribution exceeds amount locked by the players for the game"
        );
        await expect(gameContract.claimResult(0, [40, 30, 50])).to.be.revertedWith(
            "Resulting funds distribution does not match number of players in the game"
        );
        await expect(gameContract.claimResult(0, [40])).to.be.revertedWith(
            "Resulting funds distribution does not match number of players in the game"
        );
        await expect(gameContract.claimResult(0, [30, 80])).not.to.be.reverted;
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(1, [100, 100])).not.to.be.reverted;
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(2, [101, 99])).not.to.be.reverted;
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(3, [200, 0])).not.to.be.reverted;
    });

    it("claimResult: should emit GameResultClaimed event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);

        // result claimed by player 0
        await expect(gameContract.claimResult(0, [120, 80]))
            .to.emit(contextLibrary, "GameResultClaimed")
            .withArgs(0, [120, 80], players[0]);

        // another game with result claimed by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContractPlayer1.claimResult(1, [0, 150]))
            .to.emit(contextLibrary, "GameResultClaimed")
            .withArgs(1, [0, 150], players[1]);
    });

    it("claimResult: should update context", async () => {
        // result claimed by player 0
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, [120, 80]);
        let context = await gameContract.getContext(0);
        expect(context[9]).to.eql(players[0]); // claimer
        expect(context[10]).to.eql([ethers.BigNumber.from(120), ethers.BigNumber.from(80)]); // claimedFundsShare
        expect(context[11]).to.eql(ethers.BigNumber.from(1)); // claimAgreementMask with only last bit turned on (only player0 agrees)

        // another game with result claimed by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContractPlayer1.claimResult(1, [70, 120]);
        context = await gameContract.getContext(1);
        expect(context[9]).to.eql(players[1]); // claimer
        expect(context[10]).to.eql([ethers.BigNumber.from(70), ethers.BigNumber.from(120)]); // claimedFundsShare
        expect(context[11]).to.eql(ethers.BigNumber.from(2)); // claimAgreementMask with only before last bit turned on (only player1 agrees)
    });

    // CONFIRM RESULT

    it("confirmResult: should only be allowed for active games", async () => {
        await expect(gameContract.confirmResult(0)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.confirmResult(0)).not.to.be.reverted;
    });

    it("confirmResult: should only be allowed by participating players", async () => {
        await gameContractNonPlayer.startGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players,
            playerFunds,
            playerInfos
        );
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContractNonPlayer.confirmResult(0)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await expect(gameContract.confirmResult(0)).not.to.be.reverted;
    });

    it("confirmResult: should only be allowed when a result was claimed before", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await expect(gameContract.confirmResult(0)).to.be.revertedWith("Result has not been claimed for this game yet");

        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.confirmResult(0)).not.to.be.reverted;
    });

    it("confirmResult: should not be allowed when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await expect(gameContract.confirmResult(0)).to.be.revertedWith(
            "Game has been challenged and a verification has been requested"
        );
    });

    it("confirmResult: should end game and emit GameOver event when called by all players", async () => {
        // result claimed by player 0 and confirmed by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, [120, 80]);
        expect(await gameContract.isActive(0), "1st game should be active before result is confirmed").to.equal(true);
        await expect(gameContractPlayer1.confirmResult(0)).to.emit(contextLibrary, "GameOver").withArgs(0, [120, 80]);
        expect(await gameContract.isActive(0), "1st game should be inactive after confirmed by all").to.equal(false);

        // another game with result claimed by player 1 and confirmed by player 0
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContractPlayer1.claimResult(1, [0, 150]);
        expect(await gameContract.isActive(1), "2nd game should be active before result is confirmed").to.equal(true);
        await expect(gameContract.confirmResult(1)).to.emit(contextLibrary, "GameOver").withArgs(1, [0, 150]);
        expect(await gameContract.isActive(1), "2nd game should be inactive after confirmed by all").to.equal(false);
    });

    it("confirmResult: should update context", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, [120, 80]);
        let context = await gameContract.getContext(0);
        expect(context[11]).to.eql(ethers.BigNumber.from(1)); // claimAgreementMask with last bit turned on (only player0 agrees)

        await gameContractPlayer1.confirmResult(0);
        context = await gameContract.getContext(0);
        expect(context[11]).to.eql(ethers.BigNumber.from(3)); // claimAgreementMask with last two bits turned on (player0 and player1 agree)
    });

    // APPLY VERIFICATION RESULT

    it("applyVerificationResult: should only be allowed for active games", async () => {
        await expect(gameContract.applyVerificationResult(0)).to.be.revertedWith("Index not instantiated");

        // challenge game and then set mockDescartes to inform that computation is complete and results are available
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(
                true,
                false,
                ethers.constants.AddressZero,
                "0x00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000050"
            );

        await expect(gameContract.applyVerificationResult(0)).not.to.be.reverted;
    });

    it("applyVerificationResult: should not be allowed when result is not available", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);

        // no Descartes verification requested
        await expect(gameContract.applyVerificationResult(0)).to.be.revertedWith(
            "Game verification has not been requested"
        );

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // Descartes verification still in progress
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(false, true, ethers.constants.AddressZero, "0x");
        await expect(gameContract.applyVerificationResult(0)).to.be.revertedWith(
            "Game verification result has not been computed yet"
        );

        // Descartes verification over but no result is available
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(false, false, ethers.constants.AddressZero, "0x");
        await expect(gameContract.applyVerificationResult(0)).to.be.revertedWith(
            "Game verification result not available"
        );

        // Descartes verification complete but result is invalid
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");
        await expect(gameContract.applyVerificationResult(0)).to.be.revertedWith(
            "Game verification result is invalid: should have one uint256 value for each player"
        );

        // Descartes verification complete with valid result
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(
                true,
                false,
                ethers.constants.AddressZero,
                "0x00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000050"
            );
        await expect(gameContract.applyVerificationResult(0), "Valid result with exact size").not.to.be.reverted;
    });

    it("applyVerificationResult: should be allowed even when result is larger than required", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(
                true,
                false,
                ethers.constants.AddressZero,
                "0x00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000050000000"
            );
        await expect(gameContract.applyVerificationResult(0), "Valid result with larger size (padded with zeros)").not
            .to.be.reverted;
    });

    it("applyVerificationResult: should end game and emit GameOver event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes result corresponding to a [120, 80] distribution (or [0x78, 0x50] in hex)
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(
                true,
                false,
                ethers.constants.AddressZero,
                "0x00000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000000000000000000000000000000000050000000"
            );

        expect(await gameContract.isActive(0), "Game should be active before verification result is applied").to.equal(
            true
        );

        // checks event
        await expect(gameContract.applyVerificationResult(0))
            .to.emit(contextLibrary, "GameOver")
            .withArgs(0, [120, 80]);

        expect(await gameContract.isActive(0), "Game should be inactive after verification result is applied").to.equal(
            false
        );
    });
});
