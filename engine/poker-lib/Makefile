BUILD_BASE = /poker/build
INSTALL_DIR = $(BUILD_BASE)/poker-lib
CXX = g++
CXXFLAGS = -I$(BUILD_BASE)/include/poker-eval -I$(BUILD_BASE)/include -L$(BUILD_BASE)/lib \
           -lgpg-error -lgcrypt -lgmp -lTMCG -lpoker-eval

ifeq ($(POKER_BUILD_ENV),wasm)
CXX = emcc
CXXFLAGS += -O3 -s ALLOW_TABLE_GROWTH \
            -s ALLOW_MEMORY_GROWTH=1 \
            -s BUILD_AS_WORKER=1 \
            -s EXPORTED_RUNTIME_METHODS=['cwrap, UTF8ToString, free'] \
            --bind -fexceptions -std=c++11
LOADER = node
endif

ifeq ($(POKER_BUILD_ENV),risc-v)
CXX = riscv64-cartesi-linux-gnu-g++
CXXFLAGS += -Wl,-rpath-link=/mnt/poker
endif

TESTS = test-solver \
    test-player \
    test-codec \
    test-validator  \
    test-bignumber

# programs to build
PROGRAMS =

# Files to install in /poker/build/poker-lib
INSTALL_FILES =

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
    INSTALL_FILES += test-verifier-fixture.bin
    TESTS += test-verifier
endif

PROGRAMS += $(TESTS)
INSTALL_FILES += $(PROGRAMS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@  $^

all: $(PROGRAMS)

POKER_LIB_OBJS=common.o \
            bignumber.o \
            solver.o \
            participant.o \
            poker-lib.o \
            referee.o \
            player.o \
            game-state.o \
            blob.o \
            verifier.o \
            codec.o \
            validator.o

poker-lib.a: $(POKER_LIB_OBJS)
	ar rcs $@ $^

poker-lib-wasm.js: poker-lib.a poker-lib-wasm.cpp
	$(CXX) $(CXXFLAGS) $^ -o $@

test-%: test-%.cpp poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@ $^

verify: verify.cpp poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@ $^
    
install: $(PROGRAMS)
	mkdir -p $(INSTALL_DIR) && \
    for f in "$(INSTALL_FILES)"; do cp $$f $(INSTALL_DIR); done

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
