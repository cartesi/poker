#ifndef VERIFIER_H
#define VERIFIER_H

#include <istream>
#include <vector>
#include <memory>
#include <vector>

#include "common.h"
#include "bignumber.h"
#include "blob.h"
#include "game-state.h"
#include "messages.h"
#include "codec.h"
#include "referee.h"

namespace poker {

struct player_info_t {
    bignumber address;
    bignumber funds;
};

struct turn_metadata_t {
    bignumber player_address;
    bignumber timestamp;
    bignumber size;
};

struct verification_info_t {
    bignumber challenger;
    int claimer_index;
    bignumber claimer;
    int challenger_index;
    std::vector<bignumber> claimed_funds;
};

typedef std::vector<bignumber> verification_result_t;

class verifier {
private:
    std::istream& _in_player_info;
    std::istream& _in_turn_metadata;
    std::istream& _in_verification_info;
    std::istream& _in_turn_data;
    std::ostream& _out_result;

    std::vector<player_info_t> _player_info;
    std::vector<turn_metadata_t> _turn_metadata;
    verification_info_t _verification_info;
    std::string _turn_data;
    verification_result_t _result;

    game_state _g;

public:
    verifier(std::istream& in_player_info, std::istream& in_turn_metadata, 
        std::istream& in_verification_info, std::istream& in_turn_data, 
        std::ostream& out_result);
        
    game_error verify();
    verification_result_t& result() { return _result; }
    game_state& game() { return _g; }
    
    game_error compute_result(verification_result_t& result,
        const game_state& g,  
        const verification_info_t& verification_info,
        const std::vector<player_info_t>& player_info);

private:
    int num_players() { return (int)_player_info.size(); }

    game_error load_inputs();
    game_error load_player_info(std::istream& in);
    game_error load_turn_metadata(std::istream& in);
    game_error load_verification_info(std::istream& in);
    game_error load_turn_data(std::istream& in);
    game_error write_result(std::ostream& out);
    
    void set_player_info(const std::vector<player_info_t>& player_info) { _player_info = player_info; }
    void set_turn_metadata(const std::vector<turn_metadata_t>& turn_metadata) { _turn_metadata = turn_metadata; }
    void set_verification_info(const verification_info_t& verification_info) { _verification_info = verification_info; }
    void set_turn_data(const std::string& turn_data) { _turn_data = turn_data; }
    void set_game_state(const game_state& g) { _g = g; }

    int find_player_index(bignumber& address);
};

} // namespace poker

#endif