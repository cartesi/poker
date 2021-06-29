VER=master
LIBNAME=XPokerEval-$(VER)

XPokerEval: $(LIBNAME)
	cd $(LIBNAME)/XPokerEval/XPokerEval.Pokersource  && \
	autoreconf --force --install && \
    ./configure \
        --prefix=/poker/build && \
    cp Makefile Makefile.original  && \
    sed -e 's:examples/Makefile.dos::; s:examples::' Makefile.original > Makefile  && \
    make && \
    make install

$(LIBNAME):
	wget   https://github.com/christophschmalhofer/poker/archive/refs/heads/master.zip && \
    unzip master.zip && \
    rm master.zip && \
    mv poker-master $(LIBNAME)
 
clean:
	rm -rf $(LIBNAME)
