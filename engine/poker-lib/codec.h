#ifndef CODEC_H
#define CODEC_H

#include <iostream>
#include "common.h"
#include "blob.h"
#include "bignumber.h"

namespace poker {

enum message_type {
    MSG_VTMF,
    MSG_VTMF_RESPONSE,
    MSG_VSSHE,
    MSG_VSSHE_RESPONSE,
    MSG_BOB_PRIVATE_CARDS,
    MSG_BET_REQUEST,
    MSG_CARD_PROOF
};

/*
 *  Data encoder
*/

class encoder {
    std::ostream& _out;
    int _written;
public:
    encoder(std::ostream& out);
    game_error write(int v);
    game_error write(message_type v);
    game_error write(blob& v);
    game_error write(const std::string& v);
    game_error write(const bignumber& v);
    game_error write(const char* v, int len, char pfx);
    game_error pad(int padding_size);
};

/*
 *  Data decoder
*/
class decoder {
    std::istream& _in;
public:
    bool eof() { return _in.eof(); }
    decoder(std::istream& in);
    game_error read(int& v);
    game_error read(bignumber& v);
    game_error read(message_type& v);
    game_error read(bet_type& v);
    game_error read(std::string& v);
    game_error read(std::string& v, char expected_pfx);
    game_error read(blob& v);
private:
    game_error skip_padding();
};

const int padding_size = 4*1024;


/*
 *  Messages transfered during live game and result verification
*/
class message {
public:
    message_type msgtype;

    message(message_type t);
    virtual ~message() { }
    virtual game_error write(std::ostream& os) = 0;
    virtual game_error read(std::istream& is) = 0;
    virtual std::string to_string() = 0;
    static game_error decode(std::istream& is, message** msg);
};

class msg_vtmf : public message {
public:
    money_t alice_money;
    money_t bob_money;
    money_t big_blind;
    blob vtmf;
    blob alice_key;
    
    msg_vtmf();
    virtual ~msg_vtmf() {}
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

class msg_vtmf_response : public message {
public:
    money_t alice_money;
    money_t bob_money;
    money_t big_blind;
    blob bob_key;

    msg_vtmf_response();
    virtual ~msg_vtmf_response() { }
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

class msg_vsshe : public message{
public:
    blob vsshe;
    blob stack;
    blob stack_proof;

    msg_vsshe();
    virtual ~msg_vsshe() { }
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

class msg_vsshe_response : public message {
public:
    blob stack;
    blob stack_proof;
    blob cards_proof;
    
    msg_vsshe_response();
    virtual ~msg_vsshe_response() { }
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

class msg_bob_private_cards : public message {
public:
    blob cards_proof;

    msg_bob_private_cards();
    virtual ~msg_bob_private_cards() { }
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

class msg_bet_request : public message {
public:
    int player_id;
    bet_type type;
    money_t amt;
    blob cards_proof;

    msg_bet_request();
    virtual ~msg_bet_request() { }
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

class msg_card_proof : public message {
public:
    int player_id;
    bet_type type;
    money_t amt;
    blob cards_proof;

    msg_card_proof();
    virtual ~msg_card_proof() { }
    game_error write(std::ostream& os) override;
    game_error read(std::istream& is) override;
    std::string to_string() override;
};

}
#endif
