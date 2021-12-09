#!/bin/bash

set -e
# base location of installed files
BUILD_BASE=`cd ../../../build; pwd` 

LIB_DIR=${BUILD_BASE}/lib
INSTALL_DIR=${BUILD_BASE}/poker-lib 
DLLEXT=.so
if [ `uname -s` == Darwin ]; then
  DLLEXT=.dylib
fi

mkdir -p ${INSTALL_DIR}
cp ./src/*.ts ${INSTALL_DIR}
cp ./build/Release/pokerlib.node ${INSTALL_DIR}
cp ${LIB_DIR}/*${DLLEXT}* ${INSTALL_DIR}

if [ `uname -s` == Darwin ]; then
    echo "Patching mac-o references"

    # Allow pokerlib.node to find its dependencies when loaded from ./build/Release
    # this is the location used when running unit tests
    install_name_tool \
      -id pokerlib.node \
      -change libpoker.dylib  `pwd`/../../../build/lib/libpoker.dylib \
      `pwd`/build/Release/pokerlib.node

    # Remove path-dependent references from the installed binaries
    install_name_tool \
      -id pokerlib.node \
      -change libpoker.dylib @loader_path/libpoker.dylib \
        ${INSTALL_DIR}/pokerlib.node

    install_name_tool \
      -id @loader_path/libbrotlidec.1.dylib\
      -change libbrotlicommon.1.dylib @loader_path/libbrotlicommon.1.dylib \
      ${INSTALL_DIR}/libbrotlidec.1.dylib

    install_name_tool \
      -id @loader_path/libbrotlienc.1.dylib \
      -change libbrotlicommon.1.dylib @loader_path/libbrotlicommon.1.dylib \
      ${INSTALL_DIR}/libbrotlienc.dylib

    install_name_tool \
      -id @loader_path//libbrotlienc.1.dylib\
      -change libbrotlicommon.1.dylib @loader_path/libbrotlicommon.1.dylib \
        ${INSTALL_DIR}/libbrotlienc.1.dylib

    install_name_tool \
      -id @loader_path/ibpoker.dylib \
       -change ${LIB_DIR}/libgpg-error.0.dylib @loader_path/libgpg-error.0.dylib \
       -change ${LIB_DIR}/libgcrypt.20.dylib @loader_path/libgcrypt.20.dylib \
       -change ${LIB_DIR}/libgmp.10.dylib @loader_path/libgmp.10.dylib \
       -change ${LIB_DIR}/libTMCG.18.dylib @loader_path/libTMCG.18.dylib \
       -change ${LIB_DIR}/libpoker-eval.1.dylib @loader_path/libpoker-eval.1.dylib \
       -change libbrotlidec.1.dylib @loader_path/libbrotlidec.1.dylib \
       -change libbrotlienc.1.dylib @loader_path/libbrotlienc.1.dylib \
       -change libbrotlicommon.1.dylib @loader_path/libbrotlicommon.1.dylib \
      -change libbrotlidec.1.dylib ${LIB_DIR}libbrotlidec.1.dylib \
      -change libbrotlienc.1.dylib ${LIB_DIR}libbrotlienc.1.dylib \
      -change libbrotlicommon.1.dylib ${LIB_DIR}libbrotlicommon.1.dylib \
       ${INSTALL_DIR}/libpoker.dylib

    install_name_tool \
        -id @loader_path/libgmp.10.dylib \
          ${INSTALL_DIR}/libgmp.dylib

    install_name_tool -id \
      @loader_path/libgpg-error.0.dylib \
        ${INSTALL_DIR}/libgpg-error.dylib
  
    install_name_tool \
        -id @loader_path/libpoker-eval.dylib \
        ${INSTALL_DIR}/libpoker-eval.dylib

    install_name_tool \
      -id @loader_path/libTMCG.18.dylib \
      -change  ${LIB_DIR}/libgcrypt.20.dylib @loader_path/libgcrypt.20.dylib \
      -change  ${LIB_DIR}/libgpg-error.0.dylib @loader_path/libgpg-error.0.dylib \
      -change  ${LIB_DIR}/libgmp.10.dylib @loader_path/libgmp.10.dylib \
      ${INSTALL_DIR}/libTMCG.dylib
  
    install_name_tool \
      -id @loader_path/libTMCG.18.dylib \
      -change  ${LIB_DIR}/libgcrypt.20.dylib @loader_path/libgcrypt.20.dylib \
      -change  ${LIB_DIR}/libgpg-error.0.dylib @loader_path/libgpg-error.0.dylib \
      -change  ${LIB_DIR}/libgmp.10.dylib @loader_path/libgmp.10.dylib \
      ${INSTALL_DIR}/libTMCG.18.dylib\
  
    install_name_tool \
      -id @loader_path/libgcrypt.20.dylib \
       -change ${LIB_DIR}/libgpg-error.0.dylib @loader_path/libgpg-error.0.dylib \
       ${INSTALL_DIR}/libgcrypt.dylib

    install_name_tool \
      -id @loader_path/libgcrypt.20.dylib \
       -change ${LIB_DIR}/libgpg-error.0.dylib @loader_path/libgpg-error.0.dylib \
       ${INSTALL_DIR}/libgcrypt.20.dylib
  fi
