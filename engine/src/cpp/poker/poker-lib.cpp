#include "poker-lib.h"

/////////////////////////////////////////////
//// blob
/////////////////////////////////////////////

blob::blob(const transport &o) : _out(tx), _in(itx) {
    tx.data = o.data;
}

blob::blob() : _out(tx), _in(itx) {}

blob::blob(const blob &o) : tx(o.tx), _out(tx), _in(itx) {}

blob& blob::operator = (const blob& o) {
    tx.data = o.tx.data;
    itx.data = o.tx.data;
    _in.reset();
    _out.reset();
    return *this;
}

blob::~blob() { }

otxstream& blob::out() {  
    return _out;
};

itxstream& blob::in() {
    itx.data = tx.data;
    return _in;
}

std::string blob::data() const { return tx.data; }

blob::operator std::string() const { return data(); }

/////////////////////////////////////////////
//// public_data
/////////////////////////////////////////////
public_data::public_data(int np) : players(np), keys(np), decks(np), deckProofs(np), flopProofs(np), privProofs(np) {
    for(auto p=0; p<players; p++) flopProofs[p].resize(FLOPSIZE);
    for(auto p=0; p<players; p++) {
        privProofs[p].resize(PRIVATE_CARDS);
        for(auto c=0; c<PRIVATE_CARDS; c++)
            privProofs[p][c].resize(players);
    }
}

/////////////////////////////////////////////
//// Poker
/////////////////////////////////////////////

void Poker::init_libraries() {
    init_libTMCG();
}

Poker::Poker(int p, int ps, public_data *data) : player(p), players(ps), pdata(data), leader(p==0) {}

int Poker::init() {
    std::stringstream ss;
    ss << "PLAYER " << player << ": ";
    PFX = ss.str();
    std::cout << PFX << "init " << std::endl;
    tmcg = new SchindelhauerTMCG(64, players, 6);
    if (leader) {
        vtmf = new BarnettSmartVTMF_dlog();
        if (!vtmf->CheckGroup()) {
            std::cerr << "*** ERROR BarnettSmartVTMF_dlog\n";
            return POKER_ERROR;
        }
        vtmf->PublishGroup(pdata->vtmfeGroup.out());
    } else {
        vtmf = new BarnettSmartVTMF_dlog(pdata->vtmfeGroup.in());
        if (!vtmf->CheckGroup()) {
             std::cerr << "*** ERROR BarnettSmartVTMF_dlog\n";
             return POKER_ERROR;
        }
    }
    return 0;
}

int Poker::publishKey() {
    std::cout << PFX << "publishKey " << std::endl;
	vtmf->KeyGenerationProtocol_GenerateKey();
	vtmf->KeyGenerationProtocol_PublishKey(pdata->keys[player].out());
    return 0;
}

int Poker::readKeys() {
    std::cout << PFX << "readKeys " << std::endl;
    for(int i=0; i<players; i++) {
        if (i==player) continue;
        if (!vtmf->KeyGenerationProtocol_UpdateKey(pdata->keys[i].in()))	{
    		std::cerr << "*** their public key was not correctly generated!" << std::endl;
    		return POKER_ERROR;
        }
    }
    vtmf->KeyGenerationProtocol_Finalize();
    if (leader) {
		vsshe = new GrothVSSHE(DECKSIZE,  vtmf->p, vtmf->q, vtmf->k, vtmf->g, vtmf->h);
		if (!vsshe->CheckGroup()) {
			std::cout << PFX << "*** VRHE instance" << " was not correctly generated!" << std::endl;
			return POKER_ERROR;
		}
		vsshe->PublishGroup(pdata->vssheGroup.out());
    } 
    else {
		vsshe = new GrothVSSHE(DECKSIZE, pdata->vssheGroup.in());
		if (!vsshe->CheckGroup()) {
			std::cout << PFX << "*** VRHE instance" << " was not correctly generated!" << std::endl;
            return POKER_ERROR;
		}
		if (mpz_cmp(vtmf->h, vsshe->com->h)) {
			std::cout << "VSSHE: common public key does not" <<	" match!" << std::endl;
            std::cout << PFX << "vtmf->h=" << vtmf->h << std::endl;
            std::cout << PFX << "vsshe->com->h=" << vsshe->com->h << std::endl;
            return POKER_ERROR;
		}
		if (mpz_cmp(vtmf->q, vsshe->com->q)) {
			std::cout << "VSSHE: subgroup order does not" << " match!" << std::endl;
			return POKER_ERROR;
		}
		if (mpz_cmp(vtmf->p, vsshe->p) || mpz_cmp(vtmf->q, vsshe->q) ||  mpz_cmp(vtmf->g, vsshe->g) || mpz_cmp(vtmf->h, vsshe->h)) {
			std::cout << "VSSHE: encryption scheme does not" <<	" match!" << std::endl;
            return POKER_ERROR;
		}

    }
    return 0;
}

int Poker::begin_shuffle() {
    std::cout << PFX << "begin_shuffle " << std::endl;
	for (size_t type = 0; type < DECKSIZE; type++) {
		VTMF_Card c;
		tmcg->TMCG_CreateOpenCard(c, vtmf, type);
		deck.push(type, c);
	}
    stack.push(deck); 
    tmcg->TMCG_CreateStackSecret(ss, false, stack.size(), vtmf);
    if (player > 0) {
        TMCG_Stack<VTMF_Card> s2;
        auto& in = pdata->decks[player-1].in();
        in >> s2;
		if (!in.good()) {
			std::cout << "shuffle: read or parse error" << std::endl;
			return POKER_ERROR;
		}
        if (!tmcg->TMCG_VerifyStackEquality_Groth_noninteractive(stack,	s2, vtmf, vsshe, pdata->deckProofs[player-1].in())) {
			std::cout << "*** shuffle: verification failed" << std::endl;
			return POKER_ERROR;
		}
        stack = s2;
    }
    TMCG_Stack<VTMF_Card> mix;
    tmcg->TMCG_MixStack(stack, mix, ss, vtmf);
    pdata->decks[player].out() << mix << std::endl;
    tmcg->TMCG_ProveStackEquality_Groth_noninteractive(stack, mix, ss, vtmf, vsshe, pdata->deckProofs[player].out());
    stack = mix;
    return 0;
}

int Poker::end_shuffle() {
    std::cout << PFX << "end_shuffle " << std::endl;
    if (player < players-1) {
        TMCG_Stack<VTMF_Card> s2;
        auto& in = pdata->decks[players-1].in();
        in >> s2;
		if (!in.good()) {
			std::cout << "shuffle: read or parse error" << std::endl;
			return POKER_ERROR;
		}
        if (!tmcg->TMCG_VerifyStackEquality_Groth_noninteractive(stack,	s2, vtmf, vsshe, pdata->deckProofs[players-1].in())) {
			std::cout << "*** shuffle: verification failed" << std::endl;
			return POKER_ERROR;
		}
        stack = s2;
    }

    // deal cards
	for (size_t i = 0; i < FLOPSIZE; i++) {
        VTMF_Card c;
		stack.pop(c);
        flop.push(c);
	}
    hands.resize(players);
    for(auto i=0; i < players; i++) {
        for(int c=0; c<PRIVATE_CARDS; c++) {
            VTMF_Card card;
            stack.pop(card);
            hands[i].push(card);
        }
    }
    open_hands.resize(players);
    return 0;
}

int Poker::send_flop_proofs() {
    std::cout << PFX << "send_flop_proofs " << std::endl;
	for (size_t k = 0; k < flop.size(); k++) {
        blob dummy;
        tmcg->TMCG_ProveCardSecret(flop[k], vtmf, dummy.in(), pdata->flopProofs[player][k].out());
    }
    return 0;
}

int Poker::receive_flop_proofs() {
    std::cout << PFX << "receive_flop_proofs " << std::endl;
	for (auto i = 0; i < flop.size(); i++) {
		tmcg->TMCG_SelfCardSecret(flop[i], vtmf);
        for(auto p = 0; p<players; p++) {
            if (p==player) continue;
            blob dummy;
			if (!tmcg->TMCG_VerifyCardSecret(flop[i], vtmf,	pdata->flopProofs[p][i].in(), dummy.out())) {
				std::cout << "*** [receive_flop_proofs] Card verification failed!" << std::endl;
				return POKER_ERROR;
			}
		    size_t type = tmcg->TMCG_TypeOfCard(flop[i], vtmf);
            open_flop.push(type, flop[i]);
            std::cout << PFX << "flop card: " << type << std::endl;
        }
    }
    return 0;
}

int Poker::send_proof(int card_owner, int card) {
    std::cout << PFX << "send_proof " << std::endl;
    blob dummy;
    tmcg->TMCG_ProveCardSecret(
        hands[card_owner][card], vtmf, 
        dummy.in(), 
        pdata->privProofs[player][card][card_owner].out());
    return 0;
}

int Poker::receive_proof(int card_owner, int card, int prover) {
    std::cout << PFX << "receive_proof card_owner:" << card_owner << " card:" << card << " prover:" << prover << std::endl;
    blob dummy;
	if (!tmcg->TMCG_VerifyCardSecret(hands[card_owner][card], vtmf,	
        pdata->privProofs[prover][card][card_owner].in(), dummy.out())) {
		std::cout << "*** Card verification failed!" << std::endl;
		return POKER_ERROR;
	}

    return 0;
}

int Poker::open_card(int card_owner, int card) {
    std::cout << PFX << "open_card card_owner:" << card_owner  << " card:" << card << std::endl;
	tmcg->TMCG_SelfCardSecret(hands[card_owner][card], vtmf);        
    for(auto p=0; p<players; p++) {
        if (p==player) continue;
        if (receive_proof(card_owner, card, p)) return POKER_ERROR;
    }
    size_t type = tmcg->TMCG_TypeOfCard(hands[card_owner][card], vtmf);
    open_hands[card_owner].push(type, hands[card_owner][card]);
    std::cout << PFX << "hand[" << card_owner << " x " << card << "] : " << type << std::endl;
    return 0;
}

int Poker::get_flop_size() {
    return FLOPSIZE;
}

int Poker::get_hand_size() {
    return PRIVATE_CARDS;
}

int Poker::get_flop_card(int index) {
    return open_flop[index].first;
}

int Poker::get_hand(int index, int card_owner) {
    return open_hands[card_owner][index].first;
}

