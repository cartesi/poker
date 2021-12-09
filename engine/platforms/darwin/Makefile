BUILD_BASE=`pwd`/build

LIBS=libgmp libgpg-error libgcrypt libtmcg poker-eval brotli poker-lib

all: $(LIBS)

$(LIBS): $(BUILD_BASE)
	make -C $@

$(BUILD_BASE):
	mkdir -p $(BUILD_BASE)

LIBSCLEAN := $(addsuffix .clean,$(LIBS))

clean: $(LIBSCLEAN)
	rm -r build

$(LIBSCLEAN): %.clean:
	$(MAKE) -C $* clean
    
.PHONY: $(LIBS)
