#ifndef TMCG_PARTICIPANT_H
#define TMCG_PARTICIPANT_H

#include <libTMCG.hh>
#include <map>
#include <string>

#include "i_participant.h"

namespace poker {

class participant : public i_participant {
    int _id;
    int _num_participants;
    bool _predictable;
    std::string _pfx;
    SchindelhauerTMCG* _tmcg;
    BarnettSmartVTMF_dlog* _vtmf;
    GrothVSSHE* _vsshe;
    TMCG_Stack<VTMF_Card> _stack;
    TMCG_StackSecret<VTMF_CardSecret> _ss;
    TMCG_Stack<VTMF_Card> _cards;
    std::map<int, size_t> _open_cards;

   public:
    participant();
    virtual ~participant();

    void init(int id, int num_participants, bool predictable) override;
    int id() override;
    int num_participants() override;
    bool predictable() override;

    game_error create_group(blob& group) override;
    game_error load_group(blob& group) override;

    // Key generation protocol
    game_error generate_key(blob& key) override;
    game_error load_their_key(blob& key) override;
    game_error finalize_key_generation() override;

    // VSSHE - Verifiable Secret Shuffle of Homomorphic Encryptions.
    game_error create_vsshe_group(blob& group) override;
    game_error load_vsshe_group(blob& group) override;

    // Stack
    game_error create_stack() override;
    game_error shuffle_stack(blob& mixed_stack, blob& stack_proof) override;
    game_error load_stack(blob& mixed_stack, blob& mixed_stack_proof) override;

    // Cards
    game_error take_cards_from_stack(int count) override;
    game_error prove_card_secret(int card_index, blob& my_proof) override;
    game_error self_card_secret(int card_index) override;
    game_error verify_card_secret(int card_index, blob& their_proof) override;
    game_error open_card(int card_index) override;
    size_t get_open_card(int card_index) override;
};

}  // namespace poker

#endif