all: brotli

VER=1.0.9
LIBNAME=brotli-$(VER)

brotli: $(LIBNAME)
	cd $(LIBNAME) && \
  echo "\nSET(CMAKE_SHARED_LIBRARY_LINK_C_FLAGS)\n"  >> CMakeLists.txt && \
  cp ./c/common/platform.h ./c/common/platform.h.original && \
  sed -e 's:#include <endian.h>:#include <sys/types.h>:' ./c/common/platform.h.original > ./c/common/platform.h && \
  ./configure-cmake --prefix=/poker/build --pass-thru \
       -DCMAKE_C_COMPILER_WORKS=1 \
       -DCMAKE_CXX_COMPILER_WORKS=1 \
       -DCMAKE_C_COMPILER=x86_64-w64-mingw32-gcc-win32 && \
    make  && \
    mkdir -p /poker/build/lib && \
    find . -name "libbrotli*-static.a" -exec cp {} /poker/build/lib \; && \
    find . -name "libbrotli*.so*" -exec cp {} /poker/build/lib \; && \
    mkdir -p /poker/build/include/brotli && \
    cp ./c/include/brotli/*.h /poker/build/include/brotli

$(LIBNAME):
	wget https://github.com/google/brotli/archive/refs/tags/v$(VER).zip && \
    unzip v$(VER).zip && \
    rm v$(VER).zip 

clean:
	rm -r $(LIBNAME)
