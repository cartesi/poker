VER=1.27
LIBNAME=libgpg-error-$(VER)

all: libgpg-error

libgpg-error: $(LIBNAME)
	cd $(LIBNAME)  && \
    emconfigure ./configure --prefix=/poker/build \
        --disable-shared --enable-static \
        --disable-tests  --disable-nls \
        --disable-threads --disable-doc \
        --build=x86_64-pc-linux-gnu \
        --host=x86-unknown-linux \
        "CFLAGS=-m32" && \
    cd src && \
    make gen-posix-lock-obj && \
    node gen-posix-lock-obj > syscfg/lock-obj-pub.linux-gnu.h && \
    cd .. && \
    cp Makefile Makefile.bkp && \
    make && \
    make install

$(LIBNAME):
	wget https://gnupg.org/ftp/gcrypt/libgpg-error/$(LIBNAME).tar.bz2 && \
    bunzip2 $(LIBNAME).tar.bz2 && \
    tar xvf $(LIBNAME).tar && \
    rm $(LIBNAME).tar

clean:
	rm -rf $(LIBNAME)