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
import { deployments, ethers } from "hardhat";
import { solidity, MockContract, deployMockContract } from "ethereum-waffle";

import { TestTurnBasedGameContext } from "../src/types/TestTurnBasedGameContext";
import { TestTurnBasedGameContext__factory } from "../src/types/factories/TestTurnBasedGameContext__factory";
import { getEvent } from "./EventUtil";
import { BigNumberish } from "@ethersproject/bignumber";
import { TurnBasedGameContext } from "../src/types";

use(solidity);

describe("TurnBasedGameContext", async () => {
    let contract: TestTurnBasedGameContext;
    let mockLogger: MockContract;

    const EMPTY_DATA_LOG_HASH: string = "0x8e7a427fa943d9966b389f4f257173676090c6e95f43e2cb6d65f8758111e309";
    const EMPTY_DATA_LOG_INDEX: number = 1;
    const TURN_CHUNK_LOG2SIZE = 12;

    let context;
    let player0;
    let player1;
    let latestBlockTimestamp;

    beforeEach(async () => {
        [player0, player1] = await ethers.getSigners();
        const signer = player0;

        const { deploy } = deployments;
        const TestTurnBasedGameContext = await deploy("TestTurnBasedGameContext", {
            from: signer.address,
            log: true,
        });

        const Logger = await deployments.getArtifact("Logger");
        mockLogger = await deployMockContract(signer, Logger.abi);
        await mockLogger.mock.calculateMerkleRootFromData.returns(EMPTY_DATA_LOG_HASH);
        await mockLogger.mock.getLogIndex.returns(EMPTY_DATA_LOG_INDEX);

        contract = TestTurnBasedGameContext__factory.connect(TestTurnBasedGameContext.address, signer);

        latestBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        context = {
            gameTemplateHash: ethers.constants.HashZero,
            gameMetadata: "0x",
            gameValidators: [player0.address, player1.address],
            gameTimeout: ethers.BigNumber.from(10),
            gameERC20Address: ethers.constants.AddressZero,
            players: [player0.address, player1.address],
            playerFunds: [ethers.BigNumber.from(100), ethers.BigNumber.from(100)],
            playerInfos: ["0x", "0x"],
            startTimestamp: latestBlockTimestamp,
            turns: [],
            isDescartesInstantiated: false,
            descartesIndex: ethers.BigNumber.from(0),
            claimer: ethers.constants.AddressZero,
            claimedFundsShare: [],
            claimAgreementMask: ethers.constants.HashZero,
        };
    });

    // buildDataDrive

    describe("buildDirectDrive", async () => {
        it("Should build small DirectDrive appropriately", async () => {
            const data = "0x123456";
            const drivePosition = ethers.BigNumber.from("0xa000000000000000");
            const drive = await contract.buildDirectDrive(data, drivePosition);
            expect(drive.position).to.equal(drivePosition);
            expect(drive.driveLog2Size, "Log2Size should be the minimum value of 5 (32 bytes)").to.equal(5);
            expect(drive.directValue).to.equal(data);
            expect(drive.loggerIpfsPath).to.equal("0x");
            expect(drive.loggerRootHash).to.equal(ethers.constants.HashZero);
            expect(drive.provider).to.equal(ethers.constants.AddressZero);
            expect(drive.waitsProvider).to.be.false;
            expect(drive.needsLogger).to.be.false;
        });

        it("Should build larger (> 32 bytes) DirectDrive appropriately", async () => {
            const data40bytes = ethers.utils.hexlify(
                ethers.utils.toUtf8Bytes("1234567890123456789012345678901234567890")
            );
            const drivePosition = ethers.BigNumber.from("0xb000000000000000");
            const drive = await contract.buildDirectDrive(data40bytes, drivePosition);
            expect(drive.position).to.equal(drivePosition);
            expect(drive.driveLog2Size, "Log2Size should represent 64 bytes, since 40 bytes > 32 bytes").to.equal(6);
            expect(drive.directValue).to.equal(data40bytes);
            expect(drive.loggerIpfsPath).to.equal("0x");
            expect(drive.loggerRootHash).to.equal(ethers.constants.HashZero);
            expect(drive.provider).to.equal(ethers.constants.AddressZero);
            expect(drive.waitsProvider).to.be.false;
            expect(drive.needsLogger).to.be.false;
        });
    });

    // buildTurnsMetadataDrive

    describe("buildTurnsMetadataDrive", async () => {
        it("Should build empty TurnsMetadata drive appropriately", async () => {
            const drivePosition = ethers.BigNumber.from("0xa000000000000000");

            const tx = await contract.buildTurnsMetadataDrive(context, TURN_CHUNK_LOG2SIZE, drivePosition);

            const events = (await tx.wait()).events;
            const driveBuiltEvent = getEvent("DriveBuilt", contract, events);
            expect(driveBuiltEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
            const drive = driveBuiltEvent.args._drive;

            expect(drive.position).to.equal(drivePosition);
            expect(drive.driveLog2Size, "Log2Size should be the minimum value of 5 (32 bytes)").to.equal(5);
            expect(drive.directValue, "DirectValue should be an uint32 value representing count of 0 turns").to.equal(
                "0x00000000"
            );
            expect(drive.loggerIpfsPath).to.equal("0x");
            expect(drive.loggerRootHash).to.equal(ethers.constants.HashZero);
            expect(drive.provider).to.equal(ethers.constants.AddressZero);
            expect(drive.waitsProvider).to.be.false;
            expect(drive.needsLogger).to.be.false;
        });

        it("Should build TurnsMetadata drive for 2 turns appropriately", async () => {
            const drivePosition = ethers.BigNumber.from("0xb000000000000000");

            const turn0 = {
                player: player0.address,
                nextPlayer: player1.address,
                playerStake: 10,
                timestamp: Math.floor(Date.now() / 1000) - 10,
                dataLogIndices: [1],
            };
            const turn1 = {
                player: player1.address,
                nextPlayer: player0.address,
                playerStake: 15,
                timestamp: Math.floor(Date.now() / 1000),
                dataLogIndices: [2, 3],
            };
            context.turns = [turn0, turn1];

            const tx = await contract.buildTurnsMetadataDrive(context, TURN_CHUNK_LOG2SIZE, drivePosition);

            const events = (await tx.wait()).events;
            const driveBuiltEvent = getEvent("DriveBuilt", contract, events);
            expect(driveBuiltEvent.args).not.equal(undefined, "Emitted event has no arguments (unknown event type?)");
            const drive = driveBuiltEvent.args._drive;

            expect(drive.position).to.equal(drivePosition);
            expect(
                drive.driveLog2Size,
                "2 turns should amount to 168 bytes, so Log2Size should correspond to 256 bytes)"
            ).to.equal(8);
            expect(drive.loggerIpfsPath).to.equal("0x");
            expect(drive.loggerRootHash).to.equal(ethers.constants.HashZero);
            expect(drive.provider).to.equal(ethers.constants.AddressZero);
            expect(drive.waitsProvider).to.be.false;
            expect(drive.needsLogger).to.be.false;

            const turnsMetadata = buildTurnsMetadata(context.turns, TURN_CHUNK_LOG2SIZE);
            expect(drive.directValue, "Data mismatch").to.equal(turnsMetadata);
        });
    });
});

function buildTurnsMetadata(turns, turnChunkLog2Size) {
    let count = ethers.utils.hexZeroPad(turns.length, 4);

    let players = "0x";
    let nextPlayers = "0x";
    let playerStakes = "0x";
    let timestamps = "0x";
    let sizes = "0x";
    for (let turn of turns) {
        players = ethers.utils.hexConcat([players, turn.player]);
        nextPlayers = ethers.utils.hexConcat([nextPlayers, turn.nextPlayer]);
        playerStakes = ethers.utils.hexConcat([playerStakes, ethers.utils.hexZeroPad(turn.playerStake, 32)]);
        timestamps = ethers.utils.hexConcat([timestamps, ethers.utils.hexZeroPad(turn.timestamp, 4)]);
        sizes = ethers.utils.hexConcat([
            sizes,
            ethers.utils.hexZeroPad(
                ethers.BigNumber.from(turn.dataLogIndices.length * 2 ** turnChunkLog2Size).toHexString(),
                4
            ),
        ]);
    }
    const data = ethers.utils.hexConcat([count, players, nextPlayers, playerStakes, timestamps, sizes]);
    return data;
}
