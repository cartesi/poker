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
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { MockContract, deployMockContract, solidity } from "ethereum-waffle";

import { PokerToken } from "../src/types/PokerToken";
import { PokerToken__factory } from "../src/types/factories/PokerToken__factory";

import { TurnBasedGameLobby } from "../src/types/TurnBasedGameLobby";
import { TurnBasedGameLobby__factory } from "../src/types/factories/TurnBasedGameLobby__factory";

use(solidity);

describe("TurnBasedGameLobby", async () => {
    let pokerTokenContract: PokerToken;
    let lobbyContract: TurnBasedGameLobby;
    let lobbyContractPlayer1: TurnBasedGameLobby;
    let mockGameContract: MockContract;

    const gameTemplateHash = "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa";
    const gameMetadata = "0x";
    const gameTimeout = ethers.BigNumber.from(10);
    const playerFunds = [ethers.BigNumber.from(100), ethers.BigNumber.from(100)];
    const playerInfos = [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Alice")),
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Bob")),
    ];
    const minFunds = 100;

    let signer;
    let player1;
    let nonPlayer;

    let players;
    let validators;

    beforeEach(async () => {
        [signer, player1, nonPlayer] = await ethers.getSigners();

        const { alice, bob } = await getNamedAccounts();
        players = [alice, bob];
        validators = players;

        await deployments.fixture(); // reset contracts to initial state

        // Get previously deployed PokerToken contract
        const pokerToken = await deployments.get("PokerToken");

        // Get a mock for Game contract
        const TurnBasedGame = await deployments.getArtifact("TurnBasedGame");
        mockGameContract = await deployMockContract(signer, TurnBasedGame.abi);

        // Deploy game lobby contract
        const { deploy } = deployments;
        const TurnBasedGameLobby = await deploy("TurnBasedGameLobby", {
            from: signer.address,
            log: true,
            args: [pokerToken.address, mockGameContract.address],
        });

        // Get lobby contract instance
        lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobby.address, signer);

        // Connect player1(Bob) to lobby contract
        lobbyContractPlayer1 = lobbyContract.connect(player1);

        // Mint tokens for signer(Alice) and player1(Bob)
        // Using 2xminFunds because a player can joinGame more than one game table.
        // Our tests explored only the situation when player join two game tables.
        // If a test need a scenario with more than 2 game table, minting must be
        // adjusted to an appropriate amount.
        pokerTokenContract = PokerToken__factory.connect(pokerToken.address, signer);
        await pokerTokenContract.mint(await signer.getAddress(), 2 * minFunds);
        await pokerTokenContract.mint(await player1.getAddress(), 2 * minFunds);

        // Set up approval for lobby contract spend tokens on behalf of signer(Alice) and player1(Bob)
        await pokerTokenContract.connect(signer).approve(TurnBasedGameLobby.address, 2 * minFunds);
        await pokerTokenContract.connect(player1).approve(TurnBasedGameLobby.address, 2 * minFunds);
    });

    // GET QUEUE
    describe("getQueue", async () => {
        it("Should be empty at first", async () => {
            expect(
                await lobbyContract.getQueue(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address
                )
            ).to.eql([]);
        });
    });

    // LEAVE QUEUE
    describe("leaveQueue", async () => {
        it("Should do nothing for an empty queue", async () => {
            await lobbyContract.leaveQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );
            expect(
                await lobbyContract.getQueue(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address
                )
            ).to.eql([]);
        });

        it("Should remove player if in queue", async () => {
            // player0 joins
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                minFunds,
                playerInfos[0]
            );
            // player0 leaves
            await lobbyContract.leaveQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );
            // queue should be empty
            expect(
                await lobbyContract.getQueue(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address
                )
            ).to.eql([]);
        });

        it("Should remove player if in queue: 3 player game removing 1st player in queue", async () => {
            // player0 joins
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address,
                minFunds,
                playerInfos[0]
            );
            // player1 joins
            await lobbyContractPlayer1.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address,
                minFunds,
                playerInfos[1]
            );
            // player0 leaves
            await lobbyContract.leaveQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address
            );
            // retrieve queue and check that player1 is still there
            const queuedPlayers = await lobbyContract.getQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address
            );
            expect(queuedPlayers.length).to.eql(1);
            expect(queuedPlayers[0].addr).to.eql(players[1]);
        });

        it("Should remove player if in queue: 3 player game removing 2nd player in queue", async () => {
            // player0 joins
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address,
                minFunds,
                playerInfos[0]
            );
            // player1 joins
            await lobbyContractPlayer1.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address,
                minFunds,
                playerInfos[1]
            );
            // player1 leaves
            await lobbyContractPlayer1.leaveQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address
            );
            // retrieve queue and check that player0 is still there
            const queuedPlayers = await lobbyContract.getQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                3,
                minFunds,
                pokerTokenContract.address
            );
            expect(queuedPlayers.length).to.eql(1);
            expect(queuedPlayers[0].addr).to.eql(players[0]);
        });

        it("Should do nothing if player is not in queue", async () => {
            // player0 joins
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                minFunds,
                playerInfos[0]
            );
            // player1 leaves
            await lobbyContractPlayer1.leaveQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );
            // retrieve queue and check that player0 is still there
            const queuedPlayers = await lobbyContract.getQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );
            expect(queuedPlayers.length).to.eql(1);
            expect(queuedPlayers[0].addr).to.eql(players[0]);
        });
    });

    // JOIN GAME
    describe("joinGame", async () => {
        it("Should not be allowed if player funds are less than the minimum required", async () => {
            await expect(
                lobbyContract.joinGame(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address,
                    minFunds - 1,
                    playerInfos[0]
                )
            ).to.be.revertedWith("Player's staked funds is insufficient to join the game");
        });

        it("Should allow if player funds are greater or equal than the minimum required", async () => {
            await expect(
                lobbyContract.joinGame(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address,
                    minFunds,
                    playerInfos[0]
                )
            ).not.to.be.reverted;
        });

        it("Should not allow player to join game more than once", async () => {
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            await expect(
                lobbyContract.joinGame(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address,
                    minFunds,
                    playerInfos[0]
                )
            ).to.be.revertedWith("Player has already been enqueued to join this game");
        });

        it("Should add first player to the appropriate queue", async () => {
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            // queue containing player
            const queuedPlayers = await lobbyContract.getQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );
            expect(queuedPlayers.length).to.eql(1);
            expect(queuedPlayers[0][0]).to.eql(players[0]); // address
            expect(queuedPlayers[0][1]).to.eql(playerFunds[0]); // staked funds
            expect(queuedPlayers[0][2]).to.eql(playerInfos[0]); // info

            // other queues (changing whatever parameter) should be empty
            expect(
                await lobbyContract.getQueue(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds + 1,
                    pokerTokenContract.address
                )
            ).to.eql([]);
        });

        it("Should keep different queues isolated from each other when players join the games", async () => {
            // player 0 joins game 1
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            // player 1 joins game 2 (with different metadata and minFunds)
            const gameMetadataOther = "0x123456";
            const minFundsOther = minFunds - 2;
            await lobbyContractPlayer1.joinGame(
                gameTemplateHash,
                gameMetadataOther,
                validators,
                gameTimeout,
                players.length,
                minFundsOther,
                pokerTokenContract.address,
                playerFunds[1],
                playerInfos[1]
            );

            // queue for the game 1 should have one player
            let queuedPlayers = await lobbyContract.getQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );
            expect(queuedPlayers.length).to.eql(1);
        });

        it("Should delete a queue when the associated game starts", async () => {
            // player 0 joins game 1
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            // player 1 joins game 2 (with different metadata and minFunds (no game started))
            const gameMetadataOther = "0x123456";
            const minFundsOther = minFunds - 2;
            await lobbyContractPlayer1.joinGame(
                gameTemplateHash,
                gameMetadataOther,
                validators,
                gameTimeout,
                players.length,
                minFundsOther,
                pokerTokenContract.address,
                playerFunds[1],
                playerInfos[1]
            );

            // sets next block timestamp to define player order (pseudo-randomization is time based)
            // - in this case, player0 will come first
            await network.provider.send("evm_setNextBlockTimestamp", [2524608001]);

            // mock now expecting to be called with these exact parameters
            await mockGameContract.mock.startGame
                .withArgs(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    pokerTokenContract.address,
                    players,
                    playerFunds,
                    playerInfos
                )
                .returns(0);

            // player 1 joins the game 1 and mock should be called
            await lobbyContractPlayer1.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[1],
                playerInfos[1]
            );

            // queue should be empty
            expect(
                await lobbyContract.getQueue(
                    gameTemplateHash,
                    gameMetadata,
                    validators,
                    gameTimeout,
                    players.length,
                    minFunds,
                    pokerTokenContract.address
                )
            ).to.eql([]);

            // queue for other game should still have one player
            let queuedPlayers = await lobbyContract.getQueue(
                gameTemplateHash,
                gameMetadataOther,
                validators,
                gameTimeout,
                players.length,
                minFundsOther,
                pokerTokenContract.address
            );
            expect(queuedPlayers.length).to.eql(1);

            // sets next block timestamp to define player order (pseudo-randomization is time based)
            // - in this case, player1 will come first
            await network.provider.send("evm_setNextBlockTimestamp", [2524608010]);

            // mock now expecting to be called with parameters for other game (player1 is the first player in this case)
            let playersOther = [players[1], players[0]];
            let playerFundsOther = [playerFunds[1], playerFunds[0]];
            let playerInfosOther = [playerInfos[1], playerInfos[0]];
            await mockGameContract.mock.startGame
                .withArgs(
                    gameTemplateHash,
                    gameMetadataOther,
                    validators,
                    gameTimeout,
                    pokerTokenContract.address,
                    playersOther,
                    playerFundsOther,
                    playerInfosOther
                )
                .returns(1);

            // player 0 joins the other game and mock should be called
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadataOther,
                validators,
                gameTimeout,
                players.length,
                minFundsOther,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            // queue for other game should now be empty
            expect(
                await lobbyContract.getQueue(
                    gameTemplateHash,
                    gameMetadataOther,
                    validators,
                    gameTimeout,
                    players.length,
                    minFundsOther,
                    pokerTokenContract.address
                )
            ).to.eql([]);
        });
    });

    // Lobby and Token
    describe("TurnBasedGameLobby and PokerToken interaction", async () => {
        it("Should lock player tokens when joining a game", async () => {
            expect(await pokerTokenContract.balanceOf(lobbyContract.address)).to.equal(0);
            expect(await pokerTokenContract.balanceOf(players[0])).to.equal(2 * minFunds);

            // player 0 joins game 1 and lobby will lock minFunds
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            expect(await pokerTokenContract.balanceOf(players[0])).to.equal(minFunds);
            expect(await pokerTokenContract.balanceOf(lobbyContract.address)).to.equal(minFunds);

            // mock now expecting to be called
            await mockGameContract.mock.startGame.returns(0);

            expect(await pokerTokenContract.balanceOf(players[1])).to.equal(2 * minFunds);

            // player 1 joins the game 1
            await lobbyContractPlayer1.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[1],
                playerInfos[1]
            );

            expect(await pokerTokenContract.balanceOf(players[1])).to.equal(minFunds);
            expect(await pokerTokenContract.balanceOf(lobbyContract.address)).to.equal(2 * minFunds);
        });

        it("Should return player tokens when leaving a queue", async () => {
            expect(await pokerTokenContract.balanceOf(lobbyContract.address)).to.equal(0);
            expect(await pokerTokenContract.balanceOf(players[0])).to.equal(2 * minFunds);

            // player 0 joins game and lobby will lock minFunds
            await lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address,
                playerFunds[0],
                playerInfos[0]
            );

            expect(await pokerTokenContract.balanceOf(players[0])).to.equal(minFunds);
            expect(await pokerTokenContract.balanceOf(lobbyContract.address)).to.equal(minFunds);

            // player 0 leaves game and lobby should return funds
            await lobbyContract.leaveQueue(
                gameTemplateHash,
                gameMetadata,
                validators,
                gameTimeout,
                players.length,
                minFunds,
                pokerTokenContract.address
            );

            expect(await pokerTokenContract.balanceOf(lobbyContract.address)).to.equal(0);
            expect(await pokerTokenContract.balanceOf(players[0])).to.equal(2 * minFunds);
        });
    });
});
