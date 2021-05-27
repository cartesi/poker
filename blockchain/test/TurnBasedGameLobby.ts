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
    const playerFunds = [ethers.BigNumber.from(100), ethers.BigNumber.from(100)];
    const playerInfos = [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Alice")),
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Bob")),
    ];
    const minFunds = 100;

    let players;
    let validators;

    beforeEach(async () => {
        const [signer, player1, nonPlayer] = await ethers.getSigners();

        const { deployer, alice, bob } = await getNamedAccounts();
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

        // Connect player1 to lobby contract
        lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobby.address, signer);
        lobbyContractPlayer1 = lobbyContract.connect(player1);

        // Mint tokens for player1
        pokerTokenContract = PokerToken__factory.connect(pokerToken.address, signer);
        await pokerTokenContract.mint(await player1.getAddress(), minFunds);

        // Set up approval for lobby contract spend tokens on behalf of player1
        pokerTokenContract.connect(player1).approve(TurnBasedGameLobby.address, minFunds)
    });

    // GET QUEUE

    it("getQueue: should be empty at first", async () => {
        expect(
            await lobbyContract.getQueue(gameTemplateHash, gameMetadata, validators, players.length, minFunds)
        ).to.eql([]);
    });

    // JOIN GAME

    it("joinGame: should not be allowed if player funds are less than the minimum required", async () => {
        await expect(
            lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                players.length,
                minFunds,
                minFunds - 1,
                playerInfos[0]
            )
        ).to.be.revertedWith("Player's staked funds is insufficient to join the game");

        await expect(
            lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                players.length,
                minFunds,
                minFunds,
                playerInfos[0]
            )
        ).not.to.be.reverted;
    });

    it("joinGame: should not allow player to join game more than once", async () => {
        await lobbyContract.joinGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players.length,
            minFunds,
            playerFunds[0],
            playerInfos[0]
        );

        await expect(
            lobbyContract.joinGame(
                gameTemplateHash,
                gameMetadata,
                validators,
                players.length,
                minFunds,
                minFunds,
                playerInfos[0]
            )
        ).to.be.revertedWith("Player has already been enqueued to join this game");
    });

    it("joinGame: should add first player to the appropriate queue", async () => {
        await lobbyContract.joinGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players.length,
            minFunds,
            playerFunds[0],
            playerInfos[0]
        );

        // queue containing player
        const queuedPlayers = await lobbyContract.getQueue(
            gameTemplateHash,
            gameMetadata,
            validators,
            players.length,
            minFunds
        );
        expect(queuedPlayers.length).to.eql(1);
        expect(queuedPlayers[0][0]).to.eql(players[0]); // address
        expect(queuedPlayers[0][1]).to.eql(playerFunds[0]); // staked funds
        expect(queuedPlayers[0][2]).to.eql(playerInfos[0]); // info

        // other queues (changing whatever parameter) should be empty
        expect(
            await lobbyContract.getQueue(gameTemplateHash, gameMetadata, validators, players.length, minFunds + 1)
        ).to.eql([]);
    });

    it("joinGame: should start game and delete queue when enough players have joined", async () => {
        // player 0 joins
        await lobbyContract.joinGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players.length,
            minFunds,
            playerFunds[0],
            playerInfos[0]
        );

        // player 1 joins another game with different metadata and minFunds (no game started)
        const gameMetadataOther = "0x123456";
        const minFundsOther = minFunds - 2;
        await lobbyContractPlayer1.joinGame(
            gameTemplateHash,
            gameMetadataOther,
            validators,
            players.length,
            minFundsOther,
            playerFunds[1],
            playerInfos[1]
        );

        // queue should have one player
        let queuedPlayers = await lobbyContract.getQueue(
            gameTemplateHash,
            gameMetadata,
            validators,
            players.length,
            minFunds
        );
        expect(queuedPlayers.length).to.eql(1);

        // mock now expecting to be called with these exact parameters
        await mockGameContract.mock.startGame
            .withArgs(gameTemplateHash, gameMetadata, validators, players, playerFunds, playerInfos)
            .returns(0);

        // player 1 joins the game and mock should be called
        await lobbyContractPlayer1.joinGame(
            gameTemplateHash,
            gameMetadata,
            validators,
            players.length,
            minFunds,
            playerFunds[1],
            playerInfos[1]
        );

        // queue should be empty
        expect(
            await lobbyContract.getQueue(gameTemplateHash, gameMetadata, validators, players.length, minFunds)
        ).to.eql([]);

        // queue for other game should still have one player
        queuedPlayers = await lobbyContract.getQueue(
            gameTemplateHash,
            gameMetadataOther,
            validators,
            players.length,
            minFundsOther
        );
        expect(queuedPlayers.length).to.eql(1);

        // mock now expecting to be called with parameters for other game (player1 is the first player in this case)
        let playersOther = [players[1], players[0]];
        let playerFundsOther = [playerFunds[1], playerFunds[0]];
        let playerInfosOther = [playerInfos[1], playerInfos[0]];
        await mockGameContract.mock.startGame
            .withArgs(gameTemplateHash, gameMetadataOther, validators, playersOther, playerFundsOther, playerInfosOther)
            .returns(1);

        // player 0 joins the other game and mock should be called
        await lobbyContract.joinGame(
            gameTemplateHash,
            gameMetadataOther,
            validators,
            players.length,
            minFundsOther,
            playerFunds[0],
            playerInfos[0]
        );

        // queue for other game should now be empty
        expect(
            await lobbyContract.getQueue(gameTemplateHash, gameMetadataOther, validators, players.length, minFundsOther)
        ).to.eql([]);
    });
});
