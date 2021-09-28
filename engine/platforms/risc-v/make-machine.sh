#!/bin/bash

MACHINES_DIR=`pwd`/../../../blockchain/descartes-env/machines
MACHINE_TEMP_DIR=.temp
CARTESI_PLAYGROUND_DOCKER=cartesi/playground:0.3.0

if [ -d "$MACHINE_TEMP_DIR" ]; then
  rm -r $MACHINE_TEMP_DIR
fi

docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -w /home/$(id -u -n) \
  --rm $CARTESI_PLAYGROUND_DOCKER cartesi-machine \
    --max-mcycle=0 \
    --initial-hash \
    --store="$MACHINE_TEMP_DIR" \
    --flash-drive="label:verifier,filename:build/poker-lib.ext2" \
    --flash-drive="label:metadata,length:1<<12" \
    --flash-drive="label:players,length:1<<12" \
    --flash-drive="label:turnsMetadata,length:1<<16" \
    --flash-drive="label:turnsData,length:1<<20" \
    --flash-drive="label:verificationInfo,length:1<<12" \
    --flash-drive="label:output,length:1<<12" \
    -- $'LD_LIBRARY_PATH=/mnt/verifier/lib /mnt/verifier/verify $(flashdrive players)  $(flashdrive turnsMetadata)  $(flashdrive verificationInfo) $(flashdrive turnsData) $(flashdrive output)'


mkdir -p $MACHINES_DIR

MACHINE_TARGET_DIR=$MACHINES_DIR/$(docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -h playground \
  -w /home/$(id -u -n) \
  --rm $CARTESI_PLAYGROUND_DOCKER cartesi-machine-stored-hash $MACHINE_TEMP_DIR/)

if [ -d "$MACHINE_TARGET_DIR" ]; then
  rm -r $MACHINE_TARGET_DIR
fi
mv $MACHINE_TEMP_DIR $MACHINE_TARGET_DIR
