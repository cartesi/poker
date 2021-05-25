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
import { solidity } from "ethereum-waffle";

import { SignerWithAddress } from "hardhat-deploy-ethers/dist/src/signer-with-address";

import { PokerToken } from "../src/types/PokerToken";
import { PokerToken__factory } from "../src/types/factories/PokerToken__factory";

use(solidity);

describe("PokerToken", () => {
    const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
    const NO_AMOUNT = 0;
    const DEFAULT_AMOUNT = 50;
    const ALLOWED_AMOUNT = 100;

    let pokerTokenContract: PokerToken;
    let owner: SignerWithAddress;
    let holder1: SignerWithAddress;
    let holder2: SignerWithAddress;
    let spender: SignerWithAddress;

    beforeEach(async () => {
        [owner, holder1, holder2, spender] = await ethers.getSigners();

        await deployments.fixture(); // reset contract to initial state

        const PokerToken = await deployments.get("PokerToken");
        pokerTokenContract = PokerToken__factory.connect(PokerToken.address, owner);
    });

    // INITIAL STATE
    describe("Initial State", async () => {
        const NO_DECIMALS = 0;

        it("Should have 'name', 'symbol' and decimals setup", async () => {
            expect(await pokerTokenContract.name()).to.equal("Cartesi Poker Token");
            expect(await pokerTokenContract.symbol()).to.equal("CTPT");
            expect(await pokerTokenContract.decimals()).to.equal(NO_DECIMALS);
        });

        it("Should have ZERO supply and not be paused", async () => {
            expect(await pokerTokenContract.totalSupply()).to.equal(NO_AMOUNT);
            expect(await pokerTokenContract.paused()).to.equal(false);
        });

        it("Should have an owner account(contract deployer) granted with ADMIN_ROLE", async () => {
            const isAdmin = await pokerTokenContract.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress());
            expect(isAdmin).to.equal(true);
        });
    });

    // MINT
    describe("Mint", () => {
        it("Should allow the contract owner to mint and transfer tokens to another accounts", async () => {
            await pokerTokenContract.mint(await holder1.getAddress(), DEFAULT_AMOUNT);
            const holderAmount = await pokerTokenContract.balanceOf(await holder1.getAddress());
            expect(DEFAULT_AMOUNT).to.equal(holderAmount);
        });

        it("Should NOT allow non admin users to mint and transfer tokens to another accounts", async () => {
            // holder1 is not admin
            const isAdmin = await pokerTokenContract.hasRole(DEFAULT_ADMIN_ROLE, await holder1.getAddress());
            expect(isAdmin).to.equal(false);

            // holder2 has no tokens
            const amountBeforeTransfer = await pokerTokenContract.balanceOf(await holder2.getAddress());
            expect(amountBeforeTransfer).to.equal(NO_AMOUNT);

            // holder1 cannot mint tokens and transfer to holder2
            await expect(pokerTokenContract.connect(holder1).mint(await holder2.getAddress(), DEFAULT_AMOUNT)).to.be
                .reverted;

            // holder2 continue with no tokens
            const amountAfterTransfer = await pokerTokenContract.balanceOf(await holder2.getAddress());
            expect(amountAfterTransfer).to.equal(NO_AMOUNT);
        });
    });

    // APPROVE AND ALLOWANCE
    describe("Approve and Allowance", () => {
        it("Should emit approval event when the allowance of a spender for an holder tokens is set", async () => {
            let spenderAddr: string = await spender.getAddress();
            let holder1Addr: string = await holder1.getAddress();
            await expect(pokerTokenContract.connect(holder1).approve(spenderAddr, ALLOWED_AMOUNT))
                .to.emit(pokerTokenContract, "Approval")
                .withArgs(holder1Addr, spenderAddr, ALLOWED_AMOUNT);
        });
    });

    // TRANFER
    describe("Transfer", () => {
        it("Should allow spender contract get tokens from an holder account INSIDE allowance limit", async () => {
            // holder1 obtain tokens
            await pokerTokenContract.mint(await holder1.getAddress(), ALLOWED_AMOUNT);

            // holder1 approve an spender account to get it's tokens
            await pokerTokenContract.connect(holder1).approve(await spender.getAddress(), ALLOWED_AMOUNT);

            // spender(lobby contract) account transfers tokens from holder1(player) to a holder2(game contract)
            await pokerTokenContract.connect(spender).transferFrom(holder1.address, holder2.address, ALLOWED_AMOUNT);

            expect(await pokerTokenContract.balanceOf(holder1.address)).to.equal(NO_AMOUNT);
            expect(await pokerTokenContract.balanceOf(holder2.address)).to.equal(ALLOWED_AMOUNT);
            expect(await pokerTokenContract.balanceOf(spender.address)).to.equal(NO_AMOUNT);
        });

        it("Should NOT allow spender contract get tokens from an holder account BEYOND allowance limit", async () => {
            await pokerTokenContract.mint(await holder1.getAddress(), ALLOWED_AMOUNT);

            await pokerTokenContract.connect(holder1).approve(await spender.getAddress(), ALLOWED_AMOUNT);

            await expect(
                pokerTokenContract.connect(spender).transferFrom(holder1.address, spender.address, 2 * ALLOWED_AMOUNT)
            ).to.be.reverted;
            expect(await pokerTokenContract.balanceOf(holder1.address)).to.equal(ALLOWED_AMOUNT);
        });
    });
});
