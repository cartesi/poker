#!/bin/sh
# Run poker program
# Called from inside cartesi machine
# Expects poker program and libs to be mounted in /mnt/poker 

set -e
export LD_LIBRARY_PATH=/mnt/poker/lib
export PATH=/mnt/poker:$PATH
cd /mnt/poker
echo === Running risc-v program: $@
exec $@
