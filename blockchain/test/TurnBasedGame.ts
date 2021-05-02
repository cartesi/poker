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
        const [signer] = await ethers.getSigners();

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
        contextLibrary = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        contextLibrary = contextLibrary.attach(gameContract.address);
    });

    // prepares mock responses so that TurnBasedGame.challengeGame() can be called
    const prepareChallengeGame = async () => {
        await mockDescartes.mock.instantiate.returns(descartesIndex);
        await mockLogger.mock.calculateMerkleRootFromHistory.returns(EMPTY_DATA_LOG_HASH);
    };

    // START GAME

    it("Should activate game instance when starting a game", async () => {
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

    it("Should emit GameReady event when starting a game", async () => {
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

    // SUBMIT TURN

    it("Should only allow turn submission for active games", async () => {
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Index not instantiated"
        );
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("Should only allow turn submission from participating players", async () => {
        const accounts = await ethers.getSigners();
        let gameContractOtherSigner = gameContract.connect(accounts[2]);
        await gameContractOtherSigner.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContractOtherSigner.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Player is not participating in the game"
        );
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("Should not allow turn submission when game result has been claimed", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await gameContract.claimResult(0, playerFunds);
        await expect(gameContract.submitTurn(0, initialStateHash, turnData)).to.be.revertedWith(
            "Game end has been claimed"
        );

        // new games should be ok
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.submitTurn(1, initialStateHash, turnData)).not.to.be.reverted;
    });

    it("Should not allow turn submission when game verification is in progress", async () => {
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

    it("Should emit TurnOver event when submitting a turn", async () => {
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
        let player1 = (await ethers.getSigners())[1];
        let gameContractPlayer1 = gameContract.connect(player1);
        await expect(gameContractPlayer1.submitTurn(0, player1StateHash, turnData))
            .to.emit(contextLibrary, "TurnOver")
            .withArgs(0, [players[1], player1StateHash, player1LogIndex]);
    });

    // CHALLENGE GAME

    it("Should only allow active games to be challenged", async () => {
        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Index not instantiated");

        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContract.challengeGame(0)).not.to.be.reverted;
    });

    it("Should only allow game to be challenged by participating players", async () => {
        const accounts = await ethers.getSigners();
        let gameContractOtherSigner = gameContract.connect(accounts[2]);
        await gameContractOtherSigner.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await expect(gameContractOtherSigner.challengeGame(0)).to.be.revertedWith(
            "Player is not participating in the game"
        );

        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0)).not.to.be.reverted;
    });

    it("Should not allow game to be challenged when Descartes verification is in progress", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes informing that computation is still going on
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(false, true, ethers.constants.AddressZero, "0x");

        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Game verification already in progress");
    });

    it("Should not allow game to be challenged when Descartes verification has been fully performed", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        await prepareChallengeGame();
        await gameContract.challengeGame(0);

        // mockDescartes informing that computation is complete and results are available
        await mockDescartes.mock.getResult
            .withArgs(descartesIndex)
            .returns(true, false, ethers.constants.AddressZero, "0x123456");

        await expect(gameContract.challengeGame(0)).to.be.revertedWith("Game verification has already been performed");
    });

    it("Should emit GameChallenged event when a game is challenged", async () => {
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);

        // game challenged by player 0
        await prepareChallengeGame();
        await expect(gameContract.challengeGame(0))
            .to.emit(contextLibrary, "GameChallenged")
            .withArgs(0, descartesIndex, players[0]);

        // another game challenged by player 1
        await gameContract.startGame(gameTemplateHash, gameMetadata, players, playerFunds, playerInfos);
        await mockDescartes.mock.instantiate.returns(descartesIndex.add(1));
        let player1 = (await ethers.getSigners())[1];
        let gameContractPlayer1 = gameContract.connect(player1);
        await expect(gameContractPlayer1.challengeGame(1))
            .to.emit(contextLibrary, "GameChallenged")
            .withArgs(1, descartesIndex.add(1), players[1]);
    });
});
