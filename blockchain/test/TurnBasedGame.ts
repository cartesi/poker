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
});
