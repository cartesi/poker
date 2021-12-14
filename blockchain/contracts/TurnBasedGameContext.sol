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

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@cartesi/descartes-sdk/contracts/DescartesInterface.sol";
import "./TurnBasedGameUtil.sol";

// records a player's turn
struct Turn {
    // player that submitted the turn
    address player;
    // player responsible for next turn (can be empty, in which case no player will be held accountable for a timeout)
    address nextPlayer;
    // player funds at stake after the turn
    uint256 playerStake;
    // timestamp when turn was submitted
    uint256 timestamp;
    // indices that identify the turn's data stored in the Logger
    uint256[] dataLogIndices;
}

// records information for an instantiated game
struct GameContext {
    // template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    bytes32 gameTemplateHash;
    // game-specific initial metadata/parameters
    bytes gameMetadata;
    // validator nodes to be used for descartes computations
    address[] gameValidators;
    // global timeout for game activity in seconds, after which the game may be terminated (zero means there is no timeout limit)
    uint256 gameTimeout;
    // address for the ERC20 compatible token provider
    address gameERC20Address;
    // players involved
    address[] players;
    // player funds locked for the game
    uint256[] playerFunds;
    // game-specific information per player
    bytes[] playerInfos;
    // timestamp at which the game was instantiated
    uint256 startTimestamp;
    // game-specific turns submitted by each user (including initial state)
    Turn[] turns;
    // indicates whether a descartes computation has been instantiated
    bool isDescartesInstantiated;
    // associated descartes computation index
    uint256 descartesIndex;
    // claim data: player who placed claim
    address claimer;
    // claim data: claim timestamp
    uint256 claimTimestamp;
    // claim data: claimed result represented by a distribution of player funds
    uint256[] claimedFundsShare;
    // FIXME: either enforce max of 256 players or use a variable-sized Bitmask
    // claim data: mask indicating players that agree with the claim
    uint256 claimAgreementMask;
}

// models a turned-based game instance
library TurnBasedGameContext {

    // events emitted    
    event GameReady(uint256 indexed _index, GameContext _context);
    event TurnOver(uint256 indexed _index, uint256 _turnIndex, address indexed _author, Turn _turn);
    event GameResultClaimed(uint256 indexed _index, uint[] _fundsShare, address indexed _author);
    event GameChallenged(uint256 indexed _index, uint256 indexed _descartesIndex, address indexed _author, string _message);
    event GameOver(uint256 indexed _index, uint[] _fundsShare);


    /// @notice Submits a new turn for a given game
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _turnIndex a sequential number for the turn, which must be equal to the last submitted turn's index + 1
    /// @param _nextPlayer address of a player responsible for next turn (can be empty, in which case no player will be held accountable for a timeout)
    /// @param _playerStake amount of tokens at stake after the turn
    /// @param _data game-specific turn data (array of 64-bit words)
    /// @param _logger Logger instance used for storing data in the event history
    /// @param _turnChunkLog2Size turn data log2size considering 64-bit words (i.e., how many 64-bit words are there in a chunk of turn data)
    function submitTurn(
        GameContext storage _context,
        uint256 _index,
        uint256 _turnIndex,
        address _nextPlayer,
        uint256 _playerStake,
        bytes calldata _data,
        Logger _logger,
        uint8 _turnChunkLog2Size
    ) public onlyByPlayer(_context) {
        // ensures game is still ongoing
        // - result has not been claimed yet
        require(_context.claimer == address(0), "Game end has been claimed");
        // - game has not been challenged
        require(!_context.isDescartesInstantiated, "Game has been challenged and a verification has been requested");

        // ensures turn submission sequence is correct
        require(_turnIndex == _context.turns.length, "Invalid turn submission sequence");

        // ensures next player is valid
        require(_nextPlayer == address(0) || isConcerned(_context, _nextPlayer), "Player specified as responsible for next turn is not participating in the game");

        // ensures player stake is valid
        uint256 playerIndex = getPlayerIndex(_context, msg.sender);
        require(_playerStake <= _context.playerFunds[playerIndex], "Staked funds cannot exceed total player funds locked in the game");

        // defines number of required chunks
        uint256 chunkSize = 2**_turnChunkLog2Size;
        uint256 nChunks = ((_data.length - 1) / chunkSize) + 1;

        uint256[] memory logIndices = new uint256[](nChunks);
        if (nChunks > 1) {
            // build full chunks (all but the last one)
            // - these can make use of a single chunkData buffer, because they will be completely overwritten for each chunk
            bytes8[] memory chunkData = new bytes8[](chunkSize / 8);
            uint256 start = 0;
            uint256 end = 0;
            for (uint256 i = 0; i < nChunks - 1; i++) {
                start = end;
                end = start + chunkSize;
                TurnBasedGameUtil.bytes2bytes8(_data, start, end, chunkData);
                bytes32 logHash = _logger.calculateMerkleRootFromData(_turnChunkLog2Size, chunkData);
                logIndices[i] = _logger.getLogIndex(logHash);
            }
        }
        {
            // last chunk (probably not full)
            uint256 start = (nChunks - 1) * chunkSize;
            uint256 end = _data.length;
            uint256 lastChunkSize = (end - start - 1) / 8 + 1;
            bytes8[] memory chunkData = new bytes8[](lastChunkSize);
            TurnBasedGameUtil.bytes2bytes8(_data, start, end, chunkData);
            bytes32 logHash = _logger.calculateMerkleRootFromData(_turnChunkLog2Size, chunkData);
            logIndices[nChunks - 1] = _logger.getLogIndex(logHash);
        }

        // instantiates new turn
        Turn memory turn = Turn({
            player: msg.sender,
            nextPlayer: _nextPlayer,
            playerStake: _playerStake,
            timestamp: block.timestamp,
            dataLogIndices: logIndices}
        );

        // records new turn in the game context
        _context.turns.push(turn);

        // emits event for new turn
        emit TurnOver(_index, _turnIndex, msg.sender, turn);
    }

    /// @notice Challenges game state, triggering a verification by a Descartes computation
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _message message associated with the challenge (e.g., alleged cause)
    /// @param _descartes Descartes instance used for triggering verified computations
    /// @param _logger Logger instance used for storing data in the event history
    /// @param _turnChunkLog2Size turn data log2size considering 64-bit words (i.e., how many 64-bit words are there in a chunk of turn data)
    /// @return index of the Descartes computation
    function challengeGame(
        GameContext storage _context,
        uint256 _index,
        string memory _message,
        DescartesInterface _descartes,
        Logger _logger,
        uint8 _turnChunkLog2Size,
        uint256 _emptyDataLogIndex
    ) public onlyByPlayer(_context) returns (uint256) {
        // ensures Descartes verification is not in progress or has not already been performed
        // - a new challenge is allowed if the Descartes computation is inactive or has failed
        if (_context.isDescartesInstantiated) {
            (bool isResultReady, bool isRunning, , ) = _descartes.getResult(_context.descartesIndex);
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

        // instantiates the Descarts computation
        instantiateDescartes(_context, _descartes, _logger, _turnChunkLog2Size, _emptyDataLogIndex);

        // emits event announcing game end has been claimed and that Descartes verification is underway
        emit GameChallenged(_index, _context.descartesIndex, msg.sender, _message);

        return _context.descartesIndex;
    }

    /// @notice Claims game has ended due to a timeout.
    /// @param _context game context
    /// @param _index index identifying the game
    /// @return _isTimeout true if a timeout was indeed verified, false otherwise
    function claimTimeout(
        GameContext storage _context,
        uint256 _index
    ) public
        returns (bool _isTimeout) 
    {
        // reverts if game verification has been triggered
        require(!_context.isDescartesInstantiated, "Game has been challenged and a verification has been requested");

        if (_context.gameTimeout == 0) {
            // timeout limit is undefined/infinite: no timeout possible
            return false;
        }

        if (_context.claimer != address(0)) {
            // result has been claimed: check timeout between claim and current timestamp
            if (block.timestamp - _context.claimTimestamp > _context.gameTimeout) {
                // no one confirmed nor contested the claim: game ends with claimed result
                applyResult(_context, _index, _context.claimedFundsShare);
                return true;
            }
        } else if (_context.turns.length > 0) {
            // there is no claimed result yet but turns have been submitted: check timeout between last turn and current timestamp
            if (block.timestamp - _context.turns[_context.turns.length - 1].timestamp > _context.gameTimeout) {
                // timeout occurred since last turn: apply it according to turn metadata
                applyTurnTimeout(_context, _index, _context.turns.length - 1);
                return true;
            }
        } else {
            // nothing ever happened: check timeout between game start and current timestamp
            if (block.timestamp - _context.startTimestamp > _context.gameTimeout) {
                // timeout occurred: game is ended with players keeping their original funds
                applyResult(_context, _index, _context.playerFunds);
                return true;
            }
        }
        // no timeout occurred
        return false;
    }


    /// @notice Claims game has ended with the provided result (share of locked funds)
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function claimResult(
        GameContext storage _context,
        uint256 _index,
        uint256[] memory _fundsShare
    ) public onlyByPlayer(_context) {
        // reverts if result has already been claimed
        require(
            _context.claimer == address(0),
            "Result has already been claimed for this game: it must now be either confirmed or challenged"
        );
        // reverts if game verification has been triggered
        require(!_context.isDescartesInstantiated, "Game has been challenged and a verification has been requested");

        // ensures claimed result is valid
        TurnBasedGameUtil.checkResult(_context.playerFunds, _fundsShare);

        // stores claimer, claim timestamp and claimed result in game context
        _context.claimer = msg.sender;
        _context.claimTimestamp = block.timestamp;
        _context.claimedFundsShare = _fundsShare;

        // adds claimer to mask indicating players that agree with the claim
        _context.claimAgreementMask = TurnBasedGameUtil.updateClaimAgreementMask(
            _context.claimAgreementMask,
            _context.players,
            msg.sender
        );

        emit GameResultClaimed(_index, _fundsShare, msg.sender);
    }

    /// @notice Confirms game results previously claimed
    /// @param _context game context
    /// @return _isConsensus boolean indicating whether all players have agreed with the claim
    function confirmResult(GameContext storage _context) public onlyByPlayer(_context) returns (bool _isConsensus) {
        // reverts if result has not been claimed yet
        require(_context.claimer != address(0), "Result has not been claimed for this game yet");
        // reverts if game verification has been triggered
        require(!_context.isDescartesInstantiated, "Game has been challenged and a verification has been requested");

        // adds confirming player to mask indicating players that agree with the claim
        _context.claimAgreementMask = TurnBasedGameUtil.updateClaimAgreementMask(
            _context.claimAgreementMask,
            _context.players,
            msg.sender
        );

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
    function applyVerificationResult(
        GameContext storage _context,
        uint256 _index,
        DescartesInterface _descartes
    ) public {
        // ensures Descartes computation has been instantiated
        require(_context.isDescartesInstantiated, "Game verification has not been requested");

        // queries Descartes result
        (bool isResultReady, bool isRunning, , bytes memory result) = _descartes.getResult(_context.descartesIndex);

        // ensures Descartes computation result is ready
        require(!isRunning, "Game verification result has not been computed yet");
        require(isResultReady, "Game verification result not available");

        // ensures result is valid: needs to have a uint256 value (32 bytes) for each player
        require(
            result.length >= 32 * _context.players.length,
            "Game verification result is invalid: should have one uint256 value for each player"
        );

        // decodes result bytes as an uint[] representing amount from the locked funds to be transferred to each player
        uint256[] memory fundsShare = new uint256[](_context.players.length);
        for (uint256 i = 0; i < _context.players.length; i++) {
            uint256 fundValue;
            assembly {
                result := add(result, 0x20)
                fundValue := mload(result)
            }
            fundsShare[i] = fundValue;
        }

        // applies result and ends game
        applyResult(_context, _index, fundsShare);

        // descartes computation is over: we can destruct it
        _descartes.destruct(_context.descartesIndex);
    }

    /// @notice Given a player's address, returns his index within a game context
    /// @param _context game context
    /// @param _player a player's address
    /// @return index of the player in the game, reverting if the player is not participating in it
    function getPlayerIndex(GameContext storage _context, address _player) internal view returns (uint256) {
        for (uint256 i = 0; i < _context.players.length; i++) {
            if (_player == _context.players[i]) {
                return i;
            }
        }

        // given address is not involved in the game
        revert("Player is not participating in the game");
    }

    /// @notice Returns the index of a player within a game given his address
    /// @param _context game context
    /// @param _player a player's address
    /// @return true if the player is concerned about the game, false otherwise
    function isConcerned(GameContext storage _context, address _player) internal view returns (bool) {
        // checks if given address belongs to one of the game players
        for (uint256 i = 0; i < _context.players.length; i++) {
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
    /// @param _lastValidTurnIndex index of the last valid turn, before a timeout was detected
    function applyTurnTimeout(
        GameContext storage _context,
        uint256 _index,
        uint256 _lastValidTurnIndex
    ) internal {

        address blamedPlayer = _context.turns[_lastValidTurnIndex].nextPlayer;
        if (blamedPlayer == address(0)) {
            // no one to blame: game ends with players keeping their original funds
            applyResult(_context, _index, _context.playerFunds);
        } else {
            // there is a player to blame: his active stake at the moment of the last valid turn shall be split among the others
            uint256 blamedPlayerStake = 0;
            for (uint256 i = _lastValidTurnIndex + 1; i > 0; i--) {
                if (_context.turns[i-1].player == blamedPlayer) {
                    // found the blamed player's active stake when the timeout was detected
                    blamedPlayerStake = _context.turns[i-1].playerStake;
                    break;
                }
            }
            if (blamedPlayerStake == 0) {
                // no stake to redistribute: game ends with players keeping their original funds
                applyResult(_context, _index, _context.playerFunds);
            } else {
                // computes how much each of the other players will receive (equal split of the stake to distribute)
                uint256 blamedPlayerIndex = getPlayerIndex(_context, blamedPlayer);
                uint256 awardedStakePerPlayer = blamedPlayerStake / (_context.players.length - 1);

                // computes the fundsShare by distributing the blamed player's stake (who loses his stake)
                uint256[] memory fundsShare = new uint256[](_context.players.length);
                for (uint256 i = 0; i < _context.players.length; i++) {
                    fundsShare[i] = _context.playerFunds[i] + awardedStakePerPlayer;
                }
                fundsShare[blamedPlayerIndex] = _context.playerFunds[blamedPlayerIndex] - blamedPlayerStake;

                // applies computed result
                applyResult(_context, _index, fundsShare);
            }
        }
    }

    /// @notice Applies the results of a game, transferring locked funds according to the provided distribution
    /// @param _context game context
    /// @param _index index identifying the game
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function applyResult(
        GameContext storage _context,
        uint256 _index,
        uint256[] memory _fundsShare
    ) public {
        // ensures provided result is valid
        uint256 fundsToBurn = TurnBasedGameUtil.checkResult(_context.playerFunds, _fundsShare);

        // transfer funds according to result, and burn remaining funds
        resolveFunds(_context, fundsToBurn, _fundsShare);

        // deactivates game to prevent further interaction with it
        delete _context.players;
        delete _context.playerFunds;
        delete _context.turns;

        // emit event for end of game
        emit GameOver(_index, _fundsShare);
    }

    /// @notice Resolve funds distribution
    /// @param _context game context
    /// @param _fundsToBurn funds that will be burned as a penalty for the cheater
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function resolveFunds(
        GameContext storage _context,
        uint256 _fundsToBurn,
        uint256[] memory _fundsShare
    ) internal {
        ERC20Burnable tokenProvider = ERC20Burnable(_context.gameERC20Address);

        // distribute game funds between players according result
        for (uint8 i = 0; i < _fundsShare.length; i++) {
            address player = _context.players[i];
            tokenProvider.transfer(player, _fundsShare[i]);
        }

        // burn tokens, if necessary
        if (_fundsToBurn > 0) {
            // Here the account is the game contract because context is a library ;-)
            tokenProvider.burn(_fundsToBurn);
        }
    }

    /// @notice Instantiates a Descartes computation for the game
    /// @param _context game context
    /// @param _descartes Descartes instance to use
    /// @param _logger Logger instance used for storing data in the event history
    /// @param _turnChunkLog2Size turn data log2size considering 64-bit words (i.e., how many 64-bit words are there in a chunk of turn data)
    /// @return index of the instantiated Descartes computation
    function instantiateDescartes(
        GameContext storage _context,
        DescartesInterface _descartes,
        Logger _logger,
        uint8 _turnChunkLog2Size,
        uint256 _emptyDataLogIndex
    ) internal returns (uint256) {
        // builds input drives for the descartes computation
        DescartesInterface.Drive[] memory drives =
            buildInputDrives(_context, _logger, _turnChunkLog2Size, _emptyDataLogIndex);

        // instantiates the computation
        _context.descartesIndex = _descartes.instantiate(
            1e13, // max cycles allowed
            _context.gameTemplateHash, // hash identifying the computation template
            0xf000000000000000, // output drive position: 8th drive position after the rootfs, dapp data, and 5 input drives
            // FIXME: either enforce max of 4 players or make this variable
            10, // output drive size: 1K (should hold awarded amounts for up to 4 players)
            51, // round duration
            _context.gameValidators, // parties involved in the computation (validator nodes)
            drives
        );

        _context.isDescartesInstantiated = true;
        return _context.descartesIndex;
    }

    /// @notice Builds all Descartes input drives for a verification computation
    /// @param _context game context
    /// @param _logger Logger instance used for storing data in the event history
    /// @param _turnChunkLog2Size turn data log2size considering 64-bit words (i.e., how many 64-bit words are there in a chunk of turn data)
    /// @return the Descartes input drives
    function buildInputDrives(
        GameContext storage _context,
        Logger _logger,
        uint8 _turnChunkLog2Size,
        uint256 _emptyDataLogIndex
    ) internal returns (DescartesInterface.Drive[] memory) {
        // builds input drives for the descartes computation
        DescartesInterface.Drive[] memory drives = new DescartesInterface.Drive[](5);

        // 1st input drive: game metadata (3rd drive position after rootfs and dapp data)
        drives[0] = buildDirectDrive(_context.gameMetadata, 0xa000000000000000);

        // 2nd input drive: players data
        bytes memory players = abi.encodePacked(uint32(_context.players.length), _context.players, _context.playerFunds);
        drives[1] = buildDirectDrive(players, 0xb000000000000000);

        // 3rd input drive: turns metadata
        drives[2] = buildTurnsMetadataDrive(_context, _turnChunkLog2Size, 0xc000000000000000);

        // 4th input drive: turns data stored in the Logger
        drives[3] = buildTurnsDataDrive(_context, _logger, _turnChunkLog2Size, _emptyDataLogIndex, 0xd000000000000000);

        // 5th input drive: verification info, specifying the challenge author and timestamp and, if present, the claimer along with the claim timestamp and result
        // - this is important so that the Descartes computation can punish a false claimer or challenger accordingly in the resulting funds distribution
        bytes memory verificationInfo = abi.encodePacked(msg.sender, uint32(block.timestamp), _context.claimer, uint32(_context.claimTimestamp), _context.claimedFundsShare);
        drives[4] = buildDirectDrive(verificationInfo, 0xe000000000000000);

        return drives;
    }

    /// @notice Builds a Descartes Drive using directly provided data
    /// @param _data drive data
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return _drive the Descartes drive
    function buildDirectDrive(bytes memory _data, uint64 _drivePosition)
        internal
        pure
        returns (DescartesInterface.Drive memory _drive)
    {
        // minimum drive log2size is 5 (one 32-byte word)
        uint8 driveLog2Size = 5;
        if (_data.length > 32) {
            driveLog2Size = TurnBasedGameUtil.getLog2Ceil(_data.length);
        }
        return
            DescartesInterface.Drive(
                _drivePosition, // drive position
                driveLog2Size, // driveLog2Size
                _data, // directValue
                "", // loggerIpfsPath (empty)
                0x00, // loggerRootHash
                address(0), // provider
                false, // waitsProvider
                false // needsLogger
            );
    }

    /// @notice Builds a Descartes input drive with the metadata from the turns of a given game
    /// @param _context game context
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return _drive the Descartes drive
    function buildTurnsMetadataDrive(
        GameContext storage _context,
        uint8 _turnChunkLog2Size,
        uint64 _drivePosition
    ) internal view returns (DescartesInterface.Drive memory _drive) {
        // encoding:
        // - turn count (4 bytes)
        // - player addresses for each turn (20 bytes each)
        // - nextPlayer addresses for each turn (20 bytes each)
        // - playerStakes for each turn (32 bytes each)
        // - timestamps for each turn (4 bytes each)
        // - sizes for each turn (4 bytes each)
        // obs: total drive size in bytes will be: 4 + (80 * nTurns)
        bytes memory players;
        bytes memory nextPlayers;
        bytes memory playerStakes;
        bytes memory timestamps;
        bytes memory sizes;
        for (uint256 i = 0; i < _context.turns.length; i++) {
            players = abi.encodePacked(players, abi.encodePacked(_context.turns[i].player));
            nextPlayers = abi.encodePacked(nextPlayers, abi.encodePacked(_context.turns[i].nextPlayer));
            playerStakes = abi.encodePacked(playerStakes, abi.encodePacked(_context.turns[i].playerStake));
            timestamps = abi.encodePacked(timestamps, abi.encodePacked(uint32(_context.turns[i].timestamp)));
            sizes = abi.encodePacked(sizes, abi.encodePacked(uint32(_context.turns[i].dataLogIndices.length * (2**_turnChunkLog2Size))));
        }
        bytes memory turnsMetadata = abi.encodePacked(uint32(_context.turns.length), players, nextPlayers, playerStakes, timestamps, sizes);
        return buildDirectDrive(turnsMetadata, _drivePosition);
    }

    /// @notice Builds a Descartes input drive with the data from the turns of a given game
    /// @param _context game context
    /// @param _drivePosition drive position in a 64-bit address space
    /// @return _drive the Descartes drive
    function buildTurnsDataDrive(
        GameContext storage _context,
        Logger _logger,
        uint8 _turnChunkLog2Size,
        uint256 _emptyDataLogIndex,
        uint64 _drivePosition
    ) internal returns (DescartesInterface.Drive memory _drive) {
        // computes total number of turn chunk entries
        uint256 nTotalChunks = 0;
        for (uint256 iTurn = 0; iTurn < _context.turns.length; iTurn++) {
            nTotalChunks += _context.turns[iTurn].dataLogIndices.length;
        }

        // builds "logRoot" logger entry to be used as an input drive with turn data
        // - number of composing entries must be a power of 2
        // - each entry will correspond to one turn's chunk of data
        // - padding is done by adding "empty" entries (repeats log index pointing to empty data)
        uint8 logIndicesLengthLog2 = TurnBasedGameUtil.getLog2Ceil(nTotalChunks);
        uint64 logIndicesLength = uint64(1) << logIndicesLengthLog2;
        uint256[] memory logIndices = new uint256[](logIndicesLength);
        uint256 i = 0;
        for (uint256 iTurn = 0; iTurn < _context.turns.length; iTurn++) {
            uint256[] memory logIndicesTurn = _context.turns[iTurn].dataLogIndices;
            for (uint256 iChunk = 0; iChunk < logIndicesTurn.length; iChunk++) {
                logIndices[i++] = logIndicesTurn[iChunk];
            }
        }
        while (i < logIndicesLength) {
            logIndices[i++] = _emptyDataLogIndex;
        }
        bytes32 logRoot = _logger.calculateMerkleRootFromHistory(_turnChunkLog2Size, logIndices);

        // total log2 size of the data under logRoot, expressed in bytes, is given by:
        // - size of each data chunk/entry: turnChunkLog2Size
        // - number of chunks/entries: logIndicesLengthLog2
        uint8 rootLog2Size = _turnChunkLog2Size + logIndicesLengthLog2;

        return
            DescartesInterface.Drive(
                _drivePosition, // drive position
                rootLog2Size, // driveLog2Size
                "", // directValue (empty)
                "", // loggerIpfsPath (empty)
                logRoot, // loggerRootHash
                address(0), // provider
                false, // waitsProvider
                true // needsLogger
            );
    }

    /// @notice Allows calls only from participating players
    /// @param _context game context
    modifier onlyByPlayer(GameContext storage _context) {
        require(isConcerned(_context, msg.sender), "Player is not participating in the game");
        _;
    }
}
