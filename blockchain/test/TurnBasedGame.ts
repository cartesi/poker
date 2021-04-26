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
import { TurnBasedGame__factory } from "../src/types/factories/TurnBasedGame__factory";

use(solidity);

describe("TurnBasedGame", async () => {
    let instance: TurnBasedGame;
    let mockDescartes: MockContract;
    let mockLogger: MockContract;
    const EMPTY_DATA_LOG_HASH: string = "0x8e7a427fa943d9966b389f4f257173676090c6e95f43e2cb6d65f8758111e309";
    const EMPTY_DATA_LOG_INDEX: number = 1;

    beforeEach(async () => {
        const [signer] = await ethers.getSigners();

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

        instance = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
    });

    it("instantiation", async () => {});
});
