#/bin/sh

set -e

BASE=`PWD`
FLASH=${BASE}/build/poker-lib.ext2

time ./cartesi-machine-run.sh \
    --flash-drive=label:poker,filename:${FLASH} \
    -i /mnt/poker/run.sh $@
