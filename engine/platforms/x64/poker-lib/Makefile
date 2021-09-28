all: poker-lib

poker-lib: poker-lib-src
	cd poker-lib-src && \
    make && \
    make install

test: poker-lib
	make -C poker-lib-src test
    
poker-lib-src:
	cp -r /poker/poker-lib-base poker-lib-src

clean:
	rm -r poker-lib-src