VER=1.3.18
LIBNAME=libTMCG-$(VER)
PREFIX=/poker/build
PATCHES=/poker/patches
CXXFLAGS=
CFLAGS=

all: libtmcg

libtmcg: $(LIBNAME)
	cd $(LIBNAME)  && \
    aclocal  -I $(PREFIX)/share/aclocal && \
    libtoolize   --force && \
    cp configure.ac configure.ac.original && \
    sed -e 's:pipe2::; s:sys/select.h ::; s:fcntl.h ::; s:fcntl::; s: select ::; s:sscanfsleep::; s:sys/wait.h ::; s:signal.h::; s:AC_FUNC_MALLOC::' configure.ac.original > configure.ac && \
    cp src/Makefile.am src/Makefile.am.original && \
    sed -e 's:aiounicast_nonblock.hh::g;s:aiounicast_select.hh::g;s:aiounicast_nonblock.cc::g;s:aiounicast_nonblock.hh::g;s:aiounicast_select.cc::g'  src/Makefile.am.original > src/Makefile.am && \
    autoheader  && \
    automake  --force-missing --add-missing && \
    autoconf && \
    ./configure \
        CC=x86_64-w64-mingw32-gcc-win32 \
        CXX=x86_64-w64-mingw32-g++-win32 \
      --build=x86_64-linux-gnu  --host=x86_64-w64-mingw32  \
      --disable-shared --enable-static \
      --disable-forking \
        --disable-doc --disable-tests  \
        --prefix=$(PREFIX) --with-libgpg-error-prefix=$(PREFIX) --with-libgcrypt-prefix=$(PREFIX) --with-gmp=/poker/build && \
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
