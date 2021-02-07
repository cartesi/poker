#ifndef POKER_LIB
#define POKER_LIB

#include <libTMCG.hh>
#include <sys/types.h>
#include <stdio.h>
#include <gmp.h>
#include <gcrypt.h>
#include <gpg-error.h>
#include <errno.h>
#include <iostream>
#include <sstream>
#include "tx-stream.h"

#undef NDEBUG
#define DECKSIZE 52
#define PRIVATE_CARDS 2
#define FLOPSIZE 3
#define POKER_ERROR 7777

class blob {
    transport tx;
    transport itx;
    otxstream _out;
    itxstream _in;
public:
    blob();
    blob(const transport &o);
    blob(const blob &o);
    blob& operator = (const blob& o);
    ~blob();
    otxstream& out();
    itxstream& in();
    std::string data() const;
    operator std::string () const;
};

class public_data {
public:
    public_data(int np);
    int players;
    blob vtmfeGroup;
    std::vector<blob> keys;
    blob vssheGroup;
    std::vector<blob> decks;
    std::vector<blob> deckProofs; 
    std::vector<std::vector<blob>> flopProofs;  // prover x flop_card
    std::vector<std::vector<std::vector<blob>>> privProofs; // prover x priv_card x card_owner
};

class Poker {
public:    
    bool leader;
    int player;
    int players;
    std::string PFX;
    public_data *pdata;
private:    
    SchindelhauerTMCG *tmcg;
    BarnettSmartVTMF_dlog *vtmf;
	GrothVSSHE *vsshe;
    
	TMCG_OpenStack<VTMF_Card> deck;
	TMCG_Stack<VTMF_Card> stack;
	TMCG_StackSecret<VTMF_CardSecret> ss;
	TMCG_Stack<VTMF_Card> flop;
	TMCG_OpenStack<VTMF_Card> open_flop;
    std::vector<TMCG_Stack<VTMF_Card>> hands; // card_owner x card
	std::vector<TMCG_OpenStack<VTMF_Card>> open_hands; // card_owner x card

public:
    static void init_libraries();
    Poker(int p, int ps, public_data *data);
    int init();
    int publishKey();
    int readKeys();
    int begin_shuffle();
    int end_shuffle();
    int send_flop_proofs();
    int receive_flop_proofs();
    int send_proof(int card_owner, int card);
    int receive_proof(int card_owner, int card, int prover);
    int open_card(int card_owner, int card);
    int get_flop_size();
    int get_hand_size();
    int get_flop_card(int index);
    int get_hand(int index, int card_owner);
};

#endif





