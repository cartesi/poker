#/bin/sh

set -e

# Launches a program inside the cartesi machine

run_from_sdk() {
    eval `make -C ${CARTESI_SDKBASE}/emulator env`
    pushd ${CARTESI_SDKBASE}/emulator/src
    cartesi-machine.lua $@
    popd
}

if [ `which cartesi-machine.lua` ]; then
    cartesi-machine.lua $@
elif [ ${CARTESI_SDKBASE} ]; then
    run_from_sdk $@
else
    echo "I can't find cartesi-machine.lua "
    exit -1
fi
