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

    // PokerToken ERC-20 instance
    PokerToken tokenInstance;

    // contract owner
    address owner;
    
    // amounts to be transferred on each request
    uint256 requestTokensAmount = 1000;
    uint256 requestFundsAmount = 0.5 ether;

    // mapping for registered coupons and their corresponding validity
    mapping(bytes32 => bool) internal registeredCoupons;

    // flag indicating whether the faucet is suspended or not
    bool suspended;

    // event emitted when a coupon is redeemed
    event CouponRedeemed(uint256 indexed _coupon, address indexed _address, uint256 _tokensAmount, uint256 _fundsAmount);

    receive() external payable {
    }

    /// @notice Constructor
    /// @param _pokerTokenAddress address of the PokerToken ERC20 contract
    constructor(address _pokerTokenAddress) {
        require(_pokerTokenAddress != address(0));
        tokenInstance = PokerToken(_pokerTokenAddress);
        owner = msg.sender;
    }

    /// @notice Redeems a coupon
    /// @param _coupon coupon value, whose hash must have been previously registered by calling registerCoupon
    /// @param _address address to transfer tokens to
    function redeemCoupon(uint256 _coupon, address payable _address) public {
        require(suspended == false, "Faucet is suspended");

        // checks if coupon is valid
        bytes32 couponHash = keccak256(abi.encodePacked(_coupon));
        require(registeredCoupons[couponHash] == true, "Coupon not registered");
        
        // ensures faucet has enough tokens nad funds
        require(tokenInstance.balanceOf(address(this)) >= requestTokensAmount, "Insufficient tokens in faucet");
        require(address(this).balance >= requestFundsAmount, "Insufficient funds in faucet");

        // transfers tokens nad funds
        tokenInstance.transfer(_address, requestTokensAmount);
        _address.transfer(requestFundsAmount);

        // marks coupon as used
        registeredCoupons[couponHash] = false;

        // emits event logging that coupon was redeemeed
        emit CouponRedeemed(_coupon, _address, requestTokensAmount, requestFundsAmount);
    }

    /// @notice Registers a new coupon using its hash
    /// @param _couponHash hash of the coupon to be registered
    function registerCoupon(bytes32 _couponHash) public onlyOwner {
        require(registeredCoupons[_couponHash] == false, "Coupon already registered");
        registeredCoupons[_couponHash] = true;
    }

    /// @notice Requests the currently specified amount of tokens for the specified address
    /// @param _address address to transfer tokens to
    function requestTokens(address _address) public onlyOwner {
        require(tokenInstance.balanceOf(address(this)) >= requestTokensAmount, "Insufficient tokens in faucet");
        tokenInstance.transfer(_address, requestTokensAmount);
    }

    /// @notice Requests the currently specified amount of network funds (ETH) for the specified address
    /// @param _address address to transfer funds to
    function requestFunds(address payable _address) public onlyOwner {
        require(address(this).balance >= requestFundsAmount, "Insufficient funds in faucet");
        _address.transfer(requestFundsAmount);
    }

    /// @notice Retrieves whether the faucet is currently suspended
    /// @return true if suspended, false otherwise
    function isSuspended() public view returns (bool) {
        return suspended;
    }

    /// @notice Sets whether the faucet is currently suspended
    /// @param _suspended true if faucet is to be suspended, false otherwise
    function setSuspended(bool _suspended) public onlyOwner {
        suspended = _suspended;
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
    function setRequestTokensAmount(uint256 _amount) public onlyOwner {
        requestTokensAmount = _amount;
    }

    /// @notice Specifies the amount to be transferred when requesting network funds (ETH)
    /// @param _amount the new amount specified
    function setRequestFundsAmount(uint256 _amount) public onlyOwner {
        requestFundsAmount = _amount;
    }

    /// @notice Allows calls only from the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only faucet owner can call method");
        _;
    }    
}
