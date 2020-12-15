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

    // holds the template hash for the Cartesi Machine computation that runs the Texas Holdem poker game
    bytes32 constant texasHoldemTemplateHash = "0x123";
    // holds the metadata used when starting a Texas Holdem game (empty for now)
    bytes constant texasHoldemMetadata = "";


    // records player information
    struct PlayerInfo {
        string name;
    }
    mapping(address => PlayerInfo) public playersInfo;

    // records queue information
    struct QueuedPlayer {
        address addr;
        uint256 funds;
    }
    QueuedPlayer queuedPlayer;


    /// @param turnBasedGameAddress address of the TurnBasedGame contract
    constructor(address turnBasedGameAddress) public {
        turnBasedGame = TurnBasedGame(turnBasedGameAddress);
    }


    /// @notice registers a new player in the lobby
    /// @param _name player's name
    function register(string memory _name) public {
        playersInfo[msg.sender].name = _name;
    }


    /// @notice returns registered player information
    /// @param _address player's address
    function getPlayerInfo(address _address) public view
        returns (PlayerInfo memory)
    {
        return playersInfo[_address];
    }


    /// @notice joins a game
    /// @param _funds amount that player is bringing to the game
    function joinGame(uint256 _funds) public {
        // ensures sender is actually a registered player
        require(bytes(playersInfo[msg.sender].name).length != 0, "Player must register before joining a game.");

        if (queuedPlayer.addr == address(0)) {
            // no player queued yet, so we must queue this one
            queuedPlayer.addr = msg.sender;
            queuedPlayer.funds = _funds;
        } else {
            // starts a game with the previously queued player
            address[] memory players = new address[](2);
            players[0] = queuedPlayer.addr;
            players[1] = msg.sender;
            uint256[] memory playerFunds = new uint256[](2);
            playerFunds[0] = queuedPlayer.funds;
            playerFunds[1] = _funds;
            turnBasedGame.startGame(
                texasHoldemTemplateHash,
                players,
                playerFunds,
                texasHoldemMetadata
            );
            // clears up queue
            queuedPlayer.addr = address(0);
            queuedPlayer.funds = 0;
        }
    }
}