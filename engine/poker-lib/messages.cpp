#include <sstream>
#include "messages.h"

namespace poker {

message::message(message_type t) : msgtype(t) {

}

game_error message::decode(std::istream& is, message** msg) {
    game_error res;

    decoder in(is);
    message* m = NULL;
    message_type type;
    if ((res=in.read(type)))
        return res;

    switch(type) {
        case MSG_VTMF: 
            m = new msg_vtmf();
            break;
        case MSG_VTMF_RESPONSE:
            m = new msg_vtmf_response();
            break;
        case MSG_VSSHE:
            m = new msg_vsshe();
            break;
        case MSG_VSSHE_RESPONSE:
            m = new msg_vsshe_response();
            break;
        case MSG_BOB_PRIVATE_CARDS:
            m = new msg_bob_private_cards();
            break;
        case MSG_BET_REQUEST:
            m = new msg_bet_request();
            break;
        case MSG_CARD_PROOF:
            m = new msg_card_proof();
            break;
        default:
            return COD_INVALID_MSG_TYPE;
    }

    if ((res=m->read(is))) {
        delete m;
        return res;
    }
    *msg = m;
    return SUCCESS;
}

msg_vtmf::msg_vtmf() : message(MSG_VTMF) {

}

game_error msg_vtmf::write(std::ostream& os)  {
    game_error res;
    encoder out(os);
    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(alice_money))) return res;
    if ((res=out.write(bob_money))) return res;
    if ((res=out.write(big_blind))) return res;
    if ((res=out.write(vtmf))) return res;
    if ((res=out.write(alice_key))) return res;
    return SUCCESS;
}

game_error msg_vtmf::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(alice_money))) return res;
    if ((res=in.read(bob_money))) return res;
    if ((res=in.read(big_blind))) return res;
    if ((res=in.read(vtmf))) return res;
    if ((res=in.read(alice_key))) return res;
    return SUCCESS;
}

std::string msg_vtmf::to_string() {
    return "msg_vtmf::";
}

msg_vtmf_response::msg_vtmf_response() : message(MSG_VTMF_RESPONSE) {
}

game_error msg_vtmf_response::write(std::ostream& os)  {
    game_error res;
    encoder out(os);
    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(alice_money))) return res;
    if ((res=out.write(bob_money))) return res;
    if ((res=out.write(big_blind))) return res;
    if ((res=out.write(bob_key))) return res;
    return SUCCESS;
}

game_error msg_vtmf_response::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(alice_money))) return res;
    if ((res=in.read(bob_money))) return res;
    if ((res=in.read(big_blind))) return res;
    if ((res=in.read(bob_key))) return res;
    return SUCCESS;
}

std::string msg_vtmf_response::to_string() {
    return "msg_vtmf_response";
}

msg_vsshe::msg_vsshe() : message(MSG_VSSHE) { 
}

game_error msg_vsshe::write(std::ostream& os)  {
    game_error res;
    encoder out(os);
    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(vsshe))) return res;
    if ((res=out.write(stack))) return res;
    if ((res=out.write(stack_proof))) return res;
    return SUCCESS;
}

game_error msg_vsshe::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(vsshe))) return res;
    if ((res=in.read(stack))) return res;
    if ((res=in.read(stack_proof))) return res;
    return SUCCESS;
}

std::string msg_vsshe::to_string() {
    return "msg_vsshe";
}

msg_vsshe_response::msg_vsshe_response() : message(MSG_VSSHE_RESPONSE) { 
}

game_error msg_vsshe_response::write(std::ostream& os)  {
    game_error res;
    encoder out(os);
    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(stack))) return res;
    if ((res=out.write(stack_proof))) return res;
    if ((res=out.write(cards_proof))) return res;
    return SUCCESS;
}

game_error msg_vsshe_response::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(stack))) return res;
    if ((res=in.read(stack_proof))) return res;
    if ((res=in.read(cards_proof))) return res;
    return SUCCESS;
}

std::string msg_vsshe_response::to_string() {
    return "msg_vsshe_response";
}

msg_bob_private_cards::msg_bob_private_cards() : message(MSG_BOB_PRIVATE_CARDS) {
}

game_error msg_bob_private_cards::write(std::ostream& os)  {
    game_error res;
    encoder out(os);
    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(cards_proof))) return res;
    return SUCCESS;
}

game_error msg_bob_private_cards::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(cards_proof))) return res;
    return SUCCESS;
}

std::string msg_bob_private_cards::to_string() {
    return "msg_bob_private_cards";
}

msg_bet_request::msg_bet_request() : message(MSG_BET_REQUEST) {

}

game_error msg_bet_request::write(std::ostream& os)  {
    game_error res;
    encoder out(os);

    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(player_id))) return res;
    if ((res=out.write(type))) return res;
    if ((res=out.write(amt))) return res;
    if ((res=out.write(cards_proof))) return res;
    return SUCCESS;
}

game_error msg_bet_request::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(player_id))) return res;
    if ((res=in.read(type))) return res;
    if ((res=in.read(amt))) return res;
    if ((res=in.read(cards_proof))) return res;
    return SUCCESS;
}

std::string msg_bet_request::to_string() {
    std::stringstream ss;
    ss << "msg_bet_request player:" << player_id
       << " type:" << type << " amt: " << (int)amt;
    return ss.str();
}

msg_card_proof::msg_card_proof() : message(MSG_CARD_PROOF) {
}

game_error msg_card_proof::write(std::ostream& os)  {
    game_error res;
    encoder out(os);
    if ((res=out.write(msgtype))) return res;
    if ((res=out.write(player_id))) return res;
    if ((res=out.write(type))) return res;
    if ((res=out.write(amt))) return res;
    if ((res=out.write(cards_proof))) return res;
    return SUCCESS;
}

game_error msg_card_proof::read(std::istream& is)  {
    game_error res;
    decoder in(is);
    if ((res=in.read(player_id))) return res;
    if ((res=in.read(type))) return res;
    if ((res=in.read(amt))) return res;
    if ((res=in.read(cards_proof))) return res;
    return SUCCESS;
}

std::string msg_card_proof::to_string() {
    std::stringstream ss;
    ss << "msg_card_proof player:" << player_id;
    return ss.str();
}

} // namespace poker

