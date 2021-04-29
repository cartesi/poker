#include "poker-lib.h"
#include <iostream>
#include <sstream>
#include "s-stream.h"

void set_libtmcg_cartesi_predictable(int v);

namespace poker {

class player;

int init_poker_lib() {
    init_libTMCG();
    return 0;
}

class libtmcg_guard {
public:
    libtmcg_guard(player* p) {
        set_libtmcg_cartesi_predictable(p->predictable());
    }
    ~libtmcg_guard() {
        set_libtmcg_cartesi_predictable(0);
    }
};

player::player(int player_id, int num_players, bool predictable)
    : _id(player_id), _num_players(num_players), _predictable(predictable), _vtmf(NULL), _tmcg(NULL), _vsshe(NULL)
{
    char temp[10];
    sprintf(temp, "[%d] ", _id);
    _pfx = temp;
}

player::~player() {
    delete _vtmf;
    delete _tmcg;
    delete _vsshe;
}

int player::create_group(blob& group) {
    libtmcg_guard patch_ltmcg(this);
    _tmcg = new SchindelhauerTMCG(64, _num_players, 6 /* bits  for 52 cards*/);
    _vtmf = new BarnettSmartVTMF_dlog();
    std::cout << _pfx << "BarnettSmartVTMF_dlog done " << std::endl;
    if (!_vtmf->CheckGroup()) {
        std::cerr << "*** ERROR BarnettSmartVTMF_dlog\n";
        return POKER_ERROR;
    }
    _vtmf->PublishGroup(group.out());
    return 0;
}

int player::load_group(blob& group) {
    libtmcg_guard patch_ltmcg(this);
    _tmcg = new SchindelhauerTMCG(64, _num_players, 6 /* bits for 52 cards*/);
    _vtmf = new BarnettSmartVTMF_dlog(group.in());
    if (!_vtmf->CheckGroup()) {
         std::cerr << "*** ERROR BarnettSmartVTMF_dlog\n";
         return POKER_ERROR;
    }
    return 0;
}

int player::generate_key(blob& key) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "publishKey " << std::endl;
    _vtmf->KeyGenerationProtocol_GenerateKey();
    _vtmf->KeyGenerationProtocol_PublishKey(key.out());
    return 0;
}

int player::load_their_key(blob& key) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "load_their_key " << std::endl;
    if (!_vtmf->KeyGenerationProtocol_UpdateKey(key.in())) {
		std::cerr << "*** their public key was not correctly generated!" << std::endl;
		return POKER_ERROR;
    }
    return 0;
}

int player::finalize_key_generation() {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "finalize_key_generation " << std::endl;
    _vtmf->KeyGenerationProtocol_Finalize();
    return 0;
}

int player::create_vsshe_group(blob& group) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "create_vsshe_group" << std::endl;
    _vsshe = new GrothVSSHE(decksize,  _vtmf->p, _vtmf->q, _vtmf->k, _vtmf->g, _vtmf->h);
    if (!_vsshe->CheckGroup()) {
        std::cout << _pfx << "*** VRHE instance" << " was not correctly generated!" << std::endl;
        return POKER_ERROR;
    }
    _vsshe->PublishGroup(group.out());
    return 0;
}

int player::load_vsshe_group(blob& group) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "load_vsshe_group" << std::endl;
	_vsshe = new GrothVSSHE(decksize, group.in());
	if (!_vsshe->CheckGroup()) {
		std::cout << _pfx << "*** VRHE instance" << " was not correctly generated!" << std::endl;
        return POKER_ERROR;
	}

	if (mpz_cmp(_vtmf->h, _vsshe->com->h)) {
		std::cout << "VSSHE: common public key does not" <<	" match!" << std::endl;
        std::cout << _pfx << "_vtmf->h = "  << std::endl << _vtmf->h << std::endl;
        std::cout << _pfx << "_vsshe->com->h = " << std::endl << _vsshe->com->h << std::endl;
        return POKER_ERROR;
	}
    
	if (mpz_cmp(_vtmf->q, _vsshe->com->q)) {
		std::cout << "VSSHE: subgroup order does not" << " match!" << std::endl;
		return POKER_ERROR;
	}	
    if (mpz_cmp(_vtmf->p, _vsshe->p) || mpz_cmp(_vtmf->q, _vsshe->q) ||  mpz_cmp(_vtmf->g, _vsshe->g) || mpz_cmp(_vtmf->h, _vsshe->h)) {
		std::cout << "VSSHE: encryption scheme does not" <<	" match!" << std::endl;
        return POKER_ERROR;
	}
    return 0;
}

int player::create_stack() {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "create_stack " << std::endl;
	TMCG_OpenStack<VTMF_Card> deck;
	for (size_t type = 0; type < decksize; type++) {
		VTMF_Card c;
		_tmcg->TMCG_CreateOpenCard(c, _vtmf, type);
		deck.push(type, c);
	}
    _stack.push(deck); 
    _tmcg->TMCG_CreateStackSecret(_ss, false, _stack.size(), _vtmf);
    return 0;
}

int player::shuffle_stack(blob& mixed_stack, blob& stack_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "shuffle_stack" << std::endl;
    TMCG_Stack<VTMF_Card> mix;
    _tmcg->TMCG_MixStack(_stack, mix, _ss, _vtmf);
    mixed_stack.out() << mix << std::endl;
    _tmcg->TMCG_ProveStackEquality_Groth_noninteractive(_stack, mix, _ss, _vtmf, _vsshe, stack_proof.out());
    _stack = mix;
    return 0;
}

int player::load_stack(blob& mixed_stack, blob& mixed_stack_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "load_stack " << std::endl;
    TMCG_Stack<VTMF_Card> s2;
    mixed_stack.in() >> s2;

	if (!mixed_stack.in()) {
		std::cout << "shuffle: read or parse error" << std::endl;
		return POKER_ERROR;
	}
    if (!_tmcg->TMCG_VerifyStackEquality_Groth_noninteractive(_stack,	s2, _vtmf, _vsshe, mixed_stack_proof.in())) {
		std::cout << "*** shuffle: verification failed" << std::endl;
		return POKER_ERROR;
	}
    _stack = s2;
    return 0;
}

int player::take_cards_from_stack(int count) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "take_cards_from_stack(" << count << ")" << std::endl;
	for (size_t i = 0; i < count; i++) {
        VTMF_Card c;
		_stack.pop(c);
        _cards.push(c);
	}
    return 0;
}

int player::prove_card_secret(int card_index, blob& my_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "prove_card_secret(" << card_index << ")" << std::endl;
    blob dummy; // not used b/c this is non-interactive proof
    _tmcg->TMCG_ProveCardSecret(_cards[card_index], _vtmf, dummy.in(), my_proof.out());
    return 0;
}

int player::self_card_secret(int card_index) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "self_card_secret(" << card_index << ")" << std::endl;
    _tmcg->TMCG_SelfCardSecret(_cards[card_index], _vtmf);
    return 0;
}

int player::verify_card_secret(int card_index, blob& their_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "verify_card_secret(" << card_index << ")" << std::endl;
    blob dummy; // not used b/c this is non-interactive proof
	if (!_tmcg->TMCG_VerifyCardSecret(_cards[card_index], _vtmf,	their_proof.in(), dummy.out())) {
		std::cout << "*** [verify_card_secret] Card " << card_index << " verification failed!" << std::endl;
		return POKER_ERROR;
	}
    return 0;
}

int player::open_card(int card_index) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "open_card(" << card_index << ")" << std::endl;
    size_t card_type = _tmcg->TMCG_TypeOfCard(_cards[card_index], _vtmf);
    _open_cards[card_index] = card_type;
    std::cout << _pfx << "open_card(" << card_index << ") = " << (int)card_type << std::endl;
    return card_type;
}

size_t player::get_open_card(int card_index) {
    std::cout << _pfx << "get_open_card(" << card_index << ")" << std::endl;
    auto card_type =  _open_cards[card_index];
    std::cout << _pfx << "get_open_card(" << card_index << ") = " << card_type << std::endl;
    return card_type;
}


} // namespace poker