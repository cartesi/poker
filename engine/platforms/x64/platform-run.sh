#/bin/sh

# Run poker program
# Cuurent dir must be platform root 

set -e
echo === Running X64 program: $@
make run-$@
