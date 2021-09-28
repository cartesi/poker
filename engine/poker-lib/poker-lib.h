#ifndef POKER_LIB_H
#define POKER_LIB_H

#include <cstdlib>
#include "participant.h"
#include "solver.h"

/*
* Library initialization and configuration
*/

namespace poker {

const int poker_version = 0x010000;

struct poker_lib_options {
    poker_lib_options() : encryption(true), logging(false) {
      auto env_logging = getenv("POKER_LOGGING");
      logging = env_logging && 0==strcmp(env_logging, "1");
    }
    bool encryption;
    bool logging;
};

int init_poker_lib(poker_lib_options* opts=NULL);

} // namespace poker

#endif