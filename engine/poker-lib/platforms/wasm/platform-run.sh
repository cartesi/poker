#/bin/sh

# Run poker program
# Cuurent dir must be platform root 

set -e
echo === Running WASN program: $@
make run-$@
