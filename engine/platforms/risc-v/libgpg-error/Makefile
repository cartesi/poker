VER=1.27
LIBNAME=libgpg-error-$(VER)
BUILD-ARCH=x86_64-pc-linux-gnu  
HOST-ARCH=riscv64-cartesi-linux-gnu

all: libgpg-error

libgpg-error: $(LIBNAME)
	cd $(LIBNAME) && \
    AWK=mawk ./configure --prefix=/poker/build \
        --disable-tests  --disable-nls \
        --disable-threads --disable-doc \
        --build=$(BUILD-ARCH)  --host=$(HOST-ARCH) && \
    cp ../lock-obj-pub.riscv64-cartesi-linux-gnu.h  src/syscfg && \
    make && \
    make install

$(LIBNAME):
	wget https://gnupg.org/ftp/gcrypt/libgpg-error/$(LIBNAME).tar.bz2 && \
    bunzip2 $(LIBNAME).tar.bz2 && \
    tar xvf $(LIBNAME).tar && \
    rm $(LIBNAME).tar

clean:
	rm -rf $(LIBNAME)