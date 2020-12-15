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


    /// @notice constructor
    /// @param turnBasedGameAddress address of the TurnBasedGame contract used for starting games
    constructor(address turnBasedGameAddress) public {
        turnBasedGame = TurnBasedGame(turnBasedGameAddress);
    }


    /// @notice joins a game in "zoom" mode, meaning that people are matched as they join and the game starts when enough people are available
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _numPlayers number of players needed to start the game
    /// @param _playerFunds amount being staked by the player joining the game
    /// @param _playerFunds game-specific information for the player joining the game
    function joinZoomGame(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        uint8 _numPlayers,
        uint256 _playerFunds,
        bytes memory _playerInfo
    ) public {

        // builds hash for game specification
        bytes32 queueHash = keccak256(abi.encodePacked(_gameTemplateHash, _gameMetadata, _numPlayers));
        // retrieves queued players for given game specification
        QueuedPlayer[] storage queuedPlayers = queues[queueHash];

        if (queuedPlayers.length < _numPlayers - 1) {
            // not enough players queued, so we must queue this one
            QueuedPlayer storage queuedPlayer = queuedPlayers[queuedPlayers.length];
            queuedPlayer.addr = msg.sender;
            queuedPlayer.funds = _playerFunds;
            queuedPlayer.info = _playerInfo;
        } else {
            // enough players are queued: we can start a game
            // - collects previously queued players
            address[] memory players = new address[](_numPlayers);
            uint256[] memory playerFunds = new uint256[](_numPlayers);
            bytes[] memory playerInfos = new bytes[](_numPlayers);
            for (uint i = 0; i < _numPlayers - 1; i++) {
                players[i] = queuedPlayers[i].addr;
                playerFunds[i] = queuedPlayers[i].funds;
                playerInfos[i] = queuedPlayers[i].info;
            }
            // - adds new player
            players[_numPlayers-1] = msg.sender;
            playerFunds[_numPlayers-1] = _playerFunds;
            playerInfos[_numPlayers-1] = _playerInfo;
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