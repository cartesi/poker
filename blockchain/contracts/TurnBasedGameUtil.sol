// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title TurnBasedGameLib
/// @author Milton Jonathan
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@cartesi/descartes-sdk/contracts/DescartesInterface.sol";
import "@cartesi/logger/contracts/Logger.sol";
import "@cartesi/util/contracts/InstantiatorImpl.sol";

/// @title TurnBasedGameUtil
/// @notice Library with utility methods used by the TurnBasedGame contract
library TurnBasedGameUtil {

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


    /// @notice Ensures a given result is acceptable considering the player funds locked for the game
    /// @param _playerFunds funds originally submitted by the players
    /// @param _fundsShare result of the game given as a distribution of the funds previously locked
    /// @return _fundsToBurn the amount of funds to burn as a result of some of the locked funds not being distributed to any player
    function checkResult(uint[] memory _playerFunds, uint[] memory _fundsShare) internal pure
        returns (uint _fundsToBurn)
    {
        require(_playerFunds.length == _fundsShare.length, "Resulting funds distribution does not match number of players in the game");

        // checks if given address belongs to one of the game players
        uint totalPlayerFunds = 0;
        uint totalFundsShare = 0;
        for (uint i = 0; i < _playerFunds.length; i++) {
            totalPlayerFunds += _playerFunds[i];
            totalFundsShare += _fundsShare[i];
        }
        require(totalPlayerFunds >= totalFundsShare, "Resulting funds distribution exceeds amount locked by the players for the game");

        // amount to burn corresponds to the difference between total original player funds and resulting distribution
        return totalPlayerFunds - totalFundsShare;
    }

    /// @notice Updates mask indicating players that agree with the claim
    /// @param _claimAgreementMask current agreement mask, where the i-th bit indicates if player i has agreed
    /// @param _players array with addresses of involved parties
    /// @param _agreeingPlayer address of the party that has now indicated agreement
    /// @return updated claim agreement mask
    function updateClaimAgreementMask(uint256 _claimAgreementMask, address[] memory _players, address _agreeingPlayer) internal pure
        returns (uint256)
    {
        for (uint i = 0; i < _players.length; i++) {
            if (_agreeingPlayer == _players[i]) {
                _claimAgreementMask = (_claimAgreementMask | (uint256(1) << i));
                break;
            }
        }
        return _claimAgreementMask;
    }

}
