all: poker-lib

poker-lib: poker-lib-cpp poker-lib-ts

poker-lib-cpp: poker-lib-src
	cd poker-lib-src && \
    make && \
    make install

poker-lib-ts: poker-lib-cpp
	make -C poker-lib-src/typescript
    
poker-lib-src:
	cp -r /poker/poker-lib-base poker-lib-src

test: test-cpp test-ts

test-cpp: poker-lib-cpp
	make -C poker-lib-src test

test-ts: poker-lib-ts
	make -C poker-lib-src/typescript test

poker-lib-src:
	cp -r /poker/poker-lib-base poker-lib-src

clean:
	rm -r poker-lib-src