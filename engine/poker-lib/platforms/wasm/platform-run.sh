#/bin/sh

# Run poker program
# Cuurent dir must be platform root 

set -e
echo === Running WASM program: $@
make run-$@
