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

import "@cartesi/descartes-sdk/contracts/DescartesInterface.sol";
import "@cartesi/logger/contracts/Logger.sol";
import "@cartesi/util/contracts/Instantiator.sol";

contract TurnBasedGame is Instantiator {

    // Descartes instance used for triggering verified computations
    DescartesInterface descartes;
    // Logger instance used for storing data in the event history
    Logger logger;
    // index of an empty chunk of data stored in the logger
    uint256 emptyDataLogIndex;

    // turn data log2size fixed as 9
    // - data is given as 64-bit (8-byte) words
    // - total turn data size is thus fixed at 8 * 2^9 = 4K 
    uint8 constant turnDataLog2Size = 9;

    /// @param descartesAddress address of the Descartes contract
    /// @param loggerAddress address of the Logger contract
    constructor(address descartesAddress, address loggerAddress) public {
        descartes = DescartesInterface(descartesAddress);
        logger = Logger(loggerAddress);

        // stores an empty chunk of data in the logger and records its index
        bytes8[] memory emptyData = new bytes8[](1);
        bytes32 logHash = logger.calculateMerkleRootFromData(turnDataLog2Size, emptyData);
        emptyDataLogIndex = logger.getLogIndex(logHash);
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
        // indicates whether a descartes computation has been instantiated
        bool isDescartesInstantiated;
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
    /// @return index of the game instance
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
        require(isConcerned(_index, msg.sender), "Player is not participating in the game.");

        // ensures no turn is submitted while a GameEnd claim is being verified
        require(!context.isDescartesInstantiated || !descartes.isActive(context.descartesIndex), "GameEnd claim verification in progress.");

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
    /// @return index of the Descartes computation
    function claimGameEnd(uint256 _index) public
        onlyActive(_index)
        returns (uint256)
    {
        GameContext storage context = instances[_index];

        // ensures there is not already a Descartes computation verifying the game
        require(!context.isDescartesInstantiated || !descartes.isActive(context.descartesIndex), "GameEnd claim verification already in progress.");

        // builds input drives for the descartes computation
        DescartesInterface.Drive[] memory drives = new DescartesInterface.Drive[](4);

        // 1st input drive: players data
        bytes memory players = abi.encodePacked(context.players);
        drives[0] = buildDirectDrive(context, players, 0x9000000000000000);

        // 2nd input drive: player funds data
        bytes memory playerFunds = abi.encodePacked(context.playerFunds);
        drives[1] = buildDirectDrive(context, playerFunds, 0xa000000000000000);

        // 3rd input drive: metadata
        drives[2] = buildDirectDrive(context, context.metadata, 0xb000000000000000);

        // 4th input drive: turns data stored in the Logger
        drives[3] = buildTurnsDrive(context, 0xc000000000000000);

        // instantiates the computation
        context.descartesIndex = descartes.instantiate(
            1e13,                  // max cycles allowed
            context.templateHash,  // hash identifying the computation template
            0xd000000000000000,    // output drive position: 6th drive position
            10,                    // output drive size: 1K (should hold awarded amounts for up to 4 players)
            45,                    // round duration
            context.players[0],    // claimer
            context.players[1],    // challenger
            drives
        );

        context.isDescartesInstantiated = true;

        // emits event announcing game end has been claimed and that Descartes verification is underway
        emit GameEndClaimed(_index, context.descartesIndex);

        return context.descartesIndex;
    }


    /// @notice applies the results of a game, transferring funds according to the results given by its final Descartes computation
    /// @param _index index identifying the game
    function applyResult(uint256 _index) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];

        // ensures Descartes computation has been instantiated
        require(context.isDescartesInstantiated, "GameEnd has not been claimed yet.");

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


    /// @notice Builds a Descartes Drive using directly provided data
    /// @param _context game context
    /// @param _data drive data
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return the Descartes drive
    function buildDirectDrive(GameContext memory _context, bytes memory _data, uint64 _drivePosition) internal
        returns (DescartesInterface.Drive memory _drive)
    {
        uint8 driveLog2Size = getLog2Ceil(_data.length);
        return DescartesInterface.Drive(
            _drivePosition,        // drive position
            driveLog2Size,         // driveLog2Size
            _data,                 // directValue
            0x00,                  // loggerRootHash
            _context.players[0],   // provider
            false,                 // waitsProvider
            false                  // needsLogger
        );
    }


    /// @notice Builds a Descartes input drive with the data from the turns of a given game
    /// @param _context game context
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return the Descartes drive
    function buildTurnsDrive(GameContext memory _context, uint64 _drivePosition) internal
        returns (DescartesInterface.Drive memory _drive)
    {
        // builds "logRoot" logger entry to be used as an input drive with turn data
        // - number of composing entries must be a power of 2
        // - each entry will correspond to one turn
        // - padding is done by adding "empty" entries (repeats log index pointing to empty data)
        uint8 logIndicesLengthLog2 = getLog2Ceil(_context.turns.length);
        uint64 logIndicesLength = uint64(1) << logIndicesLengthLog2;
        uint256[] memory logIndices = new uint256[](logIndicesLength);
        for (uint i = 0; i < _context.turns.length; i++) {
            logIndices[i] = _context.turns[i].dataLogIndex;
        }
        for (uint i = _context.turns.length; i < logIndicesLength; i++) {
            logIndices[i] = emptyDataLogIndex;
        }
        bytes32 logRoot = logger.calculateMerkleRootFromHistory(turnDataLog2Size, logIndices);

        // total size of the data under logRoot, expressed in bytes, is given by:
        // - size of each data chunk/entry: 8 bytes * 2^turnDataLog2Size = 2^(3 + turnDataLog2Size)
        // - number of chunks/entries: logIndicesLength = 2^(logIndicesLengthLog2)
        uint8 rootLog2Size = 3 + turnDataLog2Size + logIndicesLengthLog2;

        return DescartesInterface.Drive(
            _drivePosition,        // drive position
            rootLog2Size,          // driveLog2Size
            "",                    // directValue (empty)
            logRoot,               // loggerRootHash
            _context.players[0],   // provider
            false,                 // waitsProvider
            true                   // needsLogger
        );
    }


    /// @notice Calculates the ceiling of the log2 of the provided number
    /// @param _number input number to use for the calculation
    /// @return the log2 ceiling result, where getLog2Ceil(0) = 0, getLog2Ceil(1) = 1, getLog2Ceil(2) = 1, etc.
    function getLog2Ceil(uint256 _number) internal pure
        returns (uint8)
    {
        uint8 result = 0;
        
        uint256 checkNumber = _number;
        bool notPowerOf2 = ((checkNumber & 1) == 1);

        checkNumber = checkNumber >> 1;
        while (checkNumber > 0) {
            ++result;
            if (checkNumber != 1 && (checkNumber & 1) == 1) {
                notPowerOf2 = true;
            }
            checkNumber = checkNumber >> 1;
        }

        if (notPowerOf2) {
            ++result;
        }
        return result;
    }   
}
