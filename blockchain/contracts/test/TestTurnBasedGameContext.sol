// Copyright 2021 Cartesi Pte. Ltd.

// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

/// @title TurnBasedGameContext
/// @author Milton Jonathan
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../TurnBasedGameContext.sol";

contract TestTurnBasedGameContext {

    event DriveBuilt(DescartesInterface.Drive _drive);

    GameContext context;

    function buildDirectDrive(bytes memory _data, uint64 _drivePosition)
        public
        pure
        returns (DescartesInterface.Drive memory _drive)    
    {
        return TurnBasedGameContext.buildDirectDrive(_data, _drivePosition);
    }

    function buildTurnsMetadataDrive(
        GameContext memory _context,
        uint8 _turnChunkLog2Size,
        uint64 _drivePosition
    )
        public
        returns (DescartesInterface.Drive memory _drive)    
    {
        delete TestTurnBasedGameContext.context.turns;
        for (uint i = 0; i < _context.turns.length; i++) {
            TestTurnBasedGameContext.context.turns.push(_context.turns[i]);
        }

        _drive = TurnBasedGameContext.buildTurnsMetadataDrive(TestTurnBasedGameContext.context, _turnChunkLog2Size, _drivePosition);
        emit DriveBuilt(_drive);
        return _drive;
    }

    function buildTurnsDataDrive(
        GameContext memory _context,
        address _loggerAddress,
        uint8 _turnChunkLog2Size,
        uint256 _emptyDataLogIndex,
        uint64 _drivePosition
    )
        public
        returns (DescartesInterface.Drive memory _drive)    
    {
        delete TestTurnBasedGameContext.context.turns;
        for (uint i = 0; i < _context.turns.length; i++) {
            TestTurnBasedGameContext.context.turns.push(_context.turns[i]);
        }

        _drive = TurnBasedGameContext.buildTurnsDataDrive(TestTurnBasedGameContext.context, Logger(_loggerAddress), _turnChunkLog2Size, _emptyDataLogIndex, _drivePosition);
        emit DriveBuilt(_drive);
        return _drive;
    }

}
