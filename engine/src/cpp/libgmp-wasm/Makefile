all: libgmp

libgmp: gmp-6.2.1
	cd gmp-6.2.1  && \
    emconfigure ./configure --prefix=/home/cartesi/src/cpp/build-wasm --disable-assembly --host none --enable-cxx  && \
    make  && \
    make install

gmp-6.2.1:
	wget https://gmplib.org/download/gmp/gmp-6.2.1.tar.lz  && \
    lzip -d gmp-6.2.1.tar.lz  && \
    tar -xvf gmp-6.2.1.tar && \
    rm gmp-6.2.1.tar

hello.js: libgmp
	emcc -o hello.js hello.c \
    -lgmp \
    -I/home/cartesi/src/cpp/build-wasm/include \
    -L/home/cartesi/src/cpp/build-wasm/lib


clean:
	rm -rf gmp-6.2.1
    
.PHONY: libgmp