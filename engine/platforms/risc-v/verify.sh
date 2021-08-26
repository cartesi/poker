#!/bin/bash

# Verify the game stored in ../.xfer

CARTESI_PLAYGROUND_DOCKER=cartesi/playground:0.3.0

docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -v `pwd`/../.xfer:/poker/xfer \
  -w /home/$(id -u -n) \
  --rm $CARTESI_PLAYGROUND_DOCKER cartesi-machine \
    --flash-drive="label:verifier,filename:build/poker-lib.ext2" \
    --flash-drive="label:metadata,length:1<<12" \
    --flash-drive="label:players,filename:/poker/xfer/player-info.raw" \
    --flash-drive="label:turnsMetadata,filename:/poker/xfer/turn-metadata.raw" \
    --flash-drive="label:turnsData,filename:/poker/xfer/turn-data.raw" \
    --flash-drive="label:verificationInfo,filename:/poker/xfer/verification-info.raw" \
    --flash-drive="label:output,filename:/poker/xfer/output.raw,shared" \
    -- $'LD_LIBRARY_PATH=/mnt/verifier/lib /mnt/verifier/verify $(flashdrive players)  $(flashdrive turnsMetadata)  $(flashdrive verificationInfo) $(flashdrive turnsData) $(flashdrive output)'
