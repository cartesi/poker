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
import { Signer } from "ethers";

import { PokerToken } from "../src/types/PokerToken";
import { PokerToken__factory } from "../src/types/factories/PokerToken__factory";
import { PokerTokenFaucet } from "../src/types/PokerTokenFaucet";
import { PokerTokenFaucet__factory } from "../src/types/factories/PokerTokenFaucet__factory";

use(solidity);

describe("PokerTokenFaucet", () => {
    let pokerTokenContract: PokerToken;
    let pokerTokenFaucetContract: PokerTokenFaucet;
    let owner: Signer;
    let holder1: Signer;
    let holder2: Signer;
    let TOKEN_AMOUNT;

    beforeEach(async () => {
        [owner, holder1, holder2] = await ethers.getSigners();

        await deployments.fixture(); // reset contract to initial state

        const PokerToken = await deployments.get("PokerToken");
        pokerTokenContract = PokerToken__factory.connect(PokerToken.address, owner);

        const PokerTokenFaucet = await deployments.get("PokerTokenFaucet");
        pokerTokenFaucetContract = PokerTokenFaucet__factory.connect(PokerTokenFaucet.address, owner);

        TOKEN_AMOUNT = await pokerTokenFaucetContract.TOKEN_AMOUNT();
    });

    it("Should provide tokens when requested", async () => {
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(ethers.BigNumber.from(0));
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(ethers.BigNumber.from(0));

        await pokerTokenContract.mint(pokerTokenFaucetContract.address, 10 * TOKEN_AMOUNT);

        // requests tokens for holder1
        await pokerTokenFaucetContract.connect(holder1).requestTokens();
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(
            ethers.BigNumber.from(TOKEN_AMOUNT)
        );
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(ethers.BigNumber.from(0));

        // requests tokens for holder2
        await pokerTokenFaucetContract.connect(holder2).requestTokens();
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(
            ethers.BigNumber.from(TOKEN_AMOUNT)
        );
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(
            ethers.BigNumber.from(TOKEN_AMOUNT)
        );

        // requests more tokens for holder2
        await pokerTokenFaucetContract.connect(holder2).requestTokens();
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(
            ethers.BigNumber.from(TOKEN_AMOUNT)
        );
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(
            ethers.BigNumber.from(2 * TOKEN_AMOUNT)
        );
    });

    it("Should revert if faucet does not have enough tokens", async () => {
        // nothing in the faucet
        await expect(pokerTokenFaucetContract.requestTokens()).to.be.revertedWith(
            "ERC20: transfer amount exceeds balance"
        );

        // enough tokens for a single request
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, TOKEN_AMOUNT);
        await expect(pokerTokenFaucetContract.requestTokens()).not.to.be.reverted;
        await expect(pokerTokenFaucetContract.requestTokens()).to.be.revertedWith(
            "ERC20: transfer amount exceeds balance"
        );
    });
});
