// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title PokerTokenFaucet
/// @author Milton Jonathan
pragma solidity ^0.7.0;

import "./PokerToken.sol";

/// @title PokerTokenFaucet
/// @notice Contract for controling distribution of POKER tokens to the public
contract PokerTokenFaucet {
    uint256 public constant TOKEN_AMOUNT = 1000;
    PokerToken tokenInstance;
    
    constructor(address _pokerTokenAddress) {
        require(_pokerTokenAddress != address(0));
        tokenInstance = PokerToken(_pokerTokenAddress);
    }

    function requestTokens() public {
        require(allowedToWithdraw(msg.sender));
        tokenInstance.transfer(msg.sender, TOKEN_AMOUNT);
    }

    function allowedToWithdraw(address _address) internal pure returns (bool) {
        // TODO: check using access control contract
        return true;
    }
}
