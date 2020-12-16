// Copyright (C) 2020 Cartesi Pte. Ltd.

// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version.

// This program is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
// PARTICULAR PURPOSE. See the GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Note: This component currently has dependencies that are licensed under the GNU
// GPL, version 3, and so you should treat this component as a whole as being under
// the GPL version 3. But all Cartesi-written code in this component is licensed
// under the Apache License, version 2, or a compatible permissive license, and can
// be used independently under the Apache v2 license. After this component is
// rewritten, the entire component will be released under the Apache v2 license.

pragma solidity >=0.5.16;
pragma experimental ABIEncoderV2;

import "./TurnBasedGame.sol";

/// @title TurnBasedGameLobby
/// @notice Entry point for players to join games handled by the TurnBasedGame contract
contract TurnBasedGameLobby {

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
    /// @param turnBasedGameAddress address of the TurnBasedGame contract used for starting games
    constructor(address turnBasedGameAddress) public {
        turnBasedGame = TurnBasedGame(turnBasedGameAddress);
    }


    /// @notice Retrieves the current queue for a given game (specified by its template hash, metadata and number of players)
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameNumPlayers number of players needed to start the game
    /// @return array of QueuedPlayer structs representing the currently enqueued players for the specified game
    function getQueue(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        uint8 _gameNumPlayers
    ) public view
        returns (QueuedPlayer[] memory)
    {
        // builds hash for game specification
        bytes32 queueHash = keccak256(abi.encodePacked(_gameTemplateHash, _gameMetadata, _gameNumPlayers));
        // retrieves queued players for given game specification
        return queues[queueHash];
    }


    /// @notice Allows a player to join a game. People are queued up as they join and the game starts when enough people are available.
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameNumPlayers number of players needed to start the game
    /// @param _playerFunds amount being staked by the player joining the game
    /// @param _playerInfo game-specific information for the player joining the game
    function joinGame(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        uint8 _gameNumPlayers,
        uint256 _playerFunds,
        bytes memory _playerInfo
    ) public {

        // builds hash for game specification
        bytes32 queueHash = keccak256(abi.encodePacked(_gameTemplateHash, _gameMetadata, _gameNumPlayers));
        // retrieves queued players for given game specification
        QueuedPlayer[] storage queuedPlayers = queues[queueHash];

        if (queuedPlayers.length < _gameNumPlayers - 1) {
            // not enough players queued, so we must queue this one
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
            for (uint i = 0; i < _gameNumPlayers - 1; i++) {
                players[i] = queuedPlayers[i].addr;
                playerFunds[i] = queuedPlayers[i].funds;
                playerInfos[i] = queuedPlayers[i].info;
            }
            // - adds new player
            players[_gameNumPlayers-1] = msg.sender;
            playerFunds[_gameNumPlayers-1] = _playerFunds;
            playerInfos[_gameNumPlayers-1] = _playerInfo;
            // - starts game
            turnBasedGame.startGame(
                _gameTemplateHash,
                _gameMetadata,
                players,
                playerFunds,
                playerInfos
            );
            // clears up queue
            delete queues[queueHash];
        }
    }
}