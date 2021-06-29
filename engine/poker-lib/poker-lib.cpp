#include "poker-lib.h"
#include <libTMCG.hh>
#include "game-state.h"

namespace poker {

int init_poker_lib() {
    init_libTMCG();
    return 0;
}

} // namespace poker