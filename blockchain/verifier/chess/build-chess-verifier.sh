#!/bin/bash
CARTESI_PLAYGROUND_DOCKER=cartesi/playground:0.3.0

yarn build

# uses playground to build an ext2 file-system file containing the public key and the verification script
docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -w /home/$(id -u -n) \
  --rm $CARTESI_PLAYGROUND_DOCKER /bin/bash -c '\
    mkdir -p ext2 &&
    cp dist/chess-bundle.js ext2/chess-run.js &&
    cp chess-run.sh ext2/chess-run.sh &&
    genext2fs -b 1024 -d ext2 chess-verifier.ext2 \
  '
