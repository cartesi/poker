import { describe } from "mocha";
import { expect } from "chai";
import { GameConstants, ChainId } from "../../../src/GameConstants";
import { ProviderType, ServiceConfig } from "../../../src/services/ServiceConfig";
import { PokerToken__factory } from "../../../src/types";
import PokerToken from "../../../src/abis/PokerToken.json";
import TurnBasedGameLobby from "../../../src/abis/TurnBasedGameLobby.json";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";
import { TestWeb3Utils } from "./TestWeb3Utils";

describe("LobbyWeb3", function () {
    // creates a service config instance
    new ServiceConfig(ProviderType.JsonRpc);

    const aliceAddress: string = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const bobAddress: string = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    this.timeout(60000);

    beforeEach(async () => {
        ServiceConfig.currentInstance.setChain(ChainId.LOCALHOST_HARDHAT);

        TestWeb3Utils.setSigner(aliceAddress);
        const aliceSigner = ServiceConfig.getSigner();

        TestWeb3Utils.setSigner(bobAddress);
        const bobSigner = ServiceConfig.getSigner();

        const pokerTokenContractAlice = PokerToken__factory.connect(PokerToken.address, aliceSigner);
        const pokerTokenContractBob = PokerToken__factory.connect(PokerToken.address, bobSigner);

        // Mint tokens (Alice has minter role) for players
        await pokerTokenContractAlice.mint(aliceAddress, GameConstants.MIN_FUNDS);
        await pokerTokenContractAlice.mint(bobAddress, GameConstants.MIN_FUNDS);

        // Setup for Alice
        let aliceFunds = await pokerTokenContractAlice.balanceOf(aliceAddress);
        await pokerTokenContractAlice.approve(TurnBasedGameLobby.address, aliceFunds);

        // Setup for Bob
        let bobFunds = await pokerTokenContractBob.balanceOf(bobAddress);
        await pokerTokenContractBob.approve(TurnBasedGameLobby.address, bobFunds);
    });

    it("should notify game ready when the correct number of players have joined", async () => {
        const player1Info = { name: "Alice", avatar: 1 };
        const player2Info = { name: "Bob", avatar: 2 };

        // Creates a promise that will only be resolved when gameReady callback for player 1 is called
        let gameReadyResolverPlayer1: (boolean) => void;
        const promiseIsGameReadyPlayer1: Promise<boolean> = new Promise<boolean>((resolve: (boolean) => void) => {
            gameReadyResolverPlayer1 = resolve;
        });

        // Creates a promise that will only be resolved when gameReady callback for player 2 is called
        let gameReadyResolverPlayer2: (boolean) => void;
        const promiseIsGameReadyPlayer2: Promise<boolean> = new Promise<boolean>((resolve: (boolean) => void) => {
            gameReadyResolverPlayer2 = resolve;
        });

        // Player 1 joins the game
        TestWeb3Utils.setSigner(aliceAddress);
        let gameReadyCallbackPlayer1 = function (index, context) {
            gameReadyResolverPlayer1(true);
            console.log("gameReadyCallbackPlayer1 was called with index=" + index);
        };
        LobbyWeb3.joinGame(player1Info, gameReadyCallbackPlayer1);

        // Player 2 joins the game
        TestWeb3Utils.setSigner(bobAddress);

        let gameReadyCallbackPlayer2 = function (index, context) {
            gameReadyResolverPlayer2(true);
            console.log("gameReadyCallbackPlayer2 was called with index=" + index);
        };
        LobbyWeb3.joinGame(player2Info, gameReadyCallbackPlayer2);

        // Check if game ready callback was called for player 1
        await promiseIsGameReadyPlayer1.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });
        // Check if game ready callback was called for player 2
        await promiseIsGameReadyPlayer2.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });
    });
});
