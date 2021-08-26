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
      _in_turn_data(in_turn_data), _out_result(out_result)
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
    if ((res = vcr.playback(is))) {
        logger << "Failed to playback game: " <<  (int)res << std::endl;
        return res;
    }
    _g = vcr.game();

    if ((res = compute_result(_result, _g, _verification_info, _player_info))) {
        logger << "Failed computing results" << std::endl;
        return SUCCESS;
    }

    if ((res = write_result(_out_result))) {
        logger << "Failed write verification result: " <<  (int)res << std::endl;
        return res;
    }

    std::cout << "{\"funds\":[";
    for(int i=0; i < _result.size(); i++) {
        if (i>0) std::cout << ",";
        std::cout << "\"" << _result[i].to_string() << "\"";
    }
    std::cout << "], \"game_state\":" << _g.to_json() << "}";

    return SUCCESS;
}

game_error verifier::compute_result(
    verification_result_t& result,
    const game_state& g,  
    const verification_info_t& verification_info,
    const std::vector<player_info_t>& player_info) 
{
    result = { player_info[0].funds, player_info[1].funds };
    if (g.error) {
        // TODO: punish the author of failed turn?
        int punished = _verification_info.claimer_index;
        if (_verification_info.claimer == bignumber(0))
            punished = verification_info.challenger_index;
        result[_g.winner] += (result[punished] / bignumber(2));
        _result[punished] = 0;
    } else if (g.winner != TIE) {
        auto looser = opponent_id(g.winner);
        auto loss = player_info[looser].funds / bignumber(10);
        result[looser] -= loss;
        result[g.winner] += loss;
    } 
    return SUCCESS;
}

game_error verifier::write_result(std::ostream& out) {
    game_error res;
    char filler[32];
    memset(filler, 0, sizeof(filler));
    for(auto&& i: _result) {
        out.write(filler, sizeof(filler));
        if ((res=i.write_binary_be(out, 32)))
            return res;
    }
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

    _player_info.resize(nplayers);
    for(int i=0; i < (int)nplayers; i++) {
        skip(in, 12);
        if ((res=_player_info[i].address.read_binary_be(in, 20)))
            return res;
        logger << "_player_info[i].address = " << _player_info[i].address.to_string(16) << std::endl;
    }
    for(int i=0; i < (int)nplayers; i++) {
        if ((res=_player_info[i].funds.read_binary_be(in, 32)))
            return res;
        logger << "_player_info[i].funds = " << _player_info[i].funds.to_string() << std::endl;
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

    if ((res=_verification_info.challenger.read_binary_be(in, 20)))
        return res;

    if (-1 == (_verification_info.challenger_index = find_player_index(_verification_info.challenger)))
        return VRF_PLAYER_ADDRESS_NOT_FOUND;

    if ((res=_verification_info.claimer.read_binary_be(in, 20)))
        return res;

    _verification_info.claimer_index = find_player_index(_verification_info.claimer);
    if (_verification_info.claimer != bignumber(0)) {
        _verification_info.claimed_funds.resize(num_players());
        for(int i=0; i<num_players(); i++) {
            if ((res =_verification_info.claimed_funds[i].read_binary_be(in, 32)))
                return res;
        }
    }
    return SUCCESS;
}

int verifier::find_player_index(bignumber& address) {
    for(int i=0; i<_player_info.size(); i++) 
        if (address == _player_info[i].address)
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
