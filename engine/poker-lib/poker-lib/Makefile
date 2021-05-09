BUILD_BASE = /poker/build
INSTALL_DIR = $(BUILD_BASE)/poker-lib
CXX = g++
CXXFLAGS = -I$(BUILD_BASE)/include/poker-eval -I$(BUILD_BASE)/include -L$(BUILD_BASE)/lib \
           -lgpg-error -lgcrypt -lgmp -lTMCG -lpoker-eval

ifeq ($(POKER_BUILD_ENV),wasm)
CXX = emcc
CXXFLAGS += -O3 -s ALLOW_TABLE_GROWTH \
            -s ALLOW_MEMORY_GROWTH=1 \
            -s EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap'] \
            --bind -fexceptions -std=c++11
endif

ifeq ($(POKER_BUILD_ENV),risc-v)
CXX = riscv64-cartesi-linux-gnu-g++
CXXFLAGS += -Wl,-rpath-link=/mnt/poker
endif

PROGRAMS = hello \
    poker-lib-sample \
    test-solver
    
INSTALL_FILES = $(PROGRAMS)

ifeq ($(POKER_BUILD_ENV),wasm)
PROGRAMS += poker-lib-wasm-thunk
INSTALL_FILES += hello.wasm \
    poker-lib-sample.wasm \
    poker-lib-wasm-thunk \
    poker-lib-wasm-thunk.wasm \
    poker-lib.js \
    poker-lib-js-sample.js \
    index.html
endif

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@  $^

all: $(PROGRAMS)

POKER_LIB_OBJS=solver.o poker-lib.o

poker-lib.a: $(POKER_LIB_OBJS)
	ar rcs $@ $^

poker-lib-wasm-thunk: poker-lib.a poker-lib-wasm-thunk.cpp
	$(CXX) $(CXXFLAGS) $^ -o $@

hello: hello.cpp
	$(CXX) $(CXXFLAGS) -o $@ $^

poker-lib-sample: poker-lib-sample.cpp poker-lib.a
	$(CXX) $(CXXFLAGS) -o $@ $^ 

test-solver: test-solver.cpp poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@ $^

install: $(PROGRAMS)
	mkdir -p $(INSTALL_DIR) && \
    for f in "$(INSTALL_FILES)"; do cp $$f $(INSTALL_DIR); done
    
clean:
	for f in "$(INSTALL_FILES)"; do \
        if [ -f $$f  ]; then rm $$f ; fi\
    done

distclean:
	for f in "$(INSTALL_FILES)"; do \
        if [ -f $(INSTALL_DIR)/$$f  ]; then rm $(INSTALL_DIR)/$$f ; fi\
    done
	

