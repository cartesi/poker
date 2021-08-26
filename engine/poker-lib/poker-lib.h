#ifndef POKER_LIB_H
#define POKER_LIB_H

#include "participant.h"
#include "solver.h"

/*
* Library initialization and configuration
*/

namespace poker {

struct poker_lib_options {
    poker_lib_options() : encryption(true), logging(true) { }
    bool encryption;
    bool logging;
};

int init_poker_lib(poker_lib_options* opts=NULL);

} // namespace poker

#endif