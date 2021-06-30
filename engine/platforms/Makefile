PLATFORMS=risc-v wasm x64
all: $(PLATFORMS)

$(PLATFORMS):
	$(MAKE) -C $@

PLATSCLEAN := $(addsuffix .clean,$(PLATFORMS))

clean: $(PLATSCLEAN)

$(PLATSCLEAN): %.clean:
	$(MAKE) -C $* clean

.PHONY: $(PLATFORMS)
