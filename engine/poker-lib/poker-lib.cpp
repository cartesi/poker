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
    if (opts->encryption)
        service_locator::instance().make_participant = []() -> i_participant* {
            return new participant();
        };
    else
        service_locator::instance().make_participant = []() -> i_participant* {
            return new unencrypted_participant();
        };

    logger << "poker-lib was initialized" << std::endl;
    return 0;
}

}  // namespace poker