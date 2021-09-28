all: brotli

VER=1.0.9
LIBNAME=brotli-$(VER)

brotli: $(LIBNAME)
	cd $(LIBNAME) && \
    ./configure-cmake --prefix=/poker/build --pass-thru \
       -DCMAKE_C_COMPILER=emcc && \
    make && \
    cp libbrotli*.a /poker/build/lib && \
    cp -R c/include/brotli /poker/build/include
    

$(LIBNAME):
	wget https://github.com/google/brotli/archive/refs/tags/v$(VER).zip && \
    unzip v$(VER).zip && \
    rm v$(VER).zip 

clean:
	rm -r $(LIBNAME)
