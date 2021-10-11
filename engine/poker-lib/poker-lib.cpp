#include "poker-lib.h"

#include <libTMCG.hh>

#include "game-state.h"
#include "service_locator.h"

namespace poker {

static poker_lib_options default_options;

int init_poker_lib(poker_lib_options* opts) {
    if (!opts)
        opts = &default_options;

    init_libTMCG();
    logging_enabled = opts->logging;
    service_locator::load(opts);

    return 0;
}

}  // namespace poker
