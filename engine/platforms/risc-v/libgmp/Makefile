all: libgmp
    
VER=6.2.1
LIBNAME=gmp-$(VER)
BUILD-ARCH=x86_64-pc-linux-gnu  
HOST-ARCH=riscv64-cartesi-linux-gnu

libgmp: $(LIBNAME)
	cd $(LIBNAME) && \
    ./configure --prefix=/poker/build \
        --build=$(BUILD-ARCH)  --host=$(HOST-ARCH)  &&  \
    make && \
    make install

$(LIBNAME):
	wget https://gmplib.org/download/gmp/gmp-$(VER).tar.lz  && \
    lzip -d gmp-$(VER).tar.lz  && \
    tar -xvf gmp-$(VER).tar && \
    rm gmp-$(VER).tar

clean:
	rm -rf $(LIBNAME)
    
.PHONY: libgmp