PLAT=x64
IMGNAME=poker-toolchain-$(PLAT)
TAG=dev
BUILD_BASE=`pwd`/build
POKER_LIB_BASE=`cd ../../poker-lib; pwd`

RUN_TOOLCHAIN=docker run --rm  \
        -v `pwd`:/poker/src  \
        -v $(BUILD_BASE):/poker/build  \
        -v $(POKER_LIB_BASE):/poker/poker-lib-base \
        -v $(POKER_LIB_BASE):/poker/poker-lib-base \
        -w /poker/src \
        -e HOSTNAME=`hostname` \
        -it $(IMGNAME):$(TAG) \

LIBS=libgmp libgpg-error libgcrypt libtmcg poker-lib

all: $(LIBS)

$(LIBS): toolchain $(BUILD_BASE)
	$(RUN_TOOLCHAIN) make -C /poker/src/$@

run-hello:
	$(RUN_TOOLCHAIN) /poker/build/poker-lib/hello

run-poker-lib-sample:
	$(RUN_TOOLCHAIN) /poker/build/poker-lib/poker-lib-sample

shell: $(BUILD_BASE)
	$(RUN_TOOLCHAIN) /bin/bash

$(BUILD_BASE):
	mkdir -p $(BUILD_BASE)


toolchain:
	docker build -t $(IMGNAME):$(TAG) .

.PHONY: shell $(LIBS)
