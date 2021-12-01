import { describe } from "mocha";
import { expect } from "chai";
import { TestWeb3Utils } from "./TestWeb3Utils";
import { WalletWeb3 } from "../../../src/services/web3/WalletWeb3";
import { Web3Utils } from "../../../src/services/web3/Web3Utils";
import { ServiceConfig } from "../../../src/services/ServiceConfig";
import { ChainId, GameConstants } from "../../../src/GameConstants";
import { Wallet } from "../../../src/services/Wallet";
import { ethers } from "ethers";
import { PokerToken__factory } from "../../../src/types";
import PokerToken from "../../../src/abis/PokerToken.json";

describe("WalletWeb3", function () {
    const aliceAddress: string = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const bobAddress: string = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    it("should retrieve null address if there is no signer", async () => {
        ServiceConfig.setSigner(undefined);
        expect(await WalletWeb3.getAddress()).to.eql(ethers.constants.AddressZero);
    });

    it("should retrieve the correct address", async () => {
        TestWeb3Utils.setSigner(aliceAddress);
        expect(Web3Utils.compareAddresses(await WalletWeb3.getAddress(), aliceAddress)).to.be.true;

        TestWeb3Utils.setSigner(bobAddress);
        expect(Web3Utils.compareAddresses(await WalletWeb3.getAddress(), bobAddress)).to.be.true;
    });

    it("should retrieve the correct network", async () => {
        ServiceConfig.setChain(ChainId.LOCALHOST);
        expect(Wallet.getNetwork()).to.equal(GameConstants.CHAIN_NAMES[ChainId.LOCALHOST]);

        ServiceConfig.setChain(ChainId.LOCALHOST_HARDHAT);
        expect(Wallet.getNetwork()).to.equal(GameConstants.CHAIN_NAMES[ChainId.LOCALHOST_HARDHAT]);

        ServiceConfig.setChain(ChainId.MATIC_TESTNET);
        expect(Wallet.getNetwork()).to.equal(GameConstants.CHAIN_NAMES[ChainId.MATIC_TESTNET]);
    });

    it("should retrieve balance zero if there is no signer", async () => {
        ServiceConfig.setSigner(undefined);
        expect(await WalletWeb3.getBalance()).to.eql(ethers.BigNumber.from(0));
    });

    it("should retrieve the correct balance", async () => {
        // collects alice's and bob's balances
        TestWeb3Utils.setSigner(aliceAddress);
        const balanceAlice1 = await WalletWeb3.getBalance();
        TestWeb3Utils.setSigner(bobAddress);
        const balanceBob1 = await WalletWeb3.getBalance();

        // bob sends one ETH to alice
        const oneEth = ethers.utils.parseEther("1");
        const tx = await ServiceConfig.getSigner().sendTransaction({
            to: aliceAddress,
            value: oneEth,
        });
        await tx.wait();

        // collects alice's and bob's balances again
        TestWeb3Utils.setSigner(aliceAddress);
        const balanceAlice2 = await WalletWeb3.getBalance();
        TestWeb3Utils.setSigner(bobAddress);
        const balanceBob2 = await WalletWeb3.getBalance();

        // check if balances have changed as expected
        expect(balanceAlice2, "Alice should have 1 ETH more on her balance").to.eql(balanceAlice1.add(oneEth));
        expect(balanceBob2.lt(balanceBob1.sub(oneEth)), "Bob should have 1 ETH + fees less on his balance").to.be.true;
    });

    it("should retrieve POKER tokens balance zero if there is no signer", async () => {
        ServiceConfig.setSigner(undefined);
        expect(await WalletWeb3.getPokerTokens()).to.eql(ethers.BigNumber.from(0));
    });

    it("should retrieve the correct POKER tokens balance", async () => {
        // collects alice's POKER tokens balance
        TestWeb3Utils.setSigner(aliceAddress);
        const balanceAlice1 = await WalletWeb3.getPokerTokens();

        // mint 100 POKER tokens for alice (alice has minter role)
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, ServiceConfig.getSigner());
        await pokerTokenContract.mint(aliceAddress, 100);

        // collects alice's POKER tokens balance again
        const balanceAlice2 = await WalletWeb3.getPokerTokens();

        // check if balance has changed as expected
        expect(balanceAlice2, "Alice should have 100 POKER more on her balance").to.eql(balanceAlice1.add(100));
    });
});
