all: libgcrypt

libgcrypt: libgcrypt-1.8.0
	cd libgcrypt-1.8.0  && \
    aclocal  && \
    libtoolize  && \
    autoheader  && \
    automake && \
    autoconf && \
    ./configure --prefix=/home/cartesi/src/cpp/build --with-libgpg-error-prefix=/home/cartesi/src/cpp/build  --enable-shared  --disable-static   --disable-nls  --disable-threads --disable-doc   && \
    make && \
    make install

libgcrypt-1.8.0:
	wget  https://github.com/gpg/libgcrypt/archive/libgcrypt-1.8.0.zip && \
    unzip libgcrypt-1.8.0.zip && \
    mv libgcrypt-libgcrypt-1.8.0 libgcrypt-1.8.0 && \
    rm libgcrypt-1.8.0.zip

clean:
	rm -rf libgcrypt-1.8.0
