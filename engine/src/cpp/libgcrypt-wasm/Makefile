PREFIX=/home/cartesi/src/cpp/build-wasm
VER=1.8.0
LIBNAME=libgcrypt-$(VER)

all: libgcrypt

libgcrypt: $(LIBNAME)
	cd $(LIBNAME) && \
    autoreconf && \
    emconfigure ./configure --prefix=/home/cartesi/src/cpp/build-wasm \
        --with-libgpg-error-prefix=/home/cartesi/src/cpp/build-wasm  \
        --host=x86-unknown-linux  \
        --build=x86_64-pc-linux-gnu \
        --disable-jent-support \
        --disable-asm  --enable-static --disable-shared   --disable-nls  \
        --disable-threads --disable-doc --disable-tests "CFLAGS=-m32" && \
        make && \
        make install

$(LIBNAME):
	wget  https://github.com/gpg/libgcrypt/archive/$(LIBNAME).zip && \
    unzip $(LIBNAME).zip && \
    mv libgcrypt-libgcrypt-$(VER) $(LIBNAME) && \
    rm $(LIBNAME).zip && \
    cd $(LIBNAME)

clean:
	rm -rf $(LIBNAME)