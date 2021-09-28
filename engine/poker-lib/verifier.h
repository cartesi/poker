#ifndef VERIFIER_H
#define VERIFIER_H

#include <istream>
#include <vector>
#include <array>
#include <memory>

#include "common.h"
#include "bignumber.h"
#include "blob.h"
#include "game-state.h"
#include "messages.h"
#include "codec.h"
#include "referee.h"

namespace poker {

enum verification_rule {
  RULE_UNKNOWN,
  RULE_PLAYBACK_FAILED,
  RULE_GAME_IS_NOT_OVER,
  RULE_NO_CLAIMER,
  RULE_CLAIM_IS_FALSE,
  RULE_CLAIM_IS_TRUE,
};

struct player_info_t {
    bignumber address;
    bignumber funds;
};
typedef std::array<player_info_t, NUM_PLAYERS> player_infos_t;

struct turn_metadata_t {
    bignumber player_address;
    bignumber timestamp;
    bignumber size;
};

typedef std::array<bignumber, NUM_PLAYERS> claimed_funds_t;

struct verification_info_t {
    bignumber challenger_addr;
    int challenger_id;
    bignumber claimer_addr;
    int claimer_id;
    claimed_funds_t claimed_funds;
};

typedef std::array<bignumber, NUM_PLAYERS> verification_results_t;

class verifier {
private:
    // source and destination streams
    std::istream& _in_player_info;
    std::istream& _in_turn_metadata;
    std::istream& _in_verification_info;
    std::istream& _in_turn_data;
    std::ostream& _out_result;

    // info read from or written to the above streams
    player_infos_t _player_infos;
    std::vector<turn_metadata_t> _turn_metadata;
    verification_info_t _verification_info;
    std::string _turn_data;
    verification_results_t _results;

    // game recreated after verification
    game_state _g;

    // applied verification rule
    verification_rule _applied_rule;

public:
    verifier(std::istream& in_player_info, std::istream& in_turn_metadata,
        std::istream& in_verification_info, std::istream& in_turn_data,
        std::ostream& out_result);

    // perform verification
    game_error verify();

    // give access to the verification outcome
    verification_results_t& results() { return _results; }
    game_state& game() { return _g; }

    verification_rule applied_rule() { return _applied_rule; }

    static game_error compute_result(verification_results_t& results,       // output: receives the final funds distribution
                              verification_rule& rule,                      // output: verification rule applied
                              const game_state& g,                          // game state after playback
                              game_error playback_result,                   // return value of game_playback.playback()
                              int last_player_id,                           // sender of last msg played back
                              const verification_info_t& verification_info, // decoded info
                              const player_infos_t& player_infos);           // decoded info

    static void punish(int player, verification_results_t& funds);

private:
    game_error load_inputs();
    game_error load_player_info(std::istream& in);
    game_error load_turn_metadata(std::istream& in);
    game_error load_verification_info(std::istream& in);
    game_error load_turn_data(std::istream& in);
    game_error write_result(std::ostream& out);

    /*
    void set_player_info(const player_infos_t& player_info) { _player_info = player_info; }
    void set_turn_metadata(const std::vector<turn_metadata_t>& turn_metadata) { _turn_metadata = turn_metadata; }
    void set_verification_info(const verification_info_t& verification_info) { _verification_info = verification_info; }
    void set_turn_data(const std::string& turn_data) { _turn_data = turn_data; }
    void set_game_state(const game_state& g) { _g = g; }
    */

    int find_player_id(bignumber& address);
};

} // namespace poker

#endif