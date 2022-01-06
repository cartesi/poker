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

    beforeEach(async () => {
        [owner, holder1, holder2] = await ethers.getSigners();

        await deployments.fixture(); // reset contract to initial state

        const PokerToken = await deployments.get("PokerToken");
        pokerTokenContract = PokerToken__factory.connect(PokerToken.address, owner);

        const PokerTokenFaucet = await deployments.get("PokerTokenFaucet");
        pokerTokenFaucetContract = PokerTokenFaucet__factory.connect(PokerTokenFaucet.address, owner);
    });

    it("Should only allow owner to request tokens", async () => {
        const tokensAmount = await pokerTokenFaucetContract.getRequestTokensAmount();
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, tokensAmount.mul(10));

        await expect(
            pokerTokenFaucetContract.connect(holder1).requestTokens(await holder1.getAddress())
        ).to.be.revertedWith("Only faucet owner can call method");
        await expect(
            pokerTokenFaucetContract.connect(holder2).requestTokens(await holder1.getAddress())
        ).to.be.revertedWith("Only faucet owner can call method");
        await expect(pokerTokenFaucetContract.requestTokens(await holder1.getAddress())).not.to.be.reverted;
    });

    it("Should provide tokens when requested", async () => {
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(ethers.BigNumber.from(0));
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(ethers.BigNumber.from(0));

        const tokensAmount = await pokerTokenFaucetContract.getRequestTokensAmount();
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, tokensAmount.mul(10));

        // requests tokens for holder1
        await pokerTokenFaucetContract.requestTokens(await holder1.getAddress());
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(tokensAmount);
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(ethers.constants.Zero);

        // requests tokens for holder2
        await pokerTokenFaucetContract.requestTokens(await holder2.getAddress());
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(tokensAmount);
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(tokensAmount);

        // requests more tokens for holder2
        await pokerTokenFaucetContract.requestTokens(await holder2.getAddress());
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(tokensAmount);
        expect(await pokerTokenContract.balanceOf(await holder2.getAddress())).to.eql(tokensAmount.mul(2));
    });

    it("Should allow owner to set amount retrieved when requesting tokens", async () => {
        const newAmount = ethers.BigNumber.from(500);

        await expect(pokerTokenFaucetContract.connect(holder2).setRequestTokensAmount(newAmount)).to.be.revertedWith(
            "Only faucet owner can call method"
        );

        await expect(pokerTokenFaucetContract.setRequestTokensAmount(newAmount)).not.to.be.reverted;
        expect(await pokerTokenFaucetContract.getRequestTokensAmount()).to.eql(newAmount);

        // test if new amount is actually used
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(ethers.constants.Zero);
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, newAmount);
        await pokerTokenFaucetContract.requestTokens(await holder1.getAddress());
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(newAmount);
    });

    it("Should revert if faucet does not have enough tokens", async () => {
        // nothing in the faucet
        await expect(pokerTokenFaucetContract.requestTokens(await holder1.getAddress())).to.be.revertedWith(
            "Insufficient tokens in faucet"
        );

        // enough tokens for a single request
        const tokensAmount = await pokerTokenFaucetContract.getRequestTokensAmount();
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, tokensAmount);
        await expect(pokerTokenFaucetContract.requestTokens(await holder1.getAddress())).not.to.be.reverted;
        await expect(pokerTokenFaucetContract.requestTokens(await holder1.getAddress())).to.be.revertedWith(
            "Insufficient tokens in faucet"
        );
    });

    it("Should only allow owner to request network funds (ETH)", async () => {
        const fundsAmount = await pokerTokenFaucetContract.getRequestFundsAmount();
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: fundsAmount.mul(10) });

        await expect(
            pokerTokenFaucetContract.connect(holder1).requestFunds(await holder1.getAddress())
        ).to.be.revertedWith("Only faucet owner can call method");
        await expect(
            pokerTokenFaucetContract.connect(holder2).requestFunds(await holder1.getAddress())
        ).to.be.revertedWith("Only faucet owner can call method");
        await expect(pokerTokenFaucetContract.requestFunds(await holder1.getAddress())).not.to.be.reverted;
    });

    it("Should provide network funds (ETH) when requested", async () => {
        // setup funds in faucet
        const fundsAmount = await pokerTokenFaucetContract.getRequestFundsAmount();
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: fundsAmount.mul(10) });
        expect(await ethers.provider.getBalance(pokerTokenFaucetContract.address)).to.eql(fundsAmount.mul(10));

        const balanceHolder1 = await holder1.getBalance();
        const balanceHolder2 = await holder2.getBalance();

        // requests funds for holder1
        await pokerTokenFaucetContract.requestFunds(await holder1.getAddress());
        const balanceHolder1_step1 = await holder1.getBalance();
        const balanceHolder2_step1 = await holder2.getBalance();
        expect(balanceHolder1_step1.eq(balanceHolder1.add(fundsAmount))).to.be.true;
        expect(balanceHolder2_step1.eq(balanceHolder2)).to.be.true;

        // requests funds for holder2
        await pokerTokenFaucetContract.requestFunds(await holder2.getAddress());
        const balanceHolder1_step2 = await holder1.getBalance();
        const balanceHolder2_step2 = await holder2.getBalance();
        expect(balanceHolder1_step2.eq(balanceHolder1_step1)).to.be.true;
        expect(balanceHolder2_step2.eq(balanceHolder2_step1.add(fundsAmount))).to.be.true;

        // requests more funds for holder2
        await pokerTokenFaucetContract.requestFunds(await holder2.getAddress());
        const balanceHolder1_step3 = await holder1.getBalance();
        const balanceHolder2_step3 = await holder2.getBalance();
        expect(balanceHolder1_step3.eq(balanceHolder1_step2)).to.be.true;
        expect(balanceHolder2_step3.eq(balanceHolder2_step2.add(fundsAmount))).to.be.true;
    });

    it("Should allow owner to set amount retrieved when requesting network funds (ETH)", async () => {
        const newAmount = ethers.utils.parseEther("1.3");

        await expect(pokerTokenFaucetContract.connect(holder2).setRequestFundsAmount(newAmount)).to.be.revertedWith(
            "Only faucet owner can call method"
        );

        await expect(pokerTokenFaucetContract.setRequestFundsAmount(newAmount)).not.to.be.reverted;
        expect(await pokerTokenFaucetContract.getRequestFundsAmount()).to.eql(newAmount);

        // test if new amount is actually used
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: newAmount });
        const balanceHolder2 = await holder2.getBalance();
        await pokerTokenFaucetContract.requestFunds(await holder2.getAddress());
        expect(await holder2.getBalance()).to.eql(balanceHolder2.add(newAmount));
    });

    it("Should revert if faucet does not have enough funds", async () => {
        // nothing in the faucet
        await expect(pokerTokenFaucetContract.requestFunds(await holder1.getAddress())).to.be.revertedWith(
            "Insufficient funds in faucet"
        );

        // enough funds for a single request
        const fundsAmount = await pokerTokenFaucetContract.getRequestFundsAmount();
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: fundsAmount });
        await expect(pokerTokenFaucetContract.requestFunds(await holder1.getAddress())).not.to.be.reverted;
        await expect(pokerTokenFaucetContract.requestFunds(await holder1.getAddress())).to.be.revertedWith(
            "Insufficient funds in faucet"
        );
    });

    it("Should only allow owner to set suspended state", async () => {
        // should not be suspended when started
        expect(await pokerTokenFaucetContract.isSuspended()).to.be.false;
        await expect(pokerTokenFaucetContract.connect(holder1).setSuspended(true)).to.be.revertedWith(
            "Only faucet owner can call method"
        );
        await expect(pokerTokenFaucetContract.setSuspended(true)).not.to.be.reverted;
        await pokerTokenFaucetContract.setSuspended(true);
        expect(await pokerTokenFaucetContract.isSuspended()).to.be.true;
        await pokerTokenFaucetContract.setSuspended(false);
        expect(await pokerTokenFaucetContract.isSuspended()).to.be.false;
    });

    it("Should only allow owner to register coupons", async () => {
        const coupon = "xyz";
        const couponHash = ethers.utils.solidityKeccak256(["string"], [coupon]);
        await expect(pokerTokenFaucetContract.connect(holder1).registerCoupon(couponHash)).to.be.revertedWith(
            "Only faucet owner can call method"
        );
        await expect(pokerTokenFaucetContract.registerCoupon(couponHash)).not.to.be.reverted;
    });

    it("Should not allow a coupon to be registered more than once", async () => {
        const coupon = "xyz";
        const couponHash = ethers.utils.solidityKeccak256(["string"], [coupon]);
        await expect(pokerTokenFaucetContract.registerCoupon(couponHash)).not.to.be.reverted;
        await expect(pokerTokenFaucetContract.registerCoupon(couponHash)).to.be.revertedWith(
            "Coupon already registered"
        );
    });

    it("Should not allow coupons to be redeemed when faucet is suspended", async () => {
        const coupon = "xyz";
        await pokerTokenFaucetContract.setSuspended(true);
        await expect(
            pokerTokenFaucetContract.connect(holder1).redeemCoupon(coupon, await holder1.getAddress())
        ).to.be.revertedWith("Faucet is suspended");
    });

    it("Should not allow coupons to be redeemed when faucet has insufficient tokens", async () => {
        const fundsAmount = await pokerTokenFaucetContract.getRequestFundsAmount();
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: fundsAmount.mul(10) });

        const coupon = "xyz";
        const couponHash = ethers.utils.solidityKeccak256(["string"], [coupon]);

        await pokerTokenFaucetContract.registerCoupon(couponHash);
        await expect(
            pokerTokenFaucetContract.connect(holder1).redeemCoupon(coupon, await holder1.getAddress())
        ).to.be.revertedWith("Insufficient tokens in faucet");
    });

    it("Should not allow coupons to be redeemed when faucet has insufficient network funds (ETH)", async () => {
        const tokensAmount = await pokerTokenFaucetContract.getRequestTokensAmount();
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, tokensAmount.mul(10));

        const coupon = "xyz";
        const couponHash = ethers.utils.solidityKeccak256(["string"], [coupon]);

        await pokerTokenFaucetContract.registerCoupon(couponHash);
        await expect(
            pokerTokenFaucetContract.connect(holder1).redeemCoupon(coupon, await holder1.getAddress())
        ).to.be.revertedWith("Insufficient funds in faucet");
    });

    it("Should only allow registered coupons to be redeemed once", async () => {
        // prepares faucet with enough tokens and funds
        const tokensAmount = await pokerTokenFaucetContract.getRequestTokensAmount();
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, tokensAmount.mul(10));
        const fundsAmount = await pokerTokenFaucetContract.getRequestFundsAmount();
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: fundsAmount.mul(10) });

        // creates coupon info
        const coupon = "xyz";
        const couponHash = ethers.utils.solidityKeccak256(["string"], [coupon]);

        // should fail to redeem an unregistered coupon
        await expect(
            pokerTokenFaucetContract.connect(holder1).redeemCoupon(couponHash, await holder1.getAddress())
        ).to.be.revertedWith("Coupon not registered");

        // should succeed to register coupon and then redeem it
        await pokerTokenFaucetContract.registerCoupon(couponHash);
        await expect(pokerTokenFaucetContract.connect(holder1).redeemCoupon(coupon, await holder1.getAddress())).not.to
            .be.reverted;

        // should fail to redeem the coupon a 2nd time
        await expect(
            pokerTokenFaucetContract.connect(holder1).redeemCoupon(coupon, await holder1.getAddress())
        ).to.be.revertedWith("Coupon not registered");

        // should be able to register coupon and redeem it again
        await pokerTokenFaucetContract.registerCoupon(couponHash);
        await expect(pokerTokenFaucetContract.connect(holder1).redeemCoupon(coupon, await holder1.getAddress())).not.to
            .be.reverted;
    });

    it("Should transfer expected tokens and funds and emit event when redeeming a coupon", async () => {
        // prepares faucet with enough tokens and funds
        const tokensAmount = await pokerTokenFaucetContract.getRequestTokensAmount();
        await pokerTokenContract.mint(pokerTokenFaucetContract.address, tokensAmount.mul(10));
        const fundsAmount = await pokerTokenFaucetContract.getRequestFundsAmount();
        await holder1.sendTransaction({ to: pokerTokenFaucetContract.address, value: fundsAmount.mul(10) });

        // creates coupon info
        const coupon = "xyz";
        const couponHash = ethers.utils.solidityKeccak256(["string"], [coupon]);

        // checks/collects tokens and funds balances
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(ethers.constants.Zero);
        const balanceHolder1 = await holder1.getBalance();

        // registers and redeems a coupon
        await pokerTokenFaucetContract.registerCoupon(couponHash);
        await expect(pokerTokenFaucetContract.connect(holder2).redeemCoupon(coupon, await holder1.getAddress()))
            .to.emit(pokerTokenFaucetContract, "CouponRedeemed")
            .withArgs(coupon, await holder1.getAddress(), tokensAmount, fundsAmount);

        // tokens and funds balances should have increased
        expect(await pokerTokenContract.balanceOf(await holder1.getAddress())).to.eql(tokensAmount);
        expect(await holder1.getBalance()).to.eql(balanceHolder1.add(fundsAmount));
    });
});
