all: brotli

VER=1.0.9
LIBNAME=brotli-$(VER)

brotli: $(LIBNAME)
	cd $(LIBNAME) && \
    ./configure-cmake --prefix=/poker/build && \
    make && \
    make install

$(LIBNAME):
	wget https://github.com/google/brotli/archive/refs/tags/v$(VER).zip && \
    unzip v$(VER).zip && \
    rm v$(VER).zip 

clean:
	rm -rf $(LIBNAME)
