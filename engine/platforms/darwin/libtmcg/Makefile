VER=1.3.18
LIBNAME=libTMCG-$(VER)
PREFIX=$(shell cd ..; pwd)/build
PATCHES=`pwd`/../../../../patches
CXXFLAGS="-mmacosx-version-min=10.10  -Ofast"
CFLAGS="-mmacosx-version-min=10.10  -Ofast"

all: libtmcg

libtmcg: $(LIBNAME)
	cd $(LIBNAME)  && \
    aclocal  -I $(PREFIX)/share/aclocal && \
    glibtoolize   --force && \
    cp configure.ac configure.ac.original && \
    sed -e 's:pipe2::' configure.ac.original > configure.ac && \
    autoheader  && \
    automake  --force-missing --add-missing && \
    autoconf && \
    ./configure CC=clang CXX=clang++ CFLAGS=$(CFLAGS) CXXFLAGS=$(CXXFLAGS) \
        --disable-doc --disable-tests  \
        --prefix=$(PREFIX) --with-libgpg-error-prefix=$(PREFIX) --with-libgcrypt-prefix=$(PREFIX) && \
    cp Makefile Makefile.original  && \
    sed -e 's:doc tests::' Makefile.original > Makefile  && \
    make && \
    make install

$(LIBNAME):
	wget  https://github.com/HeikoStamer/libtmcg/archive/release-$(LIBNAME).zip && \
    unzip release-libTMCG-$(VER).zip && \
    mv libtmcg-release-libTMCG-$(VER) $(LIBNAME) && \
    rm release-libTMCG-$(VER).zip && \
    cd $(LIBNAME) && \
    patch -p1 <  $(PATCHES)/$(LIBNAME).patch

clean:
	rm -r $(LIBNAME)
