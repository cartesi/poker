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

LIBS=libgmp libgpg-error libgcrypt libtmcg XPokerEval brotli poker-lib

all: $(LIBS)

$(LIBS): toolchain $(BUILD_BASE)
	$(RUN_TOOLCHAIN) make -C /poker/src/$@

shell: $(BUILD_BASE) $(XFER_BASE)
	$(RUN_TOOLCHAIN) /bin/bash

$(BUILD_BASE):
	mkdir -p $(BUILD_BASE)

toolchain:
	docker build -t $(IMGNAME):$(TAG) .

LIBSCLEAN := $(addsuffix .clean,$(LIBS))

$(XFER_BASE):
	mkdir -p $(XFER_BASE)

generate: $(XFER_BASE)
	$(RUN_TOOLCHAIN) /poker/build/poker-lib/generate 300 200 10 /poker/xfer

verify:
	$(RUN_TOOLCHAIN) /poker/build/poker-lib/verify /poker/xfer/player-info.raw  /poker/xfer/turn-metadata.raw  /poker/xfer/verification-info.raw /poker/xfer/turn-data.raw /poker/xfer/result.raw

clean: $(LIBSCLEAN)
	rm -rf build

$(LIBSCLEAN): %.clean:
	$(MAKE) -C $* clean
    
.PHONY: shell $(LIBS)
