// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title PokerToken
/// @author Claudio Silva
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

/// @title PokerToken
/// @notice Contract for handling tokens that will be distributed for the poker game players
contract PokerToken is ERC20PresetMinterPauser {
    constructor() public ERC20PresetMinterPauser("Cartesi Poker Token", "CTPT") {
        _setupDecimals(8);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20PresetMinterPauser) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
