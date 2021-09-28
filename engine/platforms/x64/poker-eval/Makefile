VER=master
LIBNAME=poker-eval-$(VER)

poker-eval: $(LIBNAME)
	cd $(LIBNAME) && \
	autoreconf --force --install && \
    ./configure \
        --prefix=/poker/build && \
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