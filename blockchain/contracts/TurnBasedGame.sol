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

    using TurnBasedGameContext for GameContext;

    // Descartes instance used for triggering verified computations
    DescartesInterface descartes;
    // Logger instance used for storing data in the event history
    Logger logger;
    // index of an empty chunk of data stored in the logger
    uint256 emptyDataLogIndex;

    // turn data log2size fixed as 12 (4K)
    uint8 constant turnDataLog2Size = 12;

    // game instances
    mapping(uint256 => GameContext) internal instances;


    /// @notice Constructor
    /// @param descartesAddress address of the Descartes contract
    /// @param loggerAddress address of the Logger contract
    constructor(address descartesAddress, address loggerAddress) {
        descartes = DescartesInterface(descartesAddress);
        logger = Logger(loggerAddress);

        // stores an empty chunk of data in the logger and records its index
        bytes8[] memory emptyData = new bytes8[](1);
        bytes32 logHash = logger.calculateMerkleRootFromData(turnDataLog2Size, emptyData);
        emptyDataLogIndex = logger.getLogIndex(logHash);
    }


    /// @notice Starts a new game
    /// @param _gameTemplateHash template hash for the Cartesi Machine computation that verifies the game (identifies the game computation/logic)
    /// @param _gameMetadata game-specific initial metadata/parameters
    /// @param _validators addresses of the validator nodes that will run a Descartes verification should it be needed
    /// @param _players addresses of the players involved
    /// @param _playerFunds funds/balances that each player is bringing into the game
    /// @param _playerInfos game-specific information for each player
    /// @return index of the game instance
    function startGame(
        bytes32 _gameTemplateHash,
        bytes memory _gameMetadata,
        address[] memory _validators,
        address[] memory _players,
        uint[] memory _playerFunds,
        bytes[] memory _playerInfos
    ) public
        returns (uint256)
    {
        // creates new context
        GameContext storage context = instances[currentIndex];
        context.gameTemplateHash = _gameTemplateHash;
        context.gameMetadata = _gameMetadata;
        context.validators = _validators;
        // TODO: check/lock funds, preferrably use a token and not ether
        context.players = _players;
        context.playerFunds = _playerFunds;
        context.playerInfos = _playerInfos;

        // emits event for new game        
        emit TurnBasedGameContext.GameReady(currentIndex, context);

        active[currentIndex] = true;
        return currentIndex++;
    }


    /// @notice Returns game context
    /// @param _index index identifying the game
    /// @return GameContext struct for the specified game
    function getContext(uint256 _index) public view
        onlyInstantiated(_index)
        returns(GameContext memory)
    {
        return instances[_index];
    }


    /// @notice Submits a new turn for a given game
    /// @param _index index identifying the game
    /// @param _stateHash game state for which the turn applies
    /// @param _data game-specific turn data (array of 64-bit words)
    function submitTurn(uint256 _index, bytes32 _stateHash, bytes8[] memory _data) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];
        context.submitTurn(_index, _stateHash, _data, descartes, logger, turnDataLog2Size);
    }


    /// @notice Challenges game state, triggering a verification by a Descartes computation
    /// @param _index index identifying the game
    /// @return index of the Descartes computation
    function challengeGame(uint256 _index) public
        onlyActive(_index)
        returns (uint256)
    {
        GameContext storage context = instances[_index];
        return context.challengeGame(_index, descartes, logger, turnDataLog2Size, emptyDataLogIndex);
    }


    /// @notice Claims game has ended with the provided result (share of locked funds)
    /// @param _index index identifying the game
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    function claimResult(uint256 _index, uint[] memory _fundsShare) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];
        context.claimResult(_index, _fundsShare);
    }
    

    /// @notice Confirms game results previously claimed
    /// @param _index index identifying the game
    function confirmResult(uint256 _index) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];
        bool isConsensus = context.confirmResult();
        if (isConsensus == true) {
            // if all players agree, applies claimed result and ends game
            context.applyResult(_index, context.claimedFundsShare);
            deactivate(_index);
        }
    }
    

    /// @notice Applies the result of a game verified by Descartes, transferring funds according to the Descartes computation output
    /// @param _index index identifying the game
    function applyVerificationResult(uint256 _index) public
        onlyActive(_index)
    {
        GameContext storage context = instances[_index];
        context.applyVerificationResult(_index, descartes);
        deactivate(_index);
    }


    /// @notice Indicates whether a given player is concerned about a game
    /// @param _index index identifying the game
    /// @param _player a player's address
    /// @return true if the player is concerned about the game, false otherwise
    function isConcerned(uint256 _index, address _player) public view override
        onlyInstantiated(_index)
        returns (bool)
    {
        GameContext storage context = instances[_index];
        return context.isConcerned(_player);
    }


    /// @notice Retrieves sub-instances of the game (required method for Instantiator).
    /// @param _index index identifying the game
    function getSubInstances(uint256 _index, address) public view override
        onlyInstantiated(_index)
        returns (address[] memory _addresses, uint256[] memory _indices)
    {
        // always empty (no sub-instances for the game)
        return (new address[](0), new uint256[](0));
    }    
}
