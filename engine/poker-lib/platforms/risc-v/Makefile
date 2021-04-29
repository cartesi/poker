PLAT=risc-v
IMGNAME=poker-toolchain-$(PLAT)
TAG=dev

BUILD_BASE=`pwd`/build
POKER_ENGINE_BASE=`cd ../../poker-lib; pwd`
PATCHES_BASE=`cd ../../patches; pwd`

RUN_TOOLCHAIN=docker run --rm  \
        -v `pwd`:/poker/src  \
        -v $(BUILD_BASE):/poker/build  \
        -v $(POKER_ENGINE_BASE):/poker/poker-lib-base \
        -v $(PATCHES_BASE):/poker/patches  \
        -w /poker/src \
        -e HOSTNAME=`hostname` \
        -it $(IMGNAME):$(TAG)

LIBS=libgmp libgpg-error libgcrypt libtmcg poker-lib

all: $(LIBS)

$(LIBS): toolchain $(BUILD_BASE)
	$(RUN_TOOLCHAIN) make -C /poker/src/$@

shell: $(BUILD_BASE)
	$(RUN_TOOLCHAIN) /bin/bash

$(BUILD_BASE):
	mkdir -p $(BUILD_BASE)

run-hello:
	./run-cartesi.sh hello'

run-sanity-check:
	./run-cartesi.sh poker-lib-sample'

toolchain:
	docker build -t $(IMGNAME):$(TAG) .

.PHONY: shell $(LIBS)
