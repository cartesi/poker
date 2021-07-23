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

void bignumber::load_binary_be(unsigned char* data, int len) {
    mpz_set_ui(n, 0);
    for(int i=0; i<len; i++) {
        mpz_mul_ui(n, n, 256);
        mpz_add_ui(n, n, data[i]);
    }
}

void bignumber::store_binary_be(unsigned char* data, int len) {
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

std::ostream& operator << (std::ostream &out, const bignumber& v) {
    auto tmp = v.to_string();
    out << tmp;
    return out;
}


}

