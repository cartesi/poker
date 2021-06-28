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
import { deployments, ethers, getUnnamedAccounts } from "hardhat";
import { solidity } from "ethereum-waffle";

import { TestTurnBasedGameUtil } from "../src/types/TestTurnBasedGameUtil";
import { TestTurnBasedGameUtil__factory } from "../src/types/factories/TestTurnBasedGameUtil__factory";

use(solidity);

describe("TurnBasedGameUtil", async () => {
    let util: TestTurnBasedGameUtil;

    beforeEach(async () => {
        const [signer] = await ethers.getSigners();

        const { deploy } = deployments;
        const TestTurnBasedGameUtil = await deploy("TestTurnBasedGameUtil", {
            from: signer.address,
            log: true,
        });

        util = TestTurnBasedGameUtil__factory.connect(TestTurnBasedGameUtil.address, signer);
    });

    // getLog2Ceil

    describe("getLog2Ceil", async () => {
        it("Should work for exact results", async () => {
            expect(await util.getLog2Ceil(4)).to.eql(2);
            expect(await util.getLog2Ceil(131072)).to.eql(17);
        });

        it("Should work for inexact results", async () => {
            expect(await util.getLog2Ceil(5)).to.eql(3);
            expect(await util.getLog2Ceil(6)).to.eql(3);
            expect(await util.getLog2Ceil(10)).to.eql(4);
            expect(await util.getLog2Ceil(131000)).to.eql(17);
            expect(await util.getLog2Ceil(131073)).to.eql(18);
        });
    });

    // bytes2bytes8

    describe("bytes2bytes8", async () => {
        it("Should require end index to be larger than start", async () => {
            await expect(util.bytes2bytes8("0x00", 1, 0)).to.be.revertedWith("end index should be larger than start");
            await expect(util.bytes2bytes8("0x00", 0, 0)).to.be.revertedWith("end index should be larger than start");
        });

        it("Should require start index to be in array's bounds", async () => {
            await expect(util.bytes2bytes8("0x00", 15, 16)).to.be.revertedWith("start index out of bounds");
        });

        it("Should require end index to be in array's bounds", async () => {
            await expect(util.bytes2bytes8("0x00", 0, 15)).to.be.revertedWith("end index out of bounds");
        });

        it("Should work for 1 byte", async () => {
            const data = "0x11";
            const result = await util.bytes2bytes8(data, 0, 1);
            expect(result).to.eql(["0x1100000000000000"]);
        });

        it("Should work for 5 bytes", async () => {
            const data = "0x1122334455";
            const result = await util.bytes2bytes8(data, 0, 5);
            expect(result).to.eql(["0x1122334455000000"]);
        });

        it("Should work for 8 bytes", async () => {
            const data = "0x1122334455667788";
            const result = await util.bytes2bytes8(data, 0, 8);
            expect(result).to.eql(["0x1122334455667788"]);
        });

        it("Should work for 10 bytes", async () => {
            const data = "0x112233445566778899aa";
            const result = await util.bytes2bytes8(data, 0, 10);
            expect(result).to.eql(["0x1122334455667788", "0x99aa000000000000"]);
        });

        it("Should work for 16 bytes", async () => {
            const data = "0x112233445566778899aabbccddeeff11";
            const result = await util.bytes2bytes8(data, 0, 16);
            expect(result).to.eql(["0x1122334455667788", "0x99aabbccddeeff11"]);
        });

        it("Should work for 17 bytes", async () => {
            const data = "0x112233445566778899aabbccddeeff1122";
            const result = await util.bytes2bytes8(data, 0, 17);
            expect(result).to.eql(["0x1122334455667788", "0x99aabbccddeeff11", "0x2200000000000000"]);
        });

        it("Should work for 5 bytes within 10", async () => {
            const data = "0x112233445566778899aa";
            const result = await util.bytes2bytes8(data, 3, 8);
            expect(result).to.eql(["0x4455667788000000"]);
        });

        it("Should work for 8 bytes within 10", async () => {
            const data = "0x112233445566778899aa";
            const result = await util.bytes2bytes8(data, 0, 8);
            expect(result).to.eql(["0x1122334455667788"]);
        });

        it("Should work for 10 bytes out of 17", async () => {
            const data = "0x112233445566778899aabbccddeeff1122";
            const result = await util.bytes2bytes8(data, 3, 13);
            expect(result).to.eql(["0x445566778899aabb", "0xccdd000000000000"]);
        });
    });

    // checkResult

    describe("checkResult", async () => {
        it("Should check number of players", async () => {
            await expect(util.checkResult([100, 100], [100, 100, 100])).to.be.revertedWith(
                "Resulting funds distribution does not match number of players in the game"
            );
            await expect(util.checkResult([100, 100], [100])).to.be.revertedWith(
                "Resulting funds distribution does not match number of players in the game"
            );
            await expect(util.checkResult([100, 100, 100], [100, 100, 100, 100])).to.be.revertedWith(
                "Resulting funds distribution does not match number of players in the game"
            );
            await expect(util.checkResult([100, 100, 100], [100, 100, 100])).not.to.be.reverted;
        });

        it("Should check for excessive funds share", async () => {
            await expect(util.checkResult([100, 100], [100, 110])).to.be.revertedWith(
                "Resulting funds distribution exceeds amount locked by the players for the game"
            );
            await expect(util.checkResult([100, 100], [50, 151])).to.be.revertedWith(
                "Resulting funds distribution exceeds amount locked by the players for the game"
            );
            await expect(util.checkResult([100, 100], [201, 0])).to.be.revertedWith(
                "Resulting funds distribution exceeds amount locked by the players for the game"
            );
            await expect(util.checkResult([100, 100], [100, 100])).not.to.be.reverted;
            await expect(util.checkResult([100, 100], [0, 200])).not.to.be.reverted;
            await expect(util.checkResult([100, 100], [10, 10])).not.to.be.reverted;
            await expect(util.checkResult([100, 100], [0, 0])).not.to.be.reverted;
        });

        it("Should return funds to burn", async () => {
            expect(await util.checkResult([100, 100], [100, 100])).to.eql(ethers.BigNumber.from(0));
            expect(await util.checkResult([100, 100], [100, 0])).to.eql(ethers.BigNumber.from(100));
            expect(await util.checkResult([100, 100], [200, 0])).to.eql(ethers.BigNumber.from(0));
            expect(await util.checkResult([100, 100], [40, 140])).to.eql(ethers.BigNumber.from(20));
        });
    });

    // updateClaimAgreementMask

    describe("updateClaimAgreementMask", async () => {
        it("Should set player0 agreement correctly", async () => {
            const [player0, player1, player2] = await getUnnamedAccounts();
            expect(await util.updateClaimAgreementMask(0, [player0, player1, player2], player0)).to.eql(
                ethers.BigNumber.from(1)
            );
        });

        it("Should set player1 agreement correctly", async () => {
            const [player0, player1, player2] = await getUnnamedAccounts();
            expect(await util.updateClaimAgreementMask(0, [player0, player1, player2], player1)).to.eql(
                ethers.BigNumber.from(2)
            );
        });

        it("Should set player2 agreement correctly", async () => {
            const [player0, player1, player2] = await getUnnamedAccounts();
            expect(await util.updateClaimAgreementMask(0, [player0, player1, player2], player2)).to.eql(
                ethers.BigNumber.from(4)
            );
        });

        it("Should set sequential agreements correctly", async () => {
            const [player0, player1, player2] = await getUnnamedAccounts();
            let mask = ethers.BigNumber.from(0);
            mask = await util.updateClaimAgreementMask(mask, [player0, player1, player2], player2);
            expect(mask).to.eql(ethers.BigNumber.from(4));
            mask = await util.updateClaimAgreementMask(mask, [player0, player1, player2], player0);
            expect(mask).to.eql(ethers.BigNumber.from(5));
            mask = await util.updateClaimAgreementMask(mask, [player0, player1, player2], player1);
            expect(mask).to.eql(ethers.BigNumber.from(7));
        });

        it("Should ignore unknown player agreement", async () => {
            const [player0, player1, player2, player3] = await getUnnamedAccounts();
            expect(await util.updateClaimAgreementMask(2, [player0, player1, player2], player3)).to.eql(
                ethers.BigNumber.from(2)
            );
        });

        it("Should ignore if player agrees twice", async () => {
            const [player0, player1, player2] = await getUnnamedAccounts();
            let mask = ethers.BigNumber.from(0);
            mask = await util.updateClaimAgreementMask(mask, [player0, player1, player2], player2);
            expect(mask).to.eql(ethers.BigNumber.from(4));
            mask = await util.updateClaimAgreementMask(mask, [player0, player1, player2], player2);
            expect(mask).to.eql(ethers.BigNumber.from(4));
        });
    });
});
