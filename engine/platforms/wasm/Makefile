PLAT=wasm
IMGNAME=poker-toolchain-$(PLAT)
TAG=dev
BUILD_BASE=`pwd`/build
POKER_LIB_BASE=`cd ../../poker-lib; pwd`
HTTP_SERVER_PORT=1234
PATCHES_BASE=`cd ../../patches; pwd`

RUN_TOOLCHAIN=docker run --rm  \
        -v `pwd`:/poker/src  \
        -v $(BUILD_BASE):/poker/build  \
        -v $(PATCHES_BASE):/poker/patches  \
        -v $(POKER_LIB_BASE):/poker/poker-lib-base \
        -w /poker/src \
         -p $(HTTP_SERVER_PORT):1234 \
        -e HOSTNAME=`hostname` \
        -e EMSCRIPTEN_ROOT=/poker/emsdk/upstream/emscripten \
        -e LD_LIBRARY_PATH=/poker/build/lib \
        -it $(IMGNAME):$(TAG) \

LIBS=libgmp libgpg-error libgcrypt libtmcg XPokerEval poker-lib

all: $(LIBS)

$(LIBS): toolchain $(BUILD_BASE)
	$(RUN_TOOLCHAIN) /bin/bash -c 'source /root/.bashrc; make -C /poker/src/$@'

run-server:
	$(RUN_TOOLCHAIN) /bin/bash -c 'source /root/.bashrc; emrun --no_browser --port 1234 /poker/build/poker-lib/test-poker-lib.html'

shell: $(BUILD_BASE)
	$(RUN_TOOLCHAIN) /bin/bash

$(BUILD_BASE):
	mkdir -p $(BUILD_BASE)

toolchain:
	docker build -t $(IMGNAME):$(TAG) .

.PHONY: shell $(LIBS) run-hello run-poker-lib-sample run-poker-lib-js-sample run-server
