#ifndef CODEC_H
#define CODEC_H

#include <iostream>
#include <sstream>
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
    virtual ~encoder();
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
    game_error read(bool& v);
    game_error read(bignumber& v);
    game_error read(message_type& v);
    game_error read(bet_type& v);
    game_error read(std::string& v);
    game_error read(std::string& v, char expected_pfx);
    game_error read(blob& v);
private:
    game_error skip_padding();
};

} // namespace poker

#endif
