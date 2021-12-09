UNAME = $(shell uname -s)
BUILD_BASE = /poker/build
LIB_BASE = $(BUILD_BASE)/lib

ifeq ($(UNAME),Darwin)
  POKER_BUILD_ENV=Darwin
  BUILD_BASE=$(shell cd ../..; pwd)/build
endif

INSTALL_DIR = $(BUILD_BASE)/poker-lib
CXX = g++
AR = ar
SHLIBEXT=.so
LIBREFS=
CXXFLAGS = -std=c++11 -fPIC -I$(BUILD_BASE)/include/poker-eval -I$(BUILD_BASE)/include 
LIBREFS = -L$(LIB_BASE) -lgpg-error -lgcrypt -lgmp -lTMCG -lpoker-eval

ifneq ($(filter $(POKER_BUILD_ENV),x64 Darwin risc-v),)
    LIBREFS += -lbrotlidec -lbrotlienc -lbrotlicommon  
endif
ifeq ($(POKER_BUILD_ENV),wasm)
  CXX = emcc
  CXXFLAGS += -O3 -s ALLOW_TABLE_GROWTH \
              -s ALLOW_MEMORY_GROWTH=1 \
              -s BUILD_AS_WORKER=1 \
              -s EXPORTED_RUNTIME_METHODS=['cwrap, UTF8ToString, free'] \
              --bind -fexceptions -std=c++11
   LIBREFS += -lbrotlidec-static -lbrotlienc-static -lbrotlicommon-static
endif
ifeq ($(POKER_BUILD_ENV),risc-v)
  CXX = riscv64-cartesi-linux-gnu-g++
  CXXFLAGS += -Wl,-rpath-link=/mnt/poker
endif
ifeq ($(POKER_BUILD_ENV),Darwin)
  CXX=clang++
  SHLIBEXT=.dylib
  CXXFLAGS += -mmacosx-version-min=10.10
endif

CXXFLAGS += $(LIBREFS)

TESTS = test-solver \
    test-poker-lib-c-api \
    test-compression \
    test-codec \
    test-validator \
    test-game-generator \
    test-player \
    test-verifier \
    test-bignumber

# make targets to build
TARGETS=

# programs or libraries to build 
PROGRAMS =

# Files to install in /poker/build/poker-lib
INSTALL_FILES =

# rules to execute after INSTALL_FILES are copied
POST_INSTALL =

# program to use as the loader of unit tests
TEST_LOADER =

ifeq ($(POKER_BUILD_ENV),wasm)
PROGRAMS += poker-lib-wasm.js
    INSTALL_FILES += \
        poker-lib-wasm.wasm \
        poker-lib-wasm.js \
        poker-lib.js \
        test-poker-lib.html
    TEST_LOADER = node
else
    PROGRAMS += verify
    PROGRAMS += generate
    PROGRAMS += libpoker$(SHLIBEXT)
    TESTS += test-game-playback
endif

ifneq ($(filter $(POKER_BUILD_ENV),x64 Darwin),)
    TARGETS += node-addon
endif

PROGRAMS += $(TESTS)
INSTALL_FILES += $(PROGRAMS)
TARGETS += $(PROGRAMS)

POKER_LIB_OBJS=common.o \
            poker-lib-c-api.o \
            game-generator.o \
            verifier.o \
            validator.o \
            game-playback.o \
            blob.o \
            player.o \
            messages.o \
            compression.o \
            bignumber.o \
            solver.o \
            participant.o \
            unencrypted_participant.o \
            poker-lib.o \
            referee.o \
            game-state.o \
            codec.o
            

all: $(TARGETS)

install: $(PROGRAMS) copy_install_files $(POST_INSTALL)

copy_install_files:
	mkdir -p $(INSTALL_DIR) && \
    for f in "$(INSTALL_FILES)"; do cp $$f $(INSTALL_DIR); done

poker-lib.a: $(POKER_LIB_OBJS)
	$(AR) rcs $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@  $^

libpoker$(SHLIBEXT): $(POKER_LIB_OBJS)
	$(CXX) $(CXXFLAGS) -shared -o $@ $(POKER_LIB_OBJS) && \
  cp $@ $(BUILD_BASE)/lib

poker-lib-wasm.js: poker-lib-wasm.cpp poker-lib.a
	$(CXX) $(CXXFLAGS) $^ -o $@

node-addon: libpoker$(SHLIBEXT)
	make -C node-addon

test-%: test-%.cpp poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@ $^

verify: verify.cpp  poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@ $^
    
generate: generate.cpp poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@ $^

RUNTESTS := $(addsuffix .run,$(TESTS))

test: $(RUNTESTS)

$(RUNTESTS): %.run:
	$(TEST_LOADER) ./$*
    
clean:
	for f in "$(INSTALL_FILES)"; do \
        if [ -f $$f  ]; then rm $$f ; fi\
    done

distclean:
	for f in "$(INSTALL_FILES)"; do \
        if [ -f $(INSTALL_DIR)/$$f  ]; then rm $(INSTALL_DIR)/$$f ; fi\
    done
	

.PHONY: test

