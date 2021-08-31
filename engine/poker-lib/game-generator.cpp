#include "game-generator.h"

#include <array>

namespace poker {

game_error game_generator::generate() {
    game_error res;

    std::array<player, 2> players{player(ALICE), player(BOB)};
    std::vector<std::tuple<int, std::string>> msgs;  // tuple(sender, msg)

    for (auto& p : players)
        if ((res = p.init(alice_money, bob_money, big_blind)))
            return res;

    // Handshake
    std::string msg1, msg2;
    std::array<game_error, 2> r = {CONTINUED, CONTINUED};
    int p = ALICE;  // current player
    if ((res = players[p].create_handshake(msg1)))
        return res;
    msgs.push_back({p, msg1});
    do {
        p = opponent_id(p);
        if (r[p] == CONTINUED) {
            msg2.clear();
            logger << "\nHANDSHAKE " << p << "\n";
            r[p] = players[p].process_handshake(msg1, msg2);
            if (msg2.size()) {
                msgs.push_back({p, msg2});
                msg1 = msg2;
            }
        }
    } while (r[ALICE] == CONTINUED || r[BOB] == CONTINUED);
    if (r[ALICE] != SUCCESS)
        return r[ALICE];
    if (r[BOB] != SUCCESS)
        return r[BOB];

    // bets
    auto t = BET_CALL;
    auto amount = 0;
    auto did_raise = false;
    p = players[ALICE].game().current_player;
    while (!players[ALICE].game_over() && !players[BOB].game_over()) {
        if (!players[p].game_over()) {
            r = {CONTINUED, CONTINUED};
            if (last_aggressor >= 0 && players[p].game().phase == bet_phase::PHS_RIVER) {
                if (p == last_aggressor) {
                    t = BET_RAISE;
                    did_raise = true;
                    amount = 10;
                } else if (did_raise) {
                    t = BET_CALL;
                    amount = 0;
                } else {
                    t = BET_CHECK;
                }
            }
            r[p] = players[p].create_bet(t, amount, msg1);
            logger << "\n== " << p << " CREATE BET: " << r[p] << "\n";
            if (r[p] != SUCCESS && r[p] != CONTINUED)
                return r[p];
            t = BET_CHECK;
            msgs.push_back({p, msg1});
            do {
                p = opponent_id(p);
                if (r[p] == CONTINUED) {
                    msg2.clear();
                    r[p] = players[p].process_bet(msg1, msg2);
                    logger << "\n== " << p << " PROCESS BET: " << r[p] << "\n";
                    if (msg2.size()) {
                        msgs.push_back({p, msg2});
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

    game = players[ALICE].game();

    // generate turn data
    raw_turn_data.clear();
    for (auto&& m : msgs)
        raw_turn_data += std::get<1>(m);

    // generate turn meta-data
    std::ostringstream os;
    char filler[12] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    char nplayers[4] = {0, 0, 0, (char)msgs.size()};
    os.write(nplayers, sizeof(nplayers));

    // turn-metadata: player addresses
    for (auto& m : msgs) {
        auto& sender = std::get<0>(m);
        auto& data = std::get<1>(m);
        auto& addr = ALICE == sender ? alice_addr : bob_addr;
        os.write(filler, sizeof(filler));
        addr.write_binary_be(os, 20);
    }

    // turn-metadata: timestamps
    for (auto& m : msgs) {
        char tmp[32];
        memset(tmp, 0, sizeof(tmp));
        os.write(tmp, 32);
    }

    // turn-metadata: turn-data sizes
    for (auto& m : msgs) {
        auto& data = std::get<1>(m);
        char tmp[32];
        bignumber sz = (int)data.size();
        memset(tmp, 0, sizeof(tmp));
        sz.store_binary_be(tmp, sizeof(tmp));
        os.write(tmp, sizeof(tmp));
    }
    raw_turn_metadata = os.str();

    // generate player info
    os = std::ostringstream();
    bignumber tmp = 2;
    tmp.write_binary_be(os, 4);
    tmp = 0;
    tmp.write_binary_be(os, 12);
    alice_addr.write_binary_be(os, 20);
    tmp.write_binary_be(os, 12);
    bob_addr.write_binary_be(os, 20);
    alice_money.write_binary_be(os, 32);
    bob_money.write_binary_be(os, 32);
    raw_player_info = os.str();

    // generate verification info
    os = std::ostringstream();
    challenger_addr.write_binary_be(os, 20);
    claimer_addr.write_binary_be(os, 20);
    alice_money.write_binary_be(os, 32);
    bob_money.write_binary_be(os, 32);
    raw_verification_info = os.str();

    return SUCCESS;
}

}  // namespace poker
