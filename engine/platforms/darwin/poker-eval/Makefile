VER=master
LIBNAME=poker-eval-$(VER)
CWD=$(shell pwd)
PREFIX=$(shell cd ..; pwd)/build

CFLAGS="-mmacosx-version-min=10.10"
CXXFLAGS="-mmacosx-version-min=10.10"

poker-eval: $(LIBNAME)
	cd $(LIBNAME) && \
	autoreconf --force --install && \
    chmod 777 ./configure && \
    ./configure CC=clang CXX=clang++ CXXFLAGS=$(CXXFLAGS) CFLAGS=$(CFLAGS) \
        --prefix=$(PREFIX) && \
    cp Makefile Makefile.original  && \
    sed -e 's:examples/Makefile.dos::; s:examples::' Makefile.original > Makefile  && \
    make && \
    make install

$(LIBNAME):
	wget   https://github.com/cartesi-corp/poker-eval/archive/refs/heads/master.zip && \
    unzip master.zip && \
    rm master.zip
 
clean:
	rm -r $(LIBNAME)