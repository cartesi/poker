#ifndef SOLVER_H
#define SOLVER_H

#include <cstdint>
#include "cards.h"
#include "errors.h"

namespace poker {

    class solver {
    public:
        solver();
        ~solver();
        int32_t compare_hands(const card_t *hand1, const card_t *hand2, int32_t hand_size);
    	const char* get_hand_name(const card_t *hand, int32_t hand_size);
    };

} // namespace poker

#endif // SOLVER_H
