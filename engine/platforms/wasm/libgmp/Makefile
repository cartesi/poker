all: libgmp
    
VER=6.2.1
LIBNAME=gmp-$(VER)

libgmp: $(LIBNAME)
	cd $(LIBNAME)  && \
    emconfigure ./configure --prefix=/poker/build --disable-assembly --host none --enable-cxx  && \
    make  && \
    make install

$(LIBNAME):
	wget https://gmplib.org/download/gmp/gmp-$(VER).tar.lz  && \
    lzip -d gmp-$(VER).tar.lz  && \
    tar -xvf gmp-$(VER).tar && \
    rm gmp-$(VER).tar

clean:
	rm -rf $(LIBNAME)
    
.PHONY: libgmp