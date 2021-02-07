SUBDIRS = libgmp-wasm libgmp \
          libgpg-error libgpg-error-wasm \
          libgcrypt libgcrypt-wasm \
          libtmcg libtmcg-wasm \
          poker

all: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) -C $@

clean:
	rm -rf build build-wasm
	for x in $(SUBDIRS); do make -C $$x clean; done;


.PHONY: all $(SUBDIRS)
