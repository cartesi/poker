#!/bin/bash

set -e

if [[ $1 == 'poker' ]]; then
  cd /home/poker/app
  exec ./run.sh
fi

exec "$@"
