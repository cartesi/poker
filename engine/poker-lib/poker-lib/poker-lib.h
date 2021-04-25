#ifndef POKER_LIB_H
#define POKER_LIB_H

#include <libTMCG.hh>
#include <string>
#include "s-stream.h"

namespace poker {

#define  POKER_ERROR  -1

int init_poker_lib();

class blob;

class player {
    const int decksize = 52;
    
    int id;
    int _num_players;
    std::string _pfx;
    SchindelhauerTMCG *_tmcg;
    BarnettSmartVTMF_dlog *_vtmf;
	GrothVSSHE *_vsshe;
	TMCG_Stack<VTMF_Card> _stack;
	TMCG_StackSecret<VTMF_CardSecret> _ss;
	TMCG_Stack<VTMF_Card> _cards;
    std::map<int, size_t> _open_cards;

public:
    player(int player_id, int num_players);
    ~player();

    // initial group generation
    int create_group(blob& group);
    int load_group(blob& group);

    // Key generation protocol
    int generate_key(blob& key);
    int load_their_key(blob& key);
    int finalize_key_generation();

    // VSSHE - Verifiable Secret Shuffle of Homomorphic Encryptions.}@*
    int create_vsshe_group(blob& group);
    int load_vsshe_group(blob& group);

    // Stack
    int create_stack();
    int shuffle_stack(blob& mixed_stack, blob& stack_proof);
    int load_stack(blob& mixed_stack, blob& mixed_stack_proof);

    // Cards
    int take_cards_from_stack(int count);
    int prove_card_secret(int card_index, blob& my_proof);
    int self_card_seret(int card_index);
    int verify_card_seret(int card_index, blob& their_proof);
    int open_card(int card_index);
    size_t get_open_card(int card_index);
};

class blob {
    std::string _data;
    osstream _out;
    isstream _in;
public:
    blob() : _out(_data), _in(_data) { }
    blob(const blob &other) : _data(other._data), _out(_data), _in(_data) { }
    void set_data(const char* d) { _data = d;}
    const char* get_data() { return _data.c_str(); }
    int size() { return _data.size(); }
    void clear() { _data.clear(); }
    std::ostream& out() { return _out; }
    std::istream& in() { 
        _in.rewind();
        return _in;
    }

    operator std::string () { return _data; }
    
};



} // namespace poker

#endif