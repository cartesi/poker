#include "solver.h"

#include <iostream>
#include <poker_defs.h>
#include <inlines/eval.h>
#include <inlines/eval_type.h>
#include <cstdint>

namespace poker {

    #ifndef POKER_ERROR
    #define POKER_ERROR  -1
    #endif

    solver::solver() {}

    solver::~solver(){}

    int32_t convert_hand_to_mask(const int32_t *hand, int32_t hand_size, CardMask& mask) {
        CardMask_RESET(mask);

        for (int32_t i = 0; i < hand_size; i++) {
            int32_t card = hand[i];

            if (card >= Deck_N_CARDS) {
                printf("*** [convert_hand_to_mask] Error: unrecognized card \"%d\" was found.\n", card);
                return POKER_ERROR;
            }

            if (!CardMask_CARD_IS_SET(mask, card)) {
                CardMask_SET(mask, card);
            } else {
                printf("*** [convert_hand_to_mask] Error: found duplicated card on hand\n");
                return POKER_ERROR;
            }
        }
        return 0;
    }

    int32_t eval(const CardMask& hand1, const CardMask& hand2, int32_t hand_size) {
        int32_t value1 = StdDeck_StdRules_EVAL_N(hand1, hand_size);
        int32_t value2 = StdDeck_StdRules_EVAL_N(hand2, hand_size);

        if (value1 > value2) {
            return 1;
        } else if (value1 < value2) {
            return 2;
        } else {
            return 0;
        }
    }

    int32_t solver::compare_hands(const int32_t *hand1, const int32_t *hand2, int32_t hand_size) {
        CardMask hand1_mask, hand2_mask;

        if (convert_hand_to_mask(hand1, hand_size, hand1_mask) == 0 && convert_hand_to_mask(hand2, hand_size, hand2_mask) == 0) {
            return eval(hand1_mask, hand2_mask, hand_size);
        } else {
            return POKER_ERROR;
        }
    }

    const char* solver::get_hand_name(const int32_t *hand, int32_t hand_size) {
        CardMask mask;

        if (convert_hand_to_mask(hand, hand_size, mask) == 0) {
            int32_t type = StdDeck_StdRules_EVAL_TYPE(mask, hand_size);
            return handTypeNames[type];
        } else {
            return 0;
        }
    }
} // namespace poker
