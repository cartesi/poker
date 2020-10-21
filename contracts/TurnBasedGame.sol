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

pragma solidity >=0.4.25 <0.7.0;
pragma experimental ABIEncoderV2;

import "@cartesi/descartes-sdk/contracts/DescartesInterface.sol";
import "@cartesi/logger/contracts/Logger.sol";
import "@cartesi/util/contracts/Instantiator.sol";

contract TurnBasedGame is Instantiator {

    // Descartes instance used for triggering verified computations
    DescartesInterface descartes;
    // Logger instance used for storing data in the event history
    Logger logger;

    // turn data chunk size fixed as 4K
    uint64 constant turnDataLog2Size = 12;

    /// @param descartesAddress address of the Descartes contract
    /// @param loggerAddress address of the Logger contract
    constructor(address descartesAddress, address loggerAddress) public {
        descartes = DescartesInterface(descartesAddress);
        logger = Logger(loggerAddress);
    }

    // records a player's turn
    struct Turn {
        // player that submitted the turn
        address player;
        // game state for which the turn applies
        bytes32 stateHash;
        // index that identifies the turn's data stored in the Logger
        uint256 dataLogIndex;
    }

    // records information for an instantiated game
    struct GameContext {
        // identifies the type of game/computation
        bytes32 templateHash;
        // players involved
        address[] players;
        // player funds locked for the game
        uint[] playerFunds;
        // game-specific initial metadata/parameters
        bytes metadata;
        // game-specific turns submitted by each user (including initial state)
        Turn[] turns;
        // associated descartes computation index
        uint256 descartesIndex;
    }

    // game instances
    mapping(uint256 => GameContext) internal instances;

    // events emitted    
    event GameReady(uint256 _index, GameContext _context);
    event TurnOver(uint256 _index, Turn _turn);
    event GameEndClaimed(uint256 _index, uint256 _descartesIndex);
    event GameOver(uint256 _index, uint[] _potShare);


    /// @notice starts a new game
    /// @param _templateHash hash that identifies the game computation/logic
    /// @param _players addresses of the players involved
    /// @param _playerFunds funds/balances that each player is bringing into the game
    /// @param _metadata game-specific metadata
    function startGame(bytes32 _templateHash, address[] memory _players, uint[] memory _playerFunds, bytes memory _metadata) public returns (uint256) {

        // creates new context
        GameContext storage context = instances[currentIndex];
        context.templateHash = _templateHash;
        // TODO: check/lock funds, preferrably use a token and not ether
        context.players = _players;
        context.playerFunds = _playerFunds;
        context.metadata = _metadata;

        // emits event for new game        
        emit GameReady(currentIndex, context);

        active[currentIndex] = true;
        return currentIndex++;
    }


    /// @notice submits a new game turn
    /// @param _index index identifying the game
    /// @param _stateHash game state for which the turn applies
    /// @param _data game-specific turn data (array of 64-bit words)
    function submitTurn(uint256 _index, bytes32 _stateHash, bytes8[] memory _data) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];

        // ensures sender is actually a player participating in the game
        require(isConcerned(_index, msg.sender));

        // stores submitted turn data in the logger and retrieves its index
        bytes32 logHash = logger.calculateMerkleRootFromData(turnDataLog2Size, _data);
        uint256 logIndex = logger.getLogIndex(logHash);

        // instantiates new turn
        Turn memory turn = Turn({
            player: msg.sender,
            stateHash: _stateHash,
            dataLogIndex: logIndex
        });

        // records new turn in the game context
        context.turns.push(turn);
        
        // emits event for new turn
        emit TurnOver(_index, turn);
    }


    /// @notice claims game has ended; game results will be given by a Descartes computation
    /// @param _index index identifying the game
    function claimGameEnd(uint256 _index) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];

        // ensures there is not already a Descartes computation verifying the game
        require(!descartes.isActive(context.descartesIndex), "GameEnd claim already in progress.");

        // FIXME: instantiate Descartes
        // - templateHash from context
        // - claimer/challengers from context.players
        // - input drive with initial state: players, playerFunds, metadata
        // - input drive with turns data
        // context.descartesIndex = descartes.instantiate(...);

        // emits event announcing game end has been claimed and that Descartes verification is underway
        emit GameEndClaimed(_index, context.descartesIndex);
    }


    /// @notice applies the results of a game, transferring funds according to the results given by its final Descartes computation
    /// @param _index index identifying the game
    function applyResult(uint256 _index) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];

        // ensures Descartes computation is available
        require(descartes.isActive(context.descartesIndex), "GameEnd has not been claimed yet.");

        // queries Descartes result
        (bool isResultReady, , , bytes memory result) = descartes.getResult(context.descartesIndex);

        // ensures Descartes computation result is ready
        require(isResultReady, "Game result has not been computed yet." );

        // FIXME: decode result bytes as an uint[] representing amount from the locked funds to be transferred to each player
        uint[] memory potShare;
        // FIXME: transfer funds according to result
        // ...

        // deactivates game to prevent further interaction with it
        delete context.players;
        delete context.playerFunds;
        delete context.turns;
        deactivate(_index);

        // emit event for end of game
        emit GameOver(_index, potShare);
    }


    /// @notice returns game context
    /// @param _index index identifying the game
    function getContext(uint256 _index) public view
        onlyInstantiated(_index)
        returns(GameContext memory)
    {
        return instances[_index];
    }


    /// @notice Indicates whether a given player is concerned about a game
    /// @param _index index identifying the game
    /// @param _player a player's address
    function isConcerned(uint256 _index, address _player) public view
        onlyInstantiated(_index)
        returns (bool)
    {
        GameContext storage context = instances[_index];

        // checks if given address belongs to one of the game players
        for (uint i = 0; i < context.players.length; i++) {
            if (_player == context.players[i]) {
                return true;
            }
        }

        // given address is not involved in the game
        return false;
    }


    /// @notice Retrieves sub-instances of the game (required method for Instantiator).
    /// @param _index index identifying the game
    function getSubInstances(uint256 _index, address) public view
        onlyInstantiated(_index)
        returns (address[] memory _addresses, uint256[] memory _indices)
    {
        // always empty (no sub-instances for the game)
        return (new address[](0), new uint256[](0));
    }    
}