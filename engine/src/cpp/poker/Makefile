all:  poker.js poker-lib-thunk.js poker-native 

poker-native: poker.cpp poker-lib.cpp poker-lib.h
	g++ -o poker-native  -lgmp -lTMCG \
    -I/home/cartesi/src/cpp/build/include \
    -L/home/cartesi/src/cpp/build/lib  \
    poker-lib.cpp poker.cpp


run-poker-native:
	./poker-native

poker.js: poker.cpp poker-lib.cpp poker-lib.h
	emcc -o poker.js  -lgpg-error -lgcrypt -lgmp -lTMCG \
    -s ALLOW_MEMORY_GROWTH=1 \
    --bind -fexceptions -std=c++11  \
    -I/home/cartesi/src/cpp/build-wasm/include \
    -L/home/cartesi/src/cpp/build-wasm/lib  \
    poker-lib.cpp poker.cpp

run-poker-js:
	node poker.js

poker-lib-thunk.js: poker-lib.cpp poker-lib.h poker-lib-thunk.cpp
	emcc -o poker-lib-thunk.js  -lgpg-error -lgcrypt -lgmp -lTMCG \
    -s ALLOW_TABLE_GROWTH \
    -s ALLOW_MEMORY_GROWTH=1 \
    --bind -fexceptions -std=c++11  \
    -I/home/cartesi/src/cpp/build-wasm/include \
    -L/home/cartesi/src/cpp/build-wasm/lib  \
    poker-lib.cpp poker-lib-thunk.cpp

server: poker-lib-thunk.js
	emrun --no_browser --port 1234 poker.html .
    
clean:
	rm poker-lib-thunk.js \
       poker-lib-thunk.wasm \
       poker.js \
       poker.wasm \
       poker-native
