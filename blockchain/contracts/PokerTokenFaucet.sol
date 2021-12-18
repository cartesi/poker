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
    uint256 requestTokensAmount = 1000;
    uint256 requestFundsAmount = 0.5 ether;
    PokerToken tokenInstance;
    address owner;
    
    receive() external payable {
    }

    /// @notice Constructor
    /// @param _pokerTokenAddress address of the PokerToken ERC20 contract
    constructor(address _pokerTokenAddress) {
        require(_pokerTokenAddress != address(0));
        tokenInstance = PokerToken(_pokerTokenAddress);
        owner = msg.sender;
    }

    /// @notice Requests the currently specified amount of tokens for the specified address
    /// @param _address address to transfer tokens to
    function requestTokens(address _address) public {
        require(tokenInstance.balanceOf(address(this)) >= requestTokensAmount, "Insufficient tokens in faucet");
        tokenInstance.transfer(_address, requestTokensAmount);
    }

    /// @notice Requests the currently specified amount of network funds (ETH) for the specified address
    /// @param _address address to transfer funds to
    function requestFunds(address payable _address) public {
        require(address(this).balance >= requestFundsAmount, "Insufficient funds in faucet");
        _address.transfer(requestFundsAmount);
    }

    /// @notice Retrieves the currently specified amount to be transferred when requesting tokens
    /// @return the specified amount
    function getRequestTokensAmount() public view returns (uint256) {
        return requestTokensAmount;
    }

    /// @notice Retrieves the currently specified amount to be transferred when requesting network funds (ETH)
    /// @return the specified amount
    function getRequestFundsAmount() public view returns (uint256) {
        return requestFundsAmount;
    }

    /// @notice Specifies the amount to be transferred when requesting tokens
    /// @param _amount the new amount specified
    function setRequestTokensAmount(uint256 _amount) public {
        require(msg.sender == owner, "Only faucet owner can set request amounts");
        requestTokensAmount = _amount;
    }

    /// @notice Specifies the amount to be transferred when requesting network funds (ETH)
    /// @param _amount the new amount specified
    function setRequestFundsAmount(uint256 _amount) public {
        require(msg.sender == owner, "Only faucet owner can set request amounts");
        requestFundsAmount = _amount;
    }
}
