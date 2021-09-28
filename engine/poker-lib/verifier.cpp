#include <iostream>
#include <algorithm>
#include "verifier.h"
#include "compression.h"
#include "game-playback.h"

namespace poker {

static void skip(std::istream& in, int len);

verifier::verifier(std::istream& in_player_info, std::istream& in_turn_metadata,
    std::istream& in_verification_info, std::istream& in_turn_data,
    std::ostream& out_result)
    : _in_player_info(in_player_info),
      _in_turn_metadata(in_turn_metadata), _in_verification_info(in_verification_info),
      _in_turn_data(in_turn_data), _out_result(out_result), _applied_rule(RULE_UNKNOWN)
{
}

game_error verifier::verify() {
    game_error res;
    logger << "Verification started" << std::endl;

    if ((res = load_inputs())) {
        logger << "Failed to load input data: " << (int)res << std::endl;
        return res;
    }

    game_playback vcr;
    std::istringstream is(_turn_data);
    auto plbk_res = vcr.playback(is);
    _g = vcr.game();

    res = compute_result(_results,      // output
                         _applied_rule, // output
                         _g,       
                         plbk_res,
                         vcr.last_player_id(),
                         _verification_info,
                         _player_infos);

    if (res != SUCCESS) {
        logger << "Failed to compute results" << std::endl;
        return res;
    }

    logger << "Applied verification rule:" << ((int)_applied_rule) << std::endl;

    if ((res = write_result(_out_result))) {
        logger << "Failed write verification result: " <<  (int)res << std::endl;
        return res;
    }

    // write verification results and game state as JSON to stdout
    std::cout << "{\"funds\":[";
    for(int i=0; i < _results.size(); i++) {
        if (i>0) std::cout << ",";
        std::cout << "\"" << _results[i].to_string() << "\"";
    }
    std::cout << "], \"game_state\":" << _g.to_json() << "}";

    return SUCCESS;
}

game_error verifier::compute_result(verification_results_t& results,
                                    verification_rule& rule,
                                    const game_state& g,
                                    game_error playback_result,
                                    int last_player_id,
                                    const verification_info_t& ver_info,
                                    const player_infos_t& player_infos)
{
    results = { player_infos[0].funds, player_infos[1].funds };
    rule = RULE_UNKNOWN;

    // If an error arises, punish the player whose move was illegal.
    if (playback_result != SUCCESS) {
        // playback failed - punish last_player_id
        rule = RULE_PLAYBACK_FAILED;
        punish(last_player_id, results);
        return SUCCESS;
    }

    // If no error arises and the game has not ended yet, punish the challenger (player who triggered a useless verification)
    auto game_over = (g.winner != -1);
    if (!game_over) {
        // playback succeeded, but the game did not reach game over condition
        punish(ver_info.challenger_id, results);
        rule = RULE_GAME_IS_NOT_OVER;
        return SUCCESS;
    }

    // If a result is computed, compare it with the claimed result. Punish the claimer if they do not match, otherwise punish the challenger
    
    if (ver_info.claimer_addr == bignumber(0)) {
        rule = RULE_NO_CLAIMER;;
        punish(ver_info.challenger_id, results);
    } else {
        auto claimed_result_matches = (g.funds_share[ALICE] == ver_info.claimed_funds[ALICE])
                                   && (g.funds_share[BOB]   == ver_info.claimed_funds[BOB]);
        if (claimed_result_matches) {
            rule = RULE_CLAIM_IS_TRUE;
            punish(ver_info.challenger_id, results);
        } else {
            rule = RULE_CLAIM_IS_FALSE;
            punish(opponent_id(ver_info.challenger_id), results);
        }
    } 
    return SUCCESS;
}

void verifier::punish(int player, verification_results_t& funds) {
    auto honest = opponent_id(player);
    funds[honest] += funds[player];
    funds[player] = 0;
}

game_error verifier::write_result(std::ostream& out) {
    game_error res;
    char filler[64];
    memset(filler, 0, sizeof(filler));
    for(auto&& i: _results) {
        if ((res=i.write_binary_be(out, 32)))
            return res;
    }
    out.write(filler, sizeof(filler));
    return SUCCESS;
}

game_error verifier::load_inputs() {
    game_error res;
    if ((res=load_player_info(_in_player_info)))
        return res;
    if ((res=load_turn_metadata(_in_turn_metadata)))
        return res;
    if ((res=load_verification_info(_in_verification_info)))
        return res;
    if ((res=load_turn_data(_in_turn_data)))
        return res;
    return SUCCESS;
}

game_error verifier::load_player_info(std::istream& in) {
    game_error res;
    bignumber nplayers;
    logger << "load_player_info...\n";
    if ((res=nplayers.read_binary_be(in, 4)))
        return res;
    logger << "nplayers = " << (int)nplayers << std::endl;

    if (nplayers != bignumber(NUM_PLAYERS))
        return VRF_INVALID_PLAYER_COUNT;

    for(int i=0; i < (int)nplayers; i++) {
        skip(in, 12);
        if ((res=_player_infos[i].address.read_binary_be(in, 20)))
            return res;
        logger << "_player_infos[i].address = " << _player_infos[i].address.to_string(16) << std::endl;
    }
    for(int i=0; i < (int)nplayers; i++) {
        if ((res=_player_infos[i].funds.read_binary_be(in, 32)))
            return res;
        logger << "_player_infos[i].funds = " << _player_infos[i].funds.to_string() << std::endl;
    }
    return SUCCESS;
}

game_error verifier::load_turn_metadata(std::istream& in) {
    game_error res;
    bignumber count;
    logger << "load_turn_metadata...\n";
    if ((res=count.read_binary_be(in, 4)))
        return res;
    logger << "load_turn_metadata count=" << (int)count << std::endl;
    _turn_metadata.resize(count);

    for(int i=0; i < (int)count; i++) {
        skip(in, 12);
        if ((res=_turn_metadata[i].player_address.read_binary_be(in, 20)))
            return res;
        logger << "_turn_metadata[i].player_address = " << _turn_metadata[i].player_address.to_string(16) << std::endl;
    }
    for(int i=0; i < (int)count; i++) {
        if ((res=_turn_metadata[i].timestamp.read_binary_be(in, 32)))
            return res;
        logger << "_turn_metadata[i].timestamp = " << _turn_metadata[i].timestamp.to_string(16) << std::endl;
    }
    for(int i=0; i < (int)count; i++) {
        if ((_turn_metadata[i].size.read_binary_be(in, 32)))
            return res;
        logger << "_turn_metadata[i].size = " << _turn_metadata[i].size.to_string() << std::endl;
    }
    return SUCCESS;
}

game_error verifier::load_verification_info(std::istream& in) {
    game_error res;
    logger << "load_verification_info...\n";

    if ((res=_verification_info.challenger_addr.read_binary_be(in, 20)))
        return res;

    if (-1 == (_verification_info.challenger_id = find_player_id(_verification_info.challenger_addr)))
        return VRF_PLAYER_ADDRESS_NOT_FOUND;

    if ((res=_verification_info.claimer_addr.read_binary_be(in, 20)))
        return res;

    if (_verification_info.claimer_addr != bignumber(0)) {
        _verification_info.claimer_id = find_player_id(_verification_info.claimer_addr);
        for(int i=0; i < _verification_info.claimed_funds.size(); i++) {
            if ((res =_verification_info.claimed_funds[i].read_binary_be(in, 32)))
                return res;
        }
    }
    return SUCCESS;
}

int verifier::find_player_id(bignumber& address) {
    for(int i=0; i<_player_infos.size(); i++)
        if (address == _player_infos[i].address)
            return i;
    return -1;
}

game_error verifier::load_turn_data(std::istream& in) {
    game_error res;
    logger << "load_turn_data...\n";
    _turn_data .clear();
    for(int i=0; i<_turn_metadata.size(); i++) {
        int size = _turn_metadata[i].size;
        std::string b;
        if ((res=read_exactly(in, size, b)))
            return res;
        _turn_data += b;
    }
    return SUCCESS;
}

// fast-forward the stream len bytes
static void skip(std::istream& in, int len) {
    char tmp;
    while(in.good() && len--)
        in.read(&tmp, 1);
}

} // namespace poker
