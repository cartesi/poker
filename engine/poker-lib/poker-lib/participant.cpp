#include "participant.h"
#include <iostream>
#include <sstream>
#include "s-stream.h"

void set_libtmcg_cartesi_predictable(int v);

namespace poker {

class participant;

class libtmcg_guard {
public:
    libtmcg_guard(participant* p) {
        //std::cout << "\n>>> patching libtmcg " << p->predictable() << std::endl;
        set_libtmcg_cartesi_predictable(p->predictable());
    }
    ~libtmcg_guard() {
        //std::cout << "<<< unpatching libtmcg\n" << std::endl;
        set_libtmcg_cartesi_predictable(0);
    }
};

participant::participant(int participant_id, int num_participants, bool predictable)
    : _id(participant_id), _num_participants(num_participants), _predictable(predictable), _vtmf(NULL), _tmcg(NULL), _vsshe(NULL)
{
    char temp[10];
    sprintf(temp, "[%d] ", _id);
    _pfx = temp;
}

participant::~participant() {
    delete _vtmf;
    delete _tmcg;
    delete _vsshe;
}

int participant::create_group(blob& group) {
    libtmcg_guard patch_ltmcg(this);
    _tmcg = new SchindelhauerTMCG(64, _num_participants, 6 /* bits  for 52 cards*/);
    _vtmf = new BarnettSmartVTMF_dlog();
    std::cout << _pfx << "BarnettSmartVTMF_dlog done " << std::endl;
    if (!_vtmf->CheckGroup()) {
        std::cerr << "*** ERROR BarnettSmartVTMF_dlog\n";
        return POKER_ERROR;
    }
    _vtmf->PublishGroup(group.out());
    return 0;
}

int participant::load_group(blob& group) {
    libtmcg_guard patch_ltmcg(this);
    _tmcg = new SchindelhauerTMCG(64, _num_participants, 6 /* bits for 52 cards*/);
    _vtmf = new BarnettSmartVTMF_dlog(group.in());
    if (!_vtmf->CheckGroup()) {
         std::cerr << "*** ERROR BarnettSmartVTMF_dlog\n";
         return POKER_ERROR;
    }
    return 0;
}

int participant::generate_key(blob& key) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "publishKey " << std::endl;
    _vtmf->KeyGenerationProtocol_GenerateKey();
    _vtmf->KeyGenerationProtocol_PublishKey(key.out());
    return 0;
}

int participant::load_their_key(blob& key) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "load_their_key " << std::endl;
    if (!_vtmf->KeyGenerationProtocol_UpdateKey(key.in())) {
		std::cerr << "*** their public key was not correctly generated!" << std::endl;
		return POKER_ERROR;
    }
    return 0;
}

int participant::finalize_key_generation() {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "finalize_key_generation " << std::endl;
    _vtmf->KeyGenerationProtocol_Finalize();
    return 0;
}

int participant::create_vsshe_group(blob& group) {
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

int participant::load_vsshe_group(blob& group) {
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

int participant::create_stack() {
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

int participant::shuffle_stack(blob& mixed_stack, blob& stack_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "shuffle_stack" << std::endl;
    TMCG_Stack<VTMF_Card> mix;
    _tmcg->TMCG_MixStack(_stack, mix, _ss, _vtmf);
    mixed_stack.out() << mix << std::endl;
    _tmcg->TMCG_ProveStackEquality_Groth_noninteractive(_stack, mix, _ss, _vtmf, _vsshe, stack_proof.out());
    _stack = mix;
    return 0;
}

int participant::load_stack(blob& mixed_stack, blob& mixed_stack_proof) {
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

int participant::take_cards_from_stack(int count) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "take_cards_from_stack(" << count << ")" << std::endl;
	for (size_t i = 0; i < count; i++) {
        VTMF_Card c;
		_stack.pop(c);
        _cards.push(c);
	}
    return 0;
}

int participant::prove_card_secret(int card_index, blob& my_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "prove_card_secret(" << card_index << ")" << std::endl;
    blob dummy; // not used b/c this is non-interactive proof
    _tmcg->TMCG_ProveCardSecret(_cards[card_index], _vtmf, dummy.in(), my_proof.out());
    return 0;
}

int participant::self_card_secret(int card_index) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "self_card_secret(" << card_index << ")" << std::endl;
    _tmcg->TMCG_SelfCardSecret(_cards[card_index], _vtmf);
    return 0;
}

int participant::verify_card_secret(int card_index, blob& their_proof) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "verify_card_secret(" << card_index << ")" << std::endl;
    blob dummy; // not used b/c this is non-interactive proof
	if (!_tmcg->TMCG_VerifyCardSecret(_cards[card_index], _vtmf,	their_proof.in(), dummy.out())) {
		std::cout << "*** [verify_card_secret] Card " << card_index << " verification failed!" << std::endl;
		return POKER_ERROR;
	}
    return 0;
}

int participant::open_card(int card_index) {
    libtmcg_guard patch_ltmcg(this);
    std::cout << _pfx << "open_card(" << card_index << ")" << std::endl;
    size_t card_type = _tmcg->TMCG_TypeOfCard(_cards[card_index], _vtmf);
    if (card_type >= decksize) {
        std::cout << _pfx << "failed to open_card(" << card_index << ") = " << std::endl;        
        return card_type;
    }
    _open_cards[card_index] = card_type;
    std::cout << _pfx << "open_card(" << card_index << ") = " << (int)card_type << std::endl;
    return 0;
}

size_t participant::get_open_card(int card_index) {
    std::cout << _pfx << "get_open_card(" << card_index << ")" << std::endl;
    auto card_type =  _open_cards[card_index];
    std::cout << _pfx << "get_open_card(" << card_index << ") = " << card_type << std::endl;
    return card_type;
}

} // namespace poker