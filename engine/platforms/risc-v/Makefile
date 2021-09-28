PLAT=risc-v
IMGNAME=poker-toolchain-$(PLAT)
TAG=dev

BUILD_BASE=`pwd`/build
POKER_ENGINE_BASE=`cd ../../poker-lib; pwd`
PATCHES_BASE=`cd ../../patches; pwd`
XFER_BASE=`pwd`/../.xfer

RUN_TOOLCHAIN=docker run --rm  \
        -v `pwd`:/poker/src  \
        -v $(BUILD_BASE):/poker/build  \
        -v $(POKER_ENGINE_BASE):/poker/poker-lib-base \
        -v $(PATCHES_BASE):/poker/patches  \
        -v $(XFER_BASE):/poker/xfer \
        -w /poker/src \
        -e HOSTNAME=`hostname` \
        -it $(IMGNAME):$(TAG)

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

machine:
	./make-machine.sh

verify:
	time ./verify.sh

LIBSCLEAN := $(addsuffix .clean,$(LIBS))

clean: $(LIBSCLEAN)
	rm -r build

$(LIBSCLEAN): %.clean:
	$(MAKE) -C $* clean

$(XFER_BASE):
	mkdir -p $(XFER_BASE)

.PHONY: shell $(LIBS)
