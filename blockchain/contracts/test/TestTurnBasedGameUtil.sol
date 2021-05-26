// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title TurnBasedGameUtil
/// @author Milton Jonathan
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../TurnBasedGameUtil.sol";

contract TestTurnBasedGameUtil {

    function getLog2Ceil(uint256 _number) public pure
        returns (uint8)
    {
        return TurnBasedGameUtil.getLog2Ceil(_number);
    }

    function bytes2bytes8(bytes calldata _data, uint _start, uint _end) public pure
        returns (bytes8[] memory)
    {
        uint outputSize = 0;
        if (_end > _start) {
            outputSize = (_end - _start - 1)/8 + 1;
        }
        bytes8[] memory output = new bytes8[](outputSize);
        TurnBasedGameUtil.bytes2bytes8(_data, _start, _end, output);
        return output;
    }    

    function checkResult(uint[] memory _playerFunds, uint[] memory _fundsShare) public pure
        returns (uint _fundsToBurn)
    {
        return TurnBasedGameUtil.checkResult(_playerFunds, _fundsShare);
    }

    function updateClaimAgreementMask(uint256 _claimAgreementMask, address[] memory _players, address _agreeingPlayer) public pure
        returns (uint256)
    {
        return TurnBasedGameUtil.updateClaimAgreementMask(_claimAgreementMask, _players, _agreeingPlayer);
    }

}
