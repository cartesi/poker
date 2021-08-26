#include <memory.h>
#include "bignumber.h"
#include <iostream>

namespace poker {

std::string bignumber::to_string(int base)  const{
    char* mem = mpz_get_str(NULL, base, n);
    std::string s = mem;
    free(mem);
    return s;
}

game_error bignumber::parse_string(const char* s, int base) {
    if (mpz_set_str(n, s, base))
        return BIG_UNPARSEABLE;
    return SUCCESS;
}

void bignumber::load_binary_be(char* data, int len) {
    auto udata = (unsigned char*)data;
    mpz_set_ui(n, 0);
    for(int i=0; i<len; i++) {
        mpz_mul_ui(n, n, 256);
        mpz_add_ui(n, n, udata[i]);
    }
}

void bignumber::store_binary_be(char* data, int len) {
    mpz_t r, t;
    mpz_init(r);
    mpz_init(t);
    mpz_set(t, n);
    for(int i=len-1; i>=0; i--) {
        mpz_mod_ui(r, t, 256);
        mpz_div_ui(t, t, 256);
        data[i] = (unsigned char)mpz_get_ui(r);
    }
    mpz_clear(r);
    mpz_clear(t);
}

game_error bignumber::read_binary_be(std::istream& in, int len) {
    if (!in.good())
        return BIG_READ_ERROR;
    game_error res = SUCCESS;
    auto tmp = new char[len];
    in.read(tmp, len);
    if (in.good())
        load_binary_be(tmp, len);
    else
        res = BIG_READ_ERROR;
    delete [] tmp;
    return res;
}

game_error bignumber::write_binary_be(std::ostream& out, int len) {
    if (!out.good())
        return BIG_WRITE_ERROR;
    game_error res = SUCCESS;
    auto tmp = new char[len];
    store_binary_be(tmp, len);
    out.write(tmp, len);
    if (!out.good())
        res = BIG_WRITE_ERROR;
    delete [] tmp;
    return res;
}


std::ostream& operator << (std::ostream &out, const bignumber& v) {
    auto tmp = v.to_string();
    out << tmp;
    return out;
}


}

