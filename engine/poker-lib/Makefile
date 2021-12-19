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
EXEEXT=
LIB_REFS=
STATIC_REFS=
CXXFLAGS = -std=c++11 -fPIC -I$(BUILD_BASE)/include/poker-eval -I$(BUILD_BASE)/include 
LIB_REFS = -L$(LIB_BASE) -lgpg-error -lgcrypt -lgmp -lTMCG -lpoker-eval

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

TESTS = test-solver$(EXEEXT) \
    test-poker-lib-c-api$(EXEEXT) \
    test-compression$(EXEEXT) \
    test-codec$(EXEEXT) \
    test-validator$(EXEEXT) \
    test-game-generator$(EXEEXT) \
    test-player$(EXEEXT) \
    test-verifier$(EXEEXT) \
    test-bignumber$(EXEEXT)

ifneq ($(filter $(POKER_BUILD_ENV),x64 Darwin risc-v),)
    LIB_REFS += -lbrotlidec -lbrotlienc -lbrotlicommon  
endif
ifeq ($(POKER_BUILD_ENV),wasm)
  CXX = emcc
  CXXFLAGS += -O3 -s ALLOW_TABLE_GROWTH \
              -s ALLOW_MEMORY_GROWTH=1 \
              -s BUILD_AS_WORKER=1 \
              -s EXPORTED_RUNTIME_METHODS=['cwrap, UTF8ToString, free'] \
              --bind -fexceptions -std=c++11
   LIB_REFS += -lbrotlidec-static -lbrotlienc-static -lbrotlicommon-static
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

ifeq ($(POKER_BUILD_ENV),windows)
  CXX=x86_64-w64-mingw32-g++-win32
  AR = x86_64-w64-mingw32-ar
  CXXFLAGS += -DWINDOWS=1
  SHLIBEXT=.dll
  EXEEXT=.exe
  LIB_REFS = 
  STATIC_REFS = $(LIB_BASE)/libTMCG.a \
    $(LIB_BASE)/libgcrypt.a \
    $(LIB_BASE)/libgmp.a  \
    $(LIB_BASE)/libgpg-error.a \
    $(LIB_BASE)/libpoker-eval.a \
    $(LIB_BASE)/libbrotlidec-static.a \
    $(LIB_BASE)/libbrotlienc-static.a \
    $(LIB_BASE)/libbrotlicommon-static.a 
  PROGRAMS += libpoker.dll libpoker.dll.a
endif

CXXFLAGS += $(LIB_REFS)

ifeq ($(POKER_BUILD_ENV),wasm)
    PROGRAMS += poker-lib-wasm.js
    INSTALL_FILES += \
        poker-lib-wasm.wasm \
        poker-lib-wasm.js \
        poker-lib.js \
        test-poker-lib.html
    TEST_LOADER = node
else
    PROGRAMS += verify$(EXEEXT)
    PROGRAMS += generate$(EXEEXT)
    TESTS += test-game-playback$(EXEEXT)
endif

ifneq ($(filter $(POKER_BUILD_ENV),x64 Darwin),)
    TARGETS += node-addon
endif

PROGRAMS += $(TESTS)
INSTALL_FILES += $(PROGRAMS)
INSTALL_FILES += poker-lib-c-api.h

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
            

TARGETS += $(PROGRAMS)
all: $(TARGETS)

install: $(PROGRAMS) copy_install_files $(POST_INSTALL)

copy_install_files:
	mkdir -p $(INSTALL_DIR) && \
    for f in "$(INSTALL_FILES)"; do cp $$f $(INSTALL_DIR); done

poker-lib.a: $(POKER_LIB_OBJS)
	$(AR) rcs $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@  $^

libpoker.so: $(POKER_LIB_OBJS)
	$(CXX) $(CXXFLAGS) -shared -o $@ $(POKER_LIB_OBJS) && \
  cp $@ $(BUILD_BASE)/lib

libpoker.dylib: $(POKER_LIB_OBJS)
	$(CXX) $(CXXFLAGS) -shared -o $@ $(POKER_LIB_OBJS) && \
  cp $@ $(BUILD_BASE)/lib

libpoker.dll: $(POKER_LIB_OBJS)
	$(CXX) $(CXXFLAGS) -shared $(POKER_LIB_OBJS) $(STATIC_REFS) \
    -Wl,--export-all-symbols  -o $@ \
    -Wl,--enable-auto-image-base \
    -Xlinker --out-implib  \
    -Xlinker $@.a && \
  cp $@  $(BUILD_BASE)/lib && \
  cp $@.a  $(BUILD_BASE)/lib 

poker-lib-wasm.js: poker-lib.a poker-lib-wasm.cpp
	$(CXX) $(CXXFLAGS) $^ -o $@

node-addon: libpoker$(SHLIBEXT)
	make -C node-addon BUILD_DEST=$(BUILD_BASE)/lib INSTALL_DIR=$(INSTALL_DIR)

test-%$(EXEEXT): test-%.cpp poker-lib.a 
	$(CXX) $(CXXFLAGS)  -o $@  $^ $(STATIC_REFS)

verify$(EXEEXT): verify.cpp poker-lib.a
	$(CXX) $(CXXFLAGS)  -o $@  $^ $(STATIC_REFS)
    
generate$(EXEEXT): generate.cpp poker-lib.a 
	$(CXX) $(CXXFLAGS)  -o $@   $^ $(STATIC_REFS)

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

