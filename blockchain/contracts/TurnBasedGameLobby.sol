// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title TurnBasedGameLobby
/// @author Milton Jonathan
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TurnBasedGame.sol";
import "hardhat/console.sol";

/// @title TurnBasedGameLobby
/// @notice Entry point for players to join games handled by the TurnBasedGame contract
contract TurnBasedGameLobby {
    // Address for the allowed token provider
    address allowedERC20Address;

    // TurnBasedGame contract used for starting games
    TurnBasedGame turnBasedGame;

    // records queue information
    struct QueuedPlayer {
        address addr;
        uint256 funds;
        bytes info;
    }
    mapping(bytes32 => QueuedPlayer[]) internal queues;

    /// @notice Constructor
    /// @param _allowedERC20Address Poker Token contract address used to ensure that this will be the only token provider (for now)
    /// @param _turnBasedGameAddress address of the TurnBasedGame contract used for starting games
    constructor(address _allowedERC20Address, address _turnBasedGameAddress) {
        allowedERC20Address = _allowedERC20Address;
        turnBasedGame = TurnBasedGame(_turnBasedGameAddress);
    }

    /// @notice Retrieves the current queue for a given game (specified by its template hash, metadata and number of players)
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameValidators addresses of the validator nodes that will run a Descartes verification should it be needed
    /// @param _gameNumPlayers number of players in the game
    /// @param _gameMinFunds minimum funds required to be staked in order to join the game
    /// @param _gameERC20Address address for a ERC20 compatible token provider
    /// @return array of QueuedPlayer structs representing the currently enqueued players for the specified game
    function getQueue(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        address[] memory _gameValidators,
        uint8 _gameNumPlayers,
        uint256 _gameMinFunds,
        address _gameERC20Address
    ) public view returns (QueuedPlayer[] memory) {
        // builds hash for game specification
        bytes32 queueHash =
            keccak256(
                abi.encodePacked(
                    _gameTemplateHash,
                    _gameMetadata,
                    _gameValidators,
                    _gameNumPlayers,
                    _gameMinFunds,
                    _gameERC20Address
                )
            );
        // retrieves queued players for given game specification
        return queues[queueHash];
    }

    /// @notice Allows a player to join a game. People are queued up as they join and the game starts when enough people are available.
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameValidators addresses of the validator nodes that will run a Descartes verification should it be needed
    /// @param _gameNumPlayers number of players in the game
    /// @param _gameMinFunds minimum funds required to be staked in order to join the game
    /// @param _gameERC20Address address for a ERC20 compatible token provider
    /// @param _playerFunds amount being staked by the player joining the game
    /// @param _playerInfo game-specific information for the player joining the game
    function joinGame(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        address[] memory _gameValidators,
        uint8 _gameNumPlayers,
        uint256 _gameMinFunds,
        address _gameERC20Address,
        uint256 _playerFunds,
        bytes memory _playerInfo
    ) public {
        // ensures player is staking enough funds to participate in the game
        require(_playerFunds >= _gameMinFunds, "Player's staked funds is insufficient to join the game");
        // ensures that the token provider is the allowed one
        require(_gameERC20Address == allowedERC20Address, "Unexpected token provider");

        // builds hash for game specification
        bytes32 queueHash =
            keccak256(
                abi.encodePacked(
                    _gameTemplateHash,
                    _gameMetadata,
                    _gameValidators,
                    _gameNumPlayers,
                    _gameMinFunds,
                    _gameERC20Address
                )
            );

        // retrieves queued players for given game specification
        QueuedPlayer[] storage queuedPlayers = queues[queueHash];

        // reverts if player is already in the queue
        for (uint256 i = 0; i < queuedPlayers.length; i++) {
            require(queuedPlayers[i].addr != msg.sender, "Player has already been enqueued to join this game");
        }

        // Token locking
        lockFunds(IERC20(_gameERC20Address), msg.sender, _playerFunds);

        if (queuedPlayers.length < _gameNumPlayers - 1) {
            // not enough players queued yet, so we simply add this new one to the queue
            QueuedPlayer memory newPlayer;
            newPlayer.addr = msg.sender;
            newPlayer.funds = _playerFunds;
            newPlayer.info = _playerInfo;
            queuedPlayers.push(newPlayer);
        } else {
            // enough players are already queued: we can start a game
            // - collects previously queued players
            address[] memory players = new address[](_gameNumPlayers);
            uint256[] memory playerFunds = new uint256[](_gameNumPlayers);
            bytes[] memory playerInfos = new bytes[](_gameNumPlayers);
            for (uint256 i = 0; i < _gameNumPlayers - 1; i++) {
                players[i] = queuedPlayers[i].addr;
                playerFunds[i] = queuedPlayers[i].funds;
                playerInfos[i] = queuedPlayers[i].info;
            }

            // - adds new player
            players[_gameNumPlayers - 1] = msg.sender;
            playerFunds[_gameNumPlayers - 1] = _playerFunds;
            playerInfos[_gameNumPlayers - 1] = _playerInfo;

            // - tranfer tokens to game contract
            transferTokensToGameAccount(IERC20(_gameERC20Address), playerFunds, _gameNumPlayers);

            // - starts game
            turnBasedGame.startGame(
                _gameTemplateHash,
                _gameMetadata,
                _gameValidators,
                players,
                playerFunds,
                playerInfos
            );
            // clears up queue
            delete queues[queueHash];
        }
    }

    /// @notice Lock player tokens in the lobby contract until the game start
    /// @param _tokenProvider ERC20 compatible token provider instance
    /// @param _playerAddress address for the player whose tokens will be locked in lobby account
    /// @param _playerFunds amount being staked by the player joining the game
    function lockFunds(
        IERC20 _tokenProvider,
        address _playerAddress,
        uint256 _playerFunds
    ) public {
        _tokenProvider.transferFrom(_playerAddress, address(this), _playerFunds);
    }

    /// @notice Transfer players tokens locked in lobby contract to the game contract
    /// @param _tokenProvider ERC20 compatible token provider instance
    /// @param _playerFunds amount of tokens locked in lobby contract that will be transfered to game contract
    /// @param _gameNumPlayers number of players in the game
    function transferTokensToGameAccount(
        IERC20 _tokenProvider,
        uint256[] memory _playerFunds,
        uint8 _gameNumPlayers
    ) public {
        uint256 tokensToTransfer;
        for (uint256 i = 0; i < _gameNumPlayers; i++) {
            tokensToTransfer += _playerFunds[i];
        }
        _tokenProvider.transfer(address(turnBasedGame), tokensToTransfer);
    }
}
