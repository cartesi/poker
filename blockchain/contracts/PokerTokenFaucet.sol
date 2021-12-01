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
    
    /// @notice Constructor
    /// @param _pokerTokenAddress address of the PokerToken ERC20 contract
    constructor(address _pokerTokenAddress) {
        require(_pokerTokenAddress != address(0));
        tokenInstance = PokerToken(_pokerTokenAddress);
    }

    /// @notice Requests a fixed amount of tokens for the specified address
    /// @param _address address to transfer tokens to
    function requestTokens(address _address) public {
        require(allowedToWithdraw(_address));
        tokenInstance.transfer(_address, TOKEN_AMOUNT);
    }

    /// @notice Verifies if a given account address is allowed to withdraw tokens
    /// @param _address address to verify
    /// @return true if the account is allowed to withdraw, false otherwise
    function allowedToWithdraw(address _address) internal pure returns (bool) {
        // TODO: check using access control contract
        return true;
    }
}
