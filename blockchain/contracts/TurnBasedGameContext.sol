// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title TurnBasedGame
/// @author Milton Jonathan
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@cartesi/descartes-sdk/contracts/DescartesInterface.sol";
import "./TurnBasedGameUtil.sol";


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
    // template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    bytes32 gameTemplateHash;
    // game-specific initial metadata/parameters
    bytes gameMetadata;
    // validator nodes to be used for descartes computations
    address[] validators;
    // players involved
    address[] players;
    // player funds locked for the game
    uint[] playerFunds;
    // game-specific information per player
    bytes[] playerInfos;
    // game-specific turns submitted by each user (including initial state)
    Turn[] turns;
    // indicates whether a descartes computation has been instantiated
    bool isDescartesInstantiated;
    // associated descartes computation index
    uint256 descartesIndex;
    // claim data: player who placed claim
    address claimer;
    // claim data: claimed result represented by a distribution of player funds
    uint[] claimedFundsShare;
    // FIXME: either enforce max of 255 players or use a variable-sized Bitmask
    // claim data: mask indicating players that agree with the claim
    uint256 claimAgreementMask;
}


// models a turned-based game instance
library TurnBasedGameContext {

    // events emitted    
    event GameReady(uint256 _index, GameContext _context);
    event TurnOver(uint256 _index, Turn _turn);
    event GameResultClaimed(uint256 _index, uint[] _fundsShare, address _author);
    event GameChallenged(uint256 _index, uint256 _descartesIndex, address _author);
    event GameOver(uint256 _index, uint[] _fundsShare);


    /// @notice Submits a new turn for a given game
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _stateHash game state for which the turn applies
    /// @param _data game-specific turn data (array of 64-bit words)
    /// @param _descartes Descartes instance used for triggering verified computations
    /// @param _logger Logger instance used for storing data in the event history
    /// @param _turnDataLog2Size turn data log2size considering 64-bit words (i.e., how many 64-bit words are there in a chunk of turn data)
    function submitTurn(GameContext storage _context, uint256 _index, bytes32 _stateHash, bytes8[] memory _data, DescartesInterface _descartes, Logger _logger, uint8 _turnDataLog2Size) public
        onlyByPlayer(_context)
    {
        // ensures game is still ongoing
        // - result has not been claimed yet
        require(_context.claimer == address(0), "Game end has been claimed");
        // - game has not been challenged
        require(!_context.isDescartesInstantiated, "Game verification in progress");

        // stores submitted turn data in the logger and retrieves its index
        bytes32 logHash = _logger.calculateMerkleRootFromData(_turnDataLog2Size, _data);
        uint256 logIndex = _logger.getLogIndex(logHash);

        // instantiates new turn
        Turn memory turn = Turn({
            player: msg.sender,
            stateHash: _stateHash,
            dataLogIndex: logIndex
        });

        // records new turn in the game context
        _context.turns.push(turn);
        
        // emits event for new turn
        emit TurnOver(_index, turn);
    }


    /// @notice Challenges game state, triggering a verification by a Descartes computation
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _descartes Descartes instance used for triggering verified computations
    /// @param _logger Logger instance used for storing data in the event history
    /// @param _turnDataLog2Size turn data log2size considering 64-bit words (i.e., how many 64-bit words are there in a chunk of turn data)
    /// @return index of the Descartes computation
    function challengeGame(GameContext storage _context, uint256 _index, DescartesInterface _descartes, Logger _logger, uint8 _turnDataLog2Size, uint256 _emptyDataLogIndex) public
        onlyByPlayer(_context)
        returns (uint256)
    {
        // ensures Descartes verification is not in progress or has not already been performed
        // - a new challenge is allowed if the Descartes computation is inactive or has failed
        if (_context.isDescartesInstantiated) {
            (bool isResultReady, bool isRunning, ,) = _descartes.getResult(_context.descartesIndex);
            if (isRunning == true) {
                revert("Game verification already in progress");
            } else if (isResultReady == true) {
                revert("Game verification has already been performed");
            } else {
                // the Descartes computation has failed: it is not running and there are no results available
                // - let's destruct it before allowing a new computation to take place
                _descartes.destruct(_context.descartesIndex);
            }
        }

        // builds input drives for the descartes computation
        DescartesInterface.Drive[] memory drives = buildInputDrives(_context, _logger, _turnDataLog2Size, _emptyDataLogIndex);

        // instantiates the computation
        _context.descartesIndex = _descartes.instantiate(
            // FIXME: using lower max cycles unti Descartes 1.2.0 is released (includes confirm tx to speed things up)
            5e11,                  // max cycles allowed
            // 1e13,                  // max cycles allowed
            _context.gameTemplateHash,  // hash identifying the computation template
            0xf000000000000000,    // output drive position: 8th drive position after the rootfs, dapp data, and 5 input drives
            // FIXME: either enforce max of 4 players or make this variable
            10,                    // output drive size: 1K (should hold awarded amounts for up to 4 players)
            51,                    // round duration
            _context.validators,   // parties involved in the computation (validator nodes)
            drives
        );

        _context.isDescartesInstantiated = true;

        // emits event announcing game end has been claimed and that Descartes verification is underway
        emit GameChallenged(_index, _context.descartesIndex, msg.sender);

        return _context.descartesIndex;
    }


    /// @notice Claims game has ended with the provided result (share of locked funds)
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function claimResult(GameContext storage _context, uint256 _index, uint[] memory _fundsShare) public
        onlyByPlayer(_context)
    {
        // reverts if result has already been claimed
        require(_context.claimer == address(0), "Result has already been claimed for this game: it must now be either confirmed or challenged");
        // reverts if game verification has been triggered
        require(!_context.isDescartesInstantiated, "Game has been challenged and a verification has been requested");

        // ensures claimed result is valid
        TurnBasedGameUtil.checkResult(_context.playerFunds, _fundsShare);

        // stores claimer and claimed result in game context
        _context.claimer = msg.sender;
        _context.claimedFundsShare = _fundsShare;

        // adds claimer to mask indicating players that agree with the claim
        _context.claimAgreementMask = TurnBasedGameUtil.updateClaimAgreementMask(_context.claimAgreementMask, _context.players, msg.sender);

        emit GameResultClaimed(_index, _fundsShare, msg.sender);
    }


    /// @notice Confirms game results previously claimed
    /// @param _context game context
    /// @return _isConsensus boolean indicating whether all players have agreed with the claim
    function confirmResult(GameContext storage _context) public
        onlyByPlayer(_context)
        returns (bool _isConsensus)
    {
        // reverts if result has not been claimed yet
        require(_context.claimer != address(0), "Result has not been claimed for this game yet");
        // reverts if game verification has been triggered
        require(!_context.isDescartesInstantiated, "Game has been challenged and a verification has been requested");

        // adds confirming player to mask indicating players that agree with the claim
        _context.claimAgreementMask = TurnBasedGameUtil.updateClaimAgreementMask(_context.claimAgreementMask, _context.players, msg.sender);

        // checks if all players have agreed with the claim
        uint256 consensusMask = (uint256(1) << _context.players.length) - uint256(1);
        if (_context.claimAgreementMask == consensusMask) {
            return true;
        } else {
            return false;
        }
    }
    

    /// @notice Applies the result of a game verified by Descartes, transferring funds according to the Descartes computation output
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _descartes Descartes instance used for triggering verified computations
    function applyVerificationResult(GameContext storage _context, uint256 _index, DescartesInterface _descartes) public
    {
        // ensures Descartes computation has been instantiated
        require(_context.isDescartesInstantiated, "Game verification has not been requested");

        // queries Descartes result
        (bool isResultReady, bool isRunning, , bytes memory result) = _descartes.getResult(_context.descartesIndex);

        // ensures Descartes computation result is ready
        require(!isRunning, "Game verification result has not been computed yet");
        require(isResultReady, "Game verification result not available");

        // ensures result is valid: needs to have a uint256 value (32 bytes) for each player
        require(result.length == 32*_context.players.length, "Game verification result is invalid: should have one uint256 value for each player");

        // decodes result bytes as an uint[] representing amount from the locked funds to be transferred to each player
        uint[] memory fundsShare = new uint[](_context.players.length);
        for (uint i = 0; i < _context.players.length; i++) {
            uint256 fundValue;
            assembly {
                result := add(result, 0x20)
                fundValue := mload(result)
            }
            fundsShare[i] = fundValue;
        }

        // applies result and ends game
        applyResult(_context, _index, fundsShare);
    }


    /// @notice Indicates whether a given player is concerned about a game
    /// @param _context game context
    /// @param _player a player's address
    /// @return true if the player is concerned about the game, false otherwise
    function isConcerned(GameContext storage _context, address _player) internal view
        returns (bool)
    {
        // checks if given address belongs to one of the game players
        for (uint i = 0; i < _context.players.length; i++) {
            if (_player == _context.players[i]) {
                return true;
            }
        }

        // given address is not involved in the game
        return false;
    }


    /// @notice Applies the results of a game, transferring locked funds according to the provided distribution
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function applyResult(GameContext storage _context, uint256 _index, uint[] memory _fundsShare) public {

        // ensures provided result is valid
        uint fundsToBurn = TurnBasedGameUtil.checkResult(_context.playerFunds, _fundsShare);

        // FIXME: transfer funds according to result, and burn remaining funds
        // ...

        // deactivates game to prevent further interaction with it
        delete _context.players;
        delete _context.playerFunds;
        delete _context.turns;

        // emit event for end of game
        emit GameOver(_index, _fundsShare);
    }    


    function buildInputDrives(GameContext storage _context, Logger _logger, uint8 _turnDataLog2Size, uint256 _emptyDataLogIndex) internal
        returns (DescartesInterface.Drive[] memory)
    {
        // builds input drives for the descartes computation
        DescartesInterface.Drive[] memory drives = new DescartesInterface.Drive[](5);
        address provider = address(0);

        // 1st input drive: game metadata (3rd drive position after rootfs and dapp data)
        drives[0] = buildDirectDrive(provider, _context.gameMetadata, 0xa000000000000000);

        // 2nd input drive: players data
        bytes memory players = abi.encodePacked(_context.players);
        drives[1] = buildDirectDrive(provider, players, 0xb000000000000000);

        // 3rd input drive: player funds data
        bytes memory playerFunds = abi.encodePacked(_context.playerFunds);
        drives[2] = buildDirectDrive(provider, playerFunds, 0xc000000000000000);

        // 4th input drive: turns data stored in the Logger
        drives[3] = buildTurnsDrive(_context, _logger, _turnDataLog2Size, _emptyDataLogIndex, 0xd000000000000000);

        // 5th input drive: verification info, specifying the challenger player and, if present, the claimer along with the claimed result
        // - this is important so that the Descartes computation can punish a false claimer or challenger accordingly in the resulting funds distribution
        bytes memory verificationInfo = abi.encodePacked(msg.sender, _context.claimer, _context.claimedFundsShare);
        drives[4] = buildDirectDrive(provider, verificationInfo, 0xe000000000000000);

        return drives;
    }


    /// @notice Builds a Descartes Drive using directly provided data
    /// @param _provider address of the validator node responsible for providing the data
    /// @param _data drive data
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return _drive the Descartes drive
    function buildDirectDrive(address _provider, bytes memory _data, uint64 _drivePosition) internal pure
        returns (DescartesInterface.Drive memory _drive)
    {
        // minimum drive log2size is 5 (one 32-byte word)
        uint8 driveLog2Size = 5;
        if (_data.length > 32) {
            driveLog2Size = TurnBasedGameUtil.getLog2Ceil(_data.length);
        }
        return DescartesInterface.Drive(
            _drivePosition,        // drive position
            driveLog2Size,         // driveLog2Size
            _data,                 // directValue
            "",                    // loggerIpfsPath (empty)
            0x00,                  // loggerRootHash
            _provider,             // provider
            false,                 // waitsProvider
            false                  // needsLogger
        );
    }

    /// @notice Builds a Descartes input drive with the data from the turns of a given game
    /// @param _context game context
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return _drive the Descartes drive
    function buildTurnsDrive(GameContext storage _context, Logger _logger, uint8 _turnDataLog2Size, uint256 _emptyDataLogIndex, uint64 _drivePosition) internal
        returns (DescartesInterface.Drive memory _drive)
    {
        // builds "logRoot" logger entry to be used as an input drive with turn data
        // - number of composing entries must be a power of 2
        // - each entry will correspond to one turn
        // - padding is done by adding "empty" entries (repeats log index pointing to empty data)
        uint8 logIndicesLengthLog2 = TurnBasedGameUtil.getLog2Ceil(_context.turns.length);
        uint64 logIndicesLength = uint64(1) << logIndicesLengthLog2;
        uint256[] memory logIndices = new uint256[](logIndicesLength);
        for (uint i = 0; i < _context.turns.length; i++) {
            logIndices[i] = _context.turns[i].dataLogIndex;
        }
        for (uint i = _context.turns.length; i < logIndicesLength; i++) {
            logIndices[i] = _emptyDataLogIndex;
        }
        bytes32 logRoot = _logger.calculateMerkleRootFromHistory(_turnDataLog2Size, logIndices);

        // total log2 size of the data under logRoot, expressed in bytes, is given by:
        // - size of each data chunk/entry: turnDataLog2Size
        // - number of chunks/entries: logIndicesLengthLog2
        uint8 rootLog2Size =  _turnDataLog2Size + logIndicesLengthLog2;

        return DescartesInterface.Drive(
            _drivePosition,        // drive position
            rootLog2Size,          // driveLog2Size
            "",                    // directValue (empty)
            "",                    // loggerIpfsPath (empty)
            logRoot,               // loggerRootHash
            _context.validators[0],// provider
            false,                 // waitsProvider
            true                   // needsLogger
        );
    }

    /// @notice Allows calls only from participating players
    /// @param _context game context
    modifier onlyByPlayer(GameContext storage _context) {
        require(isConcerned(_context, msg.sender), "Player is not participating in the game");
        _;
    }
}
