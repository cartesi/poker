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
import { deployments, ethers, getNamedAccounts } from "hardhat";
import { MockContract, deployMockContract, solidity } from "ethereum-waffle";

import { TurnBasedGame } from "../src/types/TurnBasedGame";
import { TurnBasedGameContext } from "../src/types/TurnBasedGameContext";
import { TurnBasedGame__factory } from "../src/types/factories/TurnBasedGame__factory";
import { TurnBasedGameContext__factory } from "../src/types/factories/TurnBasedGameContext__factory";

use(solidity);

describe("TurnBasedGame", async () => {
    let gameContract: TurnBasedGame;
    let gameContractPlayer1: TurnBasedGame;
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
    const turnData = ["0x325E3731202B2033", "0x365E313200000000"];
    const initialStateHash = ethers.constants.HashZero;
    const descartesIndex = ethers.BigNumber.from(13);

    let players;
    let validators;

    beforeEach(async () => {
        const [signer, player1] = await ethers.getSigners();

        const { alice, bob } = await getNamedAccounts();
        players = [alice, bob];
        validators = players;

        const Descartes = await deployments.getArtifact("Descartes");
        const Logger = await deployments.getArtifact("Logger");

        mockDescartes = await deployMockContract(signer, Descartes.abi);
        mockLogger = await deployMockContract(signer, Logger.abi);

        await mockLogger.mock.calculateMerkleRootFromData.returns(EMPTY_DATA_LOG_HASH);
        await mockLogger.mock.getLogIndex.returns(EMPTY_DATA_LOG_INDEX);

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

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        expect(await gameContract.isActive(0), "1st game should be active after calling startGame once").to.equal(true);
        expect(await gameContract.isActive(1), "2nd game should be inactive before calling startGame twice").to.equal(
            false
        );

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        expect(await gameContract.isActive(0), "1st game should be active after calling startGame twice").to.equal(
            true
        );
        expect(await gameContract.isActive(1), "2nd game should be active after calling startGame twice").to.equal(
            true
        );
    });

    it("startGame: should emit GameReady event", async () => {
        // 1st game
        let tx = await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
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
        tx = await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
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
        const gameMetadataOther = "0x123456";
        tx = await gameContract.startGame(gameTemplateHash, gameMetadataOther, players, playerFunds, playerInfos);
        gameReadyEventRaw = (await tx.wait()).events[0];
        expect(gameReadyEventRaw).not.equal(undefined, "No event emitted");
        gameReadyEvent = contextLibrary.interface.parseLog(gameReadyEventRaw);
        expect(gameReadyEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
        index = gameReadyEvent.args._index;
        context = gameReadyEvent.args._context;

        expect(index).to.eql(ethers.BigNumber.from(2), "3rd game should emit event with index 2");
        expect(context[0]).to.eql(gameTemplateHash, "3rd game should emit event with appropriate context");
        expect(context[1]).to.eql(gameMetadataOther, "3rd game should emit event with appropriate context");
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

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.getContext(0)).not.to.be.reverted;
    });

    it("getContext: should return correct values", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
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
        const gameMetadataOther = "0x123456";
        await gameContract.startGame(gameTemplateHash, gameMetadataOther, players, playerFunds, playerInfos);
        context = await gameContract.getContext(1);
        expect(context[1]).to.eql(gameMetadataOther);
    });

    // SUBMIT TURN

    it("submitTurn: should only be allowed for active games", async () => {
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Index not instantiated"
        );
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should only be allowed from participating players", async () => {
        const accounts = await ethers.getSigners();
        let gameContractOtherSigner = gameContract.connect(accounts[2]);
        await gameContractOtherSigner.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContractOtherSigner.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Player is not participating in the game"
        );
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should not be allowed when game result has been claimed", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Game end has been claimed"
        );

        // new games should be ok
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(1, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should not be allowed when game verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        // challenges game
        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Game verification in progress"
        );

        // new games should be ok
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(1, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("submitTurn: should emit TurnOver event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        // turn from player 0
        await expect(gameContract.submitTurn(0, initialStateHash, turnData))
            .to.emit(contextLibrary, "TurnOver")
            .withArgs(0, [players[0], initialStateHash, EMPTY_DATA_LOG_INDEX]);

        // turn from player 1 with different data (state hash and log hash/index)
        const player1StateHash = ethers.utils.formatBytes32String("player1 state hash");
        const player1LogHash = ethers.utils.formatBytes32String("player1 log hash");
        const player1LogIndex = 3;
        await mockLogger.mock.calculateMerkleRootFromData.returns(player1LogHash);
        await mockLogger.mock.getLogIndex.returns(player1LogIndex);
        await expect(gameContractPlayer1.submitTurn(0, player1StateHash, turnData))
            .to.emit(contextLibrary, "TurnOver")
            .withArgs(0, [players[1], player1StateHash, player1LogIndex]);
    });

    it("submitTurn: should update context", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        const stateHash0 = ethers.utils.formatBytes32String("state hash 0");
        const stateHash1 = ethers.utils.formatBytes32String("state hash 1");
        const turnData0 = ["0x325E3731202B2033", "0x365E313200000000"];
        const turnData1 = ["0x325E3731202B2099", "0x365E313200000088", "0x365E313200000099"];
        const logIndex0 = 25;
        const logIndex1 = 28;
        await mockLogger.mock.getLogIndex.returns(logIndex0);
        await gameContract.submitTurn(0, stateHash0, turnData0);
        await mockLogger.mock.getLogIndex.returns(logIndex1);
        await gameContractPlayer1.submitTurn(0, stateHash1, turnData1);
        let context = await gameContract.getContext(0);
        let turns = context[6];
        expect(turns.length).to.eql(2);
        expect(turns[0].player).to.eql(players[0]);
        expect(turns[0].stateHash).to.eql(stateHash0);
        expect(turns[0].dataLogIndex).to.eql(ethers.BigNumber.from(logIndex0));
        expect(turns[1].player).to.eql(players[1]);
        expect(turns[1].stateHash).to.eql(stateHash1);
        expect(turns[1].dataLogIndex).to.eql(ethers.BigNumber.from(logIndex1));
    });

    // CHALLENGE GAME

    it("challengeGame: should only be allowed for active games", async () => {
        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.challengeGame(0)).not.to.be.reverted;
    });

    it("challengeGame: should only be allowed by participating players", async () => {
        const accounts = await ethers.getSigners();
        let gameContractOtherSigner = gameContract.connect(accounts[2]);
        await gameContractOtherSigner.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContractOtherSigner.challengeGame(0)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0)).not.to.be.reverted;
    });

    it("challengeGame: should not be allowed when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes informing that computation is still going on
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(false, true, ethers.constants.AddressZero, "0x");

        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Game verification already in progress");
    });

    it("challengeGame: should not be allowed when Descartes verification has been fully performed", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes informing that computation is complete and results are available
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");

        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Game verification has already been performed");
    });

    it("challengeGame: should emit GameChallenged event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        // game challenged by player 0
        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0))
            .to.emit(contextLibrary, "GameChallenged")
            .withArgs(0, descartesIndex, players[0]);

        // another game challenged by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await mockDescartes.mock.instantiate.returns(descartesIndex.add(1));
        await expect(gameContractPlayer1.challengeGame(1))
            .to.emit(contextLibrary, "GameChallenged")
            .withArgs(1, descartesIndex.add(1), players[1]);
    });

    it("challengeGame: should update context", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);
        let context = await gameContract.getContext(0);
        expect(context[7]).to.eql(true); // isDescartesInstantiated
        expect(context[8]).to.eql(descartesIndex); // descartesIndex
    });

    // CLAIM RESULT

    it("claimResult: should only be allowed for active games", async () => {
        await expect(gameContract.claimResult(0, playerFunds)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(0, playerFunds)).not.to.be.reverted;
    });

    it("claimResult: should only be allowed by participating players", async () => {
        const accounts = await ethers.getSigners();
        let gameContractOtherSigner = gameContract.connect(accounts[2]);
        await gameContractOtherSigner.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContractOtherSigner.claimResult(0, playerFunds)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await expect(gameContract.claimResult(0, playerFunds)).not.to.be.reverted;
    });

    it("claimResult: should not be allowed more than once", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(0, playerFunds)).not.to.be.reverted;
        await expect(gameContract.claimResult(0, playerFunds)).to.be.revertedWith(
            "Result has already been claimed for this game: it must now be either confirmed or challenged"
        );
    });

    it("claimResult: should not be allowed when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await expect(gameContract.claimResult(0, playerFunds)).to.be.revertedWith(
            "Game has been challenged and a verification has been requested"
        );
    });

    it("claimResult: should check if claimed result is valid", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
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
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(1, [100, 100])).not.to.be.reverted;
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(2, [101, 99])).not.to.be.reverted;
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.claimResult(3, [200, 0])).not.to.be.reverted;
    });

    it("claimResult: should emit GameResultClaimed event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        // result claimed by player 0
        await expect(gameContract.claimResult(0, [120, 80]))
            .to.emit(contextLibrary, "GameResultClaimed")
            .withArgs(0, [120, 80], players[0]);

        // another game with result claimed by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContractPlayer1.claimResult(1, [0, 150]))
            .to.emit(contextLibrary, "GameResultClaimed")
            .withArgs(1, [0, 150], players[1]);
    });

    it("claimResult: should update context", async () => {
        // result claimed by player 0
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, [120, 80]);
        let context = await gameContract.getContext(0);
        expect(context[9]).to.eql(players[0]); // claimer
        expect(context[10]).to.eql([ethers.BigNumber.from(120), ethers.BigNumber.from(80)]); // claimedFundsShare
        expect(context[11]).to.eql(ethers.BigNumber.from(1)); // claimAgreementMask with only last bit turned on (only player0 agrees)

        // another game with result claimed by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContractPlayer1.claimResult(1, [70, 120]);
        context = await gameContract.getContext(1);
        expect(context[9]).to.eql(players[1]); // claimer
        expect(context[10]).to.eql([ethers.BigNumber.from(70), ethers.BigNumber.from(120)]); // claimedFundsShare
        expect(context[11]).to.eql(ethers.BigNumber.from(2)); // claimAgreementMask with only before last bit turned on (only player1 agrees)
    });

    // CONFIRM RESULT

    it("confirmResult: should only be allowed for active games", async () => {
        await expect(gameContract.confirmResult(0)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.confirmResult(0)).not.to.be.reverted;
    });

    it("confirmResult: should only be allowed by participating players", async () => {
        const accounts = await ethers.getSigners();
        let gameContractOtherSigner = gameContract.connect(accounts[2]);
        await gameContractOtherSigner.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContractOtherSigner.confirmResult(0)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await expect(gameContract.confirmResult(0)).not.to.be.reverted;
    });

    it("confirmResult: should only be allowed when a result was claimed before", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.confirmResult(0)).to.be.revertedWith("Result has not been claimed for this game yet");

        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.confirmResult(0)).not.to.be.reverted;
    });

    it("confirmResult: should not be allowed when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await expect(gameContract.confirmResult(0)).to.be.revertedWith(
            "Game has been challenged and a verification has been requested"
        );
    });

    it("confirmResult: should end game and emit GameOver event when called by all players", async () => {
        // result claimed by player 0 and confirmed by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, [120, 80]);
        expect(await gameContract.isActive(0), "1st game should be active before result is confirmed").to.equal(true);
        await expect(gameContractPlayer1.confirmResult(0)).to.emit(contextLibrary, "GameOver").withArgs(0, [120, 80]);
        expect(await gameContract.isActive(0), "1st game should be inactive after confirmed by all").to.equal(false);

        // another game with result claimed by player 1 and confirmed by player 0
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContractPlayer1.claimResult(1, [0, 150]);
        expect(await gameContract.isActive(1), "2nd game should be active before result is confirmed").to.equal(true);
        await expect(gameContract.confirmResult(1)).to.emit(contextLibrary, "GameOver").withArgs(1, [0, 150]);
        expect(await gameContract.isActive(1), "2nd game should be inactive after confirmed by all").to.equal(false);
    });

    it("confirmResult: should update context", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
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
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");

        await expect(gameContract.applyVerificationResult(0)).not.to.be.reverted;
    });

    it("applyVerificationResult: should not be allowed when result is not available", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
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

        // Descartes verification result available
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");
        await expect(gameContract.applyVerificationResult(0)).not.to.be.reverted;
    });

    it("applyVerificationResult: should end game and emit GameOver event", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");

        expect(await gameContract.isActive(0), "Game should be active before verification result is applied").to.equal(
            true
        );
        // FIXME: check if resulting fundsShare corresponds to bytes result
        // await expect(gameContract.applyVerificationResult(0)).to.emit(contextLibrary, "GameOver").withArgs(0, [120, 80]);
        await expect(gameContract.applyVerificationResult(0)).to.emit(contextLibrary, "GameOver");
        expect(await gameContract.isActive(0), "Game should be inactive after verification result is applied").to.equal(
            false
        );
    });
});
