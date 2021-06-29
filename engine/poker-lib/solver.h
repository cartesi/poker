#ifndef SOLVER_H
#define SOLVER_H

#include <cstdint>
#include "common.h"

namespace poker {

/*
* Poker hand evaluator
*/
class solver {
public:
    solver();
    ~solver();
    game_error compare_hands(const card_t *hand1, const card_t *hand2, int hand_size, int* result);
	const char* get_hand_name(const card_t *hand, int hand_size);
};

} // namespace poker

#endif // SOLVER_H
