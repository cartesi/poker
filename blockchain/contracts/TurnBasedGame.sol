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
import "@cartesi/logger/contracts/Logger.sol";
import "@cartesi/util/contracts/InstantiatorImpl.sol";
import "./TurnBasedGameContext.sol";
import "./TurnBasedGameUtil.sol";

/// @title TurnBasedGame
/// @notice Generic contract for handling turn-based games validated by Descartes computations
contract TurnBasedGame is InstantiatorImpl {
    // Address for the allowed token provider
    address allowedERC20Address;

    using TurnBasedGameContext for GameContext;

    // Descartes instance used for triggering verified computations
    DescartesInterface descartes;
    // Logger instance used for storing data in the event history
    Logger logger;
    // index of an empty chunk of data stored in the logger
    uint256 emptyDataLogIndex;

    // turn data log2size fixed as 12 (4K)
    uint8 constant turnChunkLog2Size = 12;

    // game instances
    mapping(uint256 => GameContext) internal instances;

    /// @notice Constructor
    /// @param _allowedERC20Address address of the ERC20 compatible token provider
    /// @param _descartesAddress address of the Descartes contract
    /// @param _loggerAddress address of the Logger contract
    constructor(
        address _allowedERC20Address,
        address _descartesAddress,
        address _loggerAddress
    ) {
        allowedERC20Address = _allowedERC20Address;
        descartes = DescartesInterface(_descartesAddress);
        logger = Logger(_loggerAddress);

        // stores an empty chunk of data in the logger and records its index
        bytes8[] memory emptyData = new bytes8[](1);
        bytes32 logHash = logger.calculateMerkleRootFromData(turnChunkLog2Size, emptyData);
        emptyDataLogIndex = logger.getLogIndex(logHash);
    }

    /// @notice Starts a new game
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _gameValidators addresses of the validator nodes that will run a Descartes verification should it be needed
    /// @param _gameTimeout global timeout for game activity in seconds, after which the game may be terminated (zero means there is no timeout limit)
    /// @param _gameERC20Address address for a ERC20 compatible token provider
    /// @param _players addresses of the players involved
    /// @param _playerFunds funds/balances that each player is bringing into the game
    /// @param _playerInfos game-specific information for each player
    /// @return index of the game instance
    function startGame(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        address[] memory _gameValidators,
        uint256 _gameTimeout,
        address _gameERC20Address,
        address[] memory _players,
        uint256[] memory _playerFunds,
        bytes[] memory _playerInfos
    ) public returns (uint256) {
        // ensures that the token provider is the allowed one
        require(_gameERC20Address == allowedERC20Address, "Unexpected token provider");

        // tranfer tokens to game contract
        transferTokensToGameAccount(IERC20(_gameERC20Address), msg.sender, _playerFunds);

        // creates new context
        GameContext storage context = instances[currentIndex];
        context.gameTemplateHash = _gameTemplateHash;
        context.gameMetadata = _gameMetadata;
        context.gameValidators = _gameValidators;
        context.gameTimeout = _gameTimeout;
        context.gameERC20Address = _gameERC20Address;
        context.players = _players;
        context.playerFunds = _playerFunds;
        context.playerInfos = _playerInfos;
        context.startTimestamp = block.timestamp;

        // emits event for new game
        emit TurnBasedGameContext.GameReady(currentIndex, context);

        active[currentIndex] = true;
        return currentIndex++;
    }

    /// @notice Transfer tokens to the game contract account
    /// @param _tokenProvider ERC20 compatible token provider instance
    /// @param _holder account from where tokens will be transferred to the game
    /// @param _playerFunds amount of tokens from each player
    function transferTokensToGameAccount(
        IERC20 _tokenProvider,
        address _holder,
        uint256[] memory _playerFunds
    ) public {
        uint256 tokensToTransfer;
        for (uint256 i = 0; i < _playerFunds.length; i++) {
            tokensToTransfer += _playerFunds[i];
        }
        _tokenProvider.transferFrom(_holder, address(this), tokensToTransfer);
    }

    /// @notice Returns game context
    /// @param _index index identifying the game
    /// @return GameContext struct for the specified game
    function getContext(uint256 _index) public view onlyInstantiated(_index) returns (GameContext memory) {
        return instances[_index];
    }

    /// @notice Submits a new turn for a given game
    /// @param _index index identifying the game
    /// @param _turnIndex a sequential number for the turn, which must be equal to the last submitted turn's index + 1
    /// @param _nextPlayer address of a player responsible for next turn (can be empty, in which case no player will be held accountable for a timeout)
    /// @param _playerStake amount of tokens at stake after the turn
    /// @param _data game-specific turn data (array of 64-bit words)
    function submitTurn(
        uint256 _index,
        uint256 _turnIndex,
        address _nextPlayer,
        uint256 _playerStake,
        bytes calldata _data
    ) public onlyActive(_index) {
        GameContext storage context = instances[_index];
        // before accepting submitted turn, checks for a timeout
        if (context.claimTimeout(_index)) {
            // game ended by timeout
            deactivate(_index);
        } else {
            // submits turn
            context.submitTurn(_index, _turnIndex, _nextPlayer, _playerStake, _data, logger, turnChunkLog2Size);
        }
    }

    /// @notice Challenges game state, triggering a verification by a Descartes computation
    /// @param _index index identifying the game
    /// @return index of the Descartes computation
    function challengeGame(uint256 _index) public onlyActive(_index) returns (uint256) {
        GameContext storage context = instances[_index];
        return context.challengeGame(_index, descartes, logger, turnChunkLog2Size, emptyDataLogIndex);
    }

    /// @notice Claims game has ended due to a timeout.
    /// @param _index index identifying the game
    function claimTimeout(uint256 _index) public onlyActive(_index) {
        GameContext storage context = instances[_index];
        if (context.claimTimeout(_index)) {
            // game ended by timeout
            deactivate(_index);
        }
    }

    /// @notice Claims game has ended with the provided result (share of locked funds)
    /// @param _index index identifying the game
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function claimResult(uint256 _index, uint256[] memory _fundsShare) public onlyActive(_index) {
        GameContext storage context = instances[_index];
        // before accepting claim, checks for a timeout
        if (context.claimTimeout(_index)) {
            // game ended by timeout
            deactivate(_index);
        } else {
            // claims result
            context.claimResult(_index, _fundsShare);
        }
    }

    /// @notice Confirms game results previously claimed
    /// @param _index index identifying the game
    function confirmResult(uint256 _index) public onlyActive(_index) {
        GameContext storage context = instances[_index];
        // before accepting confirmation, checks for a timeout
        if (context.claimTimeout(_index)) {
            // game ended by timeout
            deactivate(_index);
        } else {
            // confirms claimed result
            bool isConsensus = context.confirmResult();
            if (isConsensus) {
                // all players agree: apply claimed result and end game
                context.applyResult(_index, context.claimedFundsShare);
                deactivate(_index);
            }
        }
    }

    /// @notice Applies the result of a game verified by Descartes, transferring funds according to the Descartes computation output
    /// @param _index index identifying the game
    function applyVerificationResult(uint256 _index) public onlyActive(_index) {
        GameContext storage context = instances[_index];
        context.applyVerificationResult(_index, descartes);
        deactivate(_index);
    }

    /// @notice Indicates whether a given player is concerned about a game
    /// @param _index index identifying the game
    /// @param _player a player's address
    /// @return true if the player is concerned about the game, false otherwise
    function isConcerned(uint256 _index, address _player) public view override onlyInstantiated(_index) returns (bool) {
        GameContext storage context = instances[_index];
        return context.isConcerned(_player);
    }

    /// @notice Returns state of the instance for offchain usage concerning given validator.
    /// @param _index index identifying the game
    /// @return _isDescartesInstantiated whether an offchain Descartes computation has been instantiated for this game
    function getState(uint256 _index, address)
        public
        view
        onlyInstantiated(_index)
        returns (bool _isDescartesInstantiated)
    {
        GameContext storage context = instances[_index];
        return context.isDescartesInstantiated;
    }

    /// @notice Retrieves sub-instances of the game (required method for Instantiator, used by offchain dispatcher code).
    /// @param _index index identifying the game
    function getSubInstances(uint256 _index, address)
        public
        view
        override
        onlyInstantiated(_index)
        returns (address[] memory _addresses, uint256[] memory _indices)
    {
        GameContext storage context = instances[_index];
        if (context.isDescartesInstantiated) {
            // sub-instance is the associated Descartes computation
            address[] memory addresses = new address[](1);
            uint256[] memory indices = new uint256[](1);
            addresses[0] = address(descartes);
            indices[0] = context.descartesIndex;
            return (addresses, indices);
        } else {
            // no sub-instances
            return (new address[](0), new uint256[](0));
        }
    }
}
