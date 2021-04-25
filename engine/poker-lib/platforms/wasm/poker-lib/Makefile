all: poker-lib

poker-lib: poker-lib-src
	cd poker-lib-src && \
    make && \
    make install

poker-lib-src:
	cp -r /poker/poker-lib-base poker-lib-src

clean:
	rm -rf poker-lib-src