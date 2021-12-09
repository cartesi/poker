PLAT=x64
IMGNAME=poker-toolchain-$(PLAT)
TAG=dev
BUILD_BASE=`pwd`/build
PATCHES_BASE=`cd ../../patches; pwd`
POKER_LIB_BASE=`cd ../../poker-lib; pwd`
XFER_BASE=`pwd`/../.xfer

RUN_TOOLCHAIN=docker run --rm  \
        -v `pwd`:/poker/src  \
        -v $(BUILD_BASE):/poker/build  \
        -v $(PATCHES_BASE):/poker/patches  \
        -v $(POKER_LIB_BASE):/poker/poker-lib-base \
        -v $(POKER_LIB_BASE):/poker/poker-lib-base \
        -v $(XFER_BASE):/poker/xfer \
        -w /poker/src \
        -e HOSTNAME=`hostname` \
        -it $(IMGNAME):$(TAG) \

LIBS=libgmp libgpg-error libgcrypt libtmcg poker-eval brotli poker-lib

all: $(LIBS)

$(LIBS): toolchain $(BUILD_BASE)
	$(RUN_TOOLCHAIN) make -C /poker/src/$@

shell: $(BUILD_BASE) $(XFER_BASE)
	$(RUN_TOOLCHAIN) /bin/bash

$(BUILD_BASE):
	mkdir -p $(BUILD_BASE)

toolchain:
	docker build --no-cache -t $(IMGNAME):$(TAG) .

LIBSCLEAN := $(addsuffix .clean,$(LIBS))

$(XFER_BASE):
	mkdir -p $(XFER_BASE)

ALICE_MONEY ?= 100
BOB_MONEY ?= 100
BIG_BLIND ?= 10
AGGRESSOR ?= -1 
WINNER ?= -1
generate: $(XFER_BASE)
	$(RUN_TOOLCHAIN) /bin/bash -c "POKER_LOGGING=1  /poker/build/poker-lib/generate $(ALICE_MONEY) $(BOB_MONEY) $(BIG_BLIND) $(AGGRESSOR) $(WINNER) /poker/xfer"

verify:
	$(RUN_TOOLCHAIN) /poker/build/poker-lib/verify /poker/xfer/player-info.raw  /poker/xfer/turn-metadata.raw  /poker/xfer/verification-info.raw /poker/xfer/turn-data.raw /poker/xfer/result.raw

clean: $(LIBSCLEAN)
	rm -r build

$(LIBSCLEAN): %.clean:
	$(MAKE) -C $* clean
    
.PHONY: shell $(LIBS)
