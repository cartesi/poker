#include <sstream>
#include "codec.h"
#include "compression.h"

namespace poker {

static const char pfx_number = '#';
static const char pfx_string = '$';
static const char pfx_filler = '-';
static const char pfx_bignumber = '%';
static const char separator = '|';

encoder::encoder(std::ostream& out) : _out(out),  _written(0) {
}

encoder::~encoder() {
}

game_error encoder::write(int v) {
    std::stringstream ss;
    ss << pfx_number << v << separator;
    auto s = ss.str();
    _out << s;
    _written += s.size();
    return SUCCESS;
}

game_error encoder::write(message_type v) {
    game_error res;
    if ((res=write((int)v)))
        return res;
    return SUCCESS;
}

game_error encoder::write(blob& v) {
    return write(v.get_data(), v.size(), pfx_string);
}

game_error encoder::write(const std::string& v) {
    return write(v.c_str(), v.size(), pfx_string);
}

game_error encoder::write(const bignumber& v) {
    auto s = v.to_string(16);
    return write(s.c_str(), s.size(), pfx_bignumber);
}

game_error encoder::write(const char* v, int len, char pfx) {
    std::stringstream ss;
    ss << pfx << len << separator;
    auto s = ss.str();
    _out << s;
    if (len) {
        for(int i=0; i<len; i++) {
            _out.write(v+i, 1);
            if (!_out.good())
                return COD_ERROR;
        }
    }
    _written += len + s.size();
    return SUCCESS;
}

game_error encoder::pad(int padding_size) {
    int pads = padding_size - (_written % padding_size);
    while(pads--) {
        _out << pfx_filler;
        _written += 1;
    }
    return SUCCESS;
}

decoder::decoder(std::istream& in) : _in(in) { 
}

game_error decoder::read(int& v) {
    game_error err = skip_padding();
    if (err) return err;
    char pfx;
    if (!_in.good()) return COD_ERROR;
    _in >> pfx;
    if (!_in.good() || pfx != pfx_number) return COD_ERROR;
    _in >> v;
    if (_in.get() != separator) return COD_ERROR;
    return SUCCESS;
}

game_error decoder::read(message_type& v) {
    game_error res;
    int t;
    if ((res=read(t))) return res;
    v = (message_type)t;
    return SUCCESS;
}

game_error decoder::read(bet_type& v) {
    int temp;
    game_error res = read(temp);
    if (!res) v = (bet_type)temp;
    return res;
}

game_error decoder::read(std::string &v) {
    return read(v, pfx_string);
}

game_error decoder::read(std::string &v, char expected_pfx) {
    game_error err = skip_padding();
    if (err) return err;
    char pfx;
    int len;
    if (!_in.good()) return COD_ERROR;
    _in >> pfx;
    if (!_in.good() || pfx != expected_pfx) return COD_ERROR;
    _in >> len;
    if (_in.get() != separator) return COD_ERROR;
    if (!_in.good()) return COD_ERROR;4
    if (len) {
        v.resize(len);
        for(int i=0; i<len && _in.good(); i++) {
            v[i] = _in.get();
        }
    }
    return _in.good() ? SUCCESS : COD_ERROR;
}

game_error decoder::read(blob& v) {
    std::string s;
    auto res = read(s, pfx_string);
    if (res) return res;
    v.set_data(s);
    return SUCCESS;
}

game_error decoder::read(bignumber& v) {
    game_error res;
    std::string temp;
     if ((res=read(temp, pfx_bignumber)))
         return res;
    if ((res=v.parse_string(temp.c_str(), 16)))
        return res;
    
    return SUCCESS;
}

game_error decoder::skip_padding() {
    while(_in.good() && _in.peek()==pfx_filler) {
        char c;
        _in.read(&c, 1);
    }
    return _in.good() ? SUCCESS : COD_ERROR;
}

}
