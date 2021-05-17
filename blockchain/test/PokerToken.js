// Copyright 2020 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("PokerToken", () => {

    before(async () => {
        this.PokerTokenFactory = await ethers.getContractFactory("PokerToken");
    });

    beforeEach(async () => {
        this.pokerToken = await this.PokerTokenFactory.deploy();
        await this.pokerToken.deployed();
    });

    // MINT

    it('MintToken: Should NOT have any token amount stored before contract owner do a mint', async () => {
        expect((await this.pokerToken.totalSupply()).toString()).to.equal('0');
    });

    it('MintToken: Should the contract owner be able to mint tokens and transfer it to another user', async () => {
        // Do nothing
    });

    it('MintToken: Should NOT allow users without MINT_ROLE be able to mint tokens and transfer it to another user', async () => {
        // Do nothing
    });

    // APPROVE AND ALLOWANCE

    // => TO BE DEFINED

    // TRANFER

    it('TransferToken: Should allow a user A to transfer some of its tokens to a user B', async () => {
        // Do nothing
    });

    it('TransferToken: Should NOT allow a user A to transfer tokens from another user B', async () => {
        // Do nothing
    });
});
