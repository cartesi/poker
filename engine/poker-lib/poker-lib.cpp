#include "poker-lib.h"

#include <libTMCG.hh>

#include "game-state.h"
#include "service_locator.h"

namespace poker {

int init_poker_lib(bool encryption) {
    init_libTMCG();

    auto& sl = service_locator::get_instance();
    sl.encryption = encryption;

    return 0;
}

participant* service_locator::new_participant(int id, int num_participants, bool predictable) {
    if (encryption)
        return new tmcg_participant(id, num_participants, predictable);
    else
        return new mock_participant(id, num_participants, predictable);
}

}  // namespace poker