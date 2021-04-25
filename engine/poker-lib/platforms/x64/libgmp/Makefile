LIBVERSION=6.2.1
LIBNAME=gmp-$(LIBVERSION)
all: libgmp

libgmp: $(LIBNAME)
	cd gmp-$(LIBVERSION)  && \
    ./configure --prefix=/poker/build && \
    make  && \
    make install

$(LIBNAME):
	wget https://gmplib.org/download/gmp/gmp-$(LIBVERSION).tar.lz  && \
    lzip -d gmp-$(LIBVERSION).tar.lz  && \
    tar -xvf gmp-$(LIBVERSION).tar && \
    rm gmp-$(LIBVERSION).tar

clean:
	rm -rf gmp-$(LIBVERSION)