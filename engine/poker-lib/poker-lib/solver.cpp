#include "solver.h"

#include <iostream>
#include <poker_defs.h>
#include <inlines/eval.h>
#include <inlines/eval_low.h>

namespace poker {

solver::solver() {
}

solver::~solver() {
}

int solver::card_type_from_str(const char* card_str) {
    int res;
    if (Deck_stringToCard((char*)card_str, &res) == 0)
        return -1;
    return res;
}

const char* solver::card_str_from_type(int card_type) {
    return "TODO";
}

int solver::compare_hands(int *hand1, int *hand2, int hand_size) {
    for(auto i=0; i<hand_size; i++) {
        std::cout << "hand1[" << i << "]=" << hand1[i] << ", "
                  << "hand2[" << i << "]=" << hand2[i] << std::endl;
    }
    return 0;
}


} // namespace poker