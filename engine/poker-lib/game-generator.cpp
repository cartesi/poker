#include "game-generator.h"

#include <array>

namespace poker {

void game_generator::push_turn(const char* label, int player, const std::string& msg, int next_player, const money_t& stake) {
  logger << "push turn  #" << turns.size() << " " << label << ": player="  << player << " next_player=" << next_player << std::endl;
  turns.push_back({player, msg, next_player, stake});
}

game_error game_generator::generate() {
    game_error res;
    std::array<player,2> players{ player(ALICE), player(BOB) };
    int p, np; // player next player
    std::string msg1, msg2;
    money_t stake;

    for (auto& p : players)
        if ((res = p.init(alice_money, bob_money, big_blind)))
            return res;

    // Handshake
    stake = players[ALICE].game().players[ALICE].bets;
    if ((res = players[ALICE].create_handshake(msg1)))
      return res;
    push_turn("create_handshake", ALICE, msg1, BOB, stake);
      
    std::array<game_error, 2> r = { CONTINUED, CONTINUED };
    p = BOB;
    while (msg1.size()) {
      logger << "\nHANDSHAKE p=" << p << std::endl;
      stake = players[p].game().players[p].bets;
      msg2.clear();
      r[p] = players[p].process_handshake(msg1, msg2);
      if (r[p] != SUCCESS && r[p] != CONTINUED)
        return r[p];
      if (msg2.size()) {
        push_turn("handshake", p, msg2, players[p].game().next_msg_author, stake);
      }

      p = opponent_id(p);
      msg1 = msg2;
    }

    if (p != ALICE)
      return PLB_BAD_HANDSHAKE;

    // bets
    auto t = BET_CALL;
    auto amount = 0;
    auto did_raise = false;
    //p = players[ALICE].game().current_player;
    while (!players[ALICE].game_over() && !players[BOB].game_over()) {
        if (!players[p].game_over()) {
            r = {CONTINUED, CONTINUED};
            if (last_aggressor >= 0 && players[p].game().phase == bet_phase::PHS_RIVER) {
                logger << "-=> player " << p << " AAA" << std::endl;
                if (p == last_aggressor) {
                    logger << "-=> player " << p << " RAISE" << std::endl;
                    t = BET_RAISE;
                    did_raise = true;
                    amount = 10;
                } else if (did_raise) {
                    logger << "-=> player " << p << " CALL" << std::endl;
                    t = BET_CALL;
                    amount = 0;
                } else {
                    logger << "-=> player " << p << " CHECK" << std::endl;
                    t = BET_CHECK;
                }
            }
            stake = players[p].game().players[p].bets;
            r[p] = players[p].create_bet(t, amount, msg1);
            logger << "\n== " << p << " CREATE BET: " << r[p] << "\n";
            if (r[p] != SUCCESS && r[p] != CONTINUED)
                return r[p];
            push_turn("create_bet", p, msg1, players[p].game().next_msg_author, stake);
            t = BET_CHECK;

            do {
                p = opponent_id(p);
                if (r[p] == CONTINUED) {
                    msg2.clear();
                    stake = players[p].game().players[p].bets;
                    r[p] = players[p].process_bet(msg1, msg2);
                    logger << "\n== " << p << " PROCESS BET: " << r[p] << "\n";
                    if (msg2.size()) {
                        push_turn("process_bet", p, msg2, players[p].game().next_msg_author, stake);
                        msg1 = msg2;
                    }
                }
            } while (r[ALICE] == CONTINUED || r[BOB] == CONTINUED);
        }
        if (players[p].game_over())
            p = opponent_id(p);
        else
            p = players[p].game().current_player;
    }

    if (r[ALICE] != SUCCESS)
        return r[ALICE];
    if (r[BOB] != SUCCESS)
        return r[BOB];

    alice_game = players[ALICE].game();
    bob_game = players[BOB].game();    
    
    // generate turn data
    raw_turn_data.clear();
    for(auto&& m: turns)
        raw_turn_data += std::get<1>(m);

    // generate turn meta-data
    std::ostringstream os;

    char nplayers[4] = { 0, 0, 0, (char)turns.size() };
    os.write(nplayers, sizeof(nplayers));

    // turn-metadata: player addresses
    for(auto& m: turns) {
        auto& sender = std::get<0>(m);
        auto& addr = ALICE == sender ? alice_addr : bob_addr;
        addr.write_binary_be(os, 20);
    }

    // turn-metadata: next player addresses
    for(auto& m: turns) {
        auto& next_sender = std::get<2>(m);
        auto& addr = ALICE == next_sender ? alice_addr : bob_addr;
        addr.write_binary_be(os, 20);
    }

    // turn-metadata: player stake
    for(auto& m: turns) {
      auto& player_stake = std::get<3>(m);
      player_stake.write_binary_be(os, 32);
    }

    // turn-metadata: timestamps
    for(auto& m: turns) {
        bignumber zero = 0;
        zero.write_binary_be(os, 4);
    }

    // turn-metadata: turn-data sizes
    for(auto& m: turns) {
        auto& data = std::get<1>(m);
        bignumber sz = (int)data.size();
        sz.write_binary_be(os, 4);
    }
    raw_turn_metadata = os.str();

    // generate player info
    os = std::ostringstream();
    bignumber tmp = 2;
    tmp.write_binary_be(os, 4);
    alice_addr.write_binary_be(os, 32);
    bob_addr.write_binary_be(os, 32);
    alice_money.write_binary_be(os, 32);
    bob_money.write_binary_be(os, 32);
    raw_player_info = os.str();

    // generate verification info
    os = std::ostringstream();
    challenger_addr.write_binary_be(os, 20);

    bignumber challenge_time = 0;
    challenge_time.write_binary_be(os, 4);

    claimer_addr.write_binary_be(os, 20);

    bignumber claim_tume = 0;
    claim_tume.write_binary_be(os, 4);
    
    alice_money.write_binary_be(os, 32);
    bob_money.write_binary_be(os, 32);

    raw_verification_info = os.str();

    return SUCCESS;
}

}  // namespace poker
