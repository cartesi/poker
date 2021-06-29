#include "common.h"

namespace poker {

game_error public_cards_range(game_step step, int& first_card_index, int& card_count) {
    switch(step) {
        case OPEN_FLOP:
            first_card_index = flop_card_index(0);
            card_count = 3;
            break;
        case OPEN_TURN:
            first_card_index = turn_card_index();
            card_count = 1;
            break;
        case OPEN_RIVER:
            first_card_index = river_card_index();
            card_count = 1;
            break;
        default:
            return PRR_INVALID_CARDS_PROOF_STEP;
    }
    return SUCCESS;
}

}