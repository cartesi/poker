VER=1.8.0
LIBNAME=libgcrypt-$(VER)
BUILD-ARCH=x86_64-pc-linux-gnu  
HOST-ARCH=riscv64-cartesi-linux-gnu

all: libgcrypt

libgcrypt: $(LIBNAME)
	cd $(LIBNAME) && \
    autoreconf && \
    ./configure ./configure --prefix=/poker/build \
        --with-libgpg-error-prefix=/poker/build  \
         --build=$(BUILD-ARCH)  --host=$(HOST-ARCH)  \
        --disable-jent-support \
        --disable-asm  --disable-nls  \
        --disable-threads --disable-doc --disable-tests  && \
    cp Makefile Makefile.original && \
    sed -e 's:src $$(doc) tests:src:g' Makefile.original > Makefile  && \
    make  && \
    make install

$(LIBNAME):
	wget  https://github.com/gpg/libgcrypt/archive/$(LIBNAME).zip && \
    unzip $(LIBNAME).zip && \
    mv libgcrypt-libgcrypt-$(VER) $(LIBNAME) && \
    rm $(LIBNAME).zip && \
    cd $(LIBNAME)

clean:
	rm -r $(LIBNAME)