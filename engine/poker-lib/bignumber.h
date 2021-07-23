#ifndef BIGNUMBER_H
#define BIGNUMBER_H

#include <ostream>
#include <gmp.h>
#include <string>
#include "common.h"

namespace poker {

//#define money_t bignumber
//typedef  int32_t money_t;
    
class bignumber {
    mpz_t n;
public:
    bignumber() { mpz_init(n); mpz_set_ui(n, 0); }
    bignumber(const bignumber& other) { mpz_init(n); mpz_set(n, other.n); }
    bignumber(int v)  { mpz_init(n); mpz_set_ui(n, v); }
    virtual ~bignumber() { mpz_clear(n); }
    
    int compare(const bignumber& other) const { return mpz_cmp(n, other.n); }

    bool operator == (const bignumber& other) const { return 0 == compare(other); }
    bool operator == (int other) const { return (int)*this == other; }
    bool operator != (const bignumber& other) const{ return 0 != compare(other); }
    bool operator > (const bignumber& other) const{ return 1 == compare(other); }
    bool operator >= (const bignumber& other) const{ return 0 <= compare(other); }
    bool operator < (const bignumber& other) const{ return -1 == compare(other); }
    bool operator <= (const bignumber& other) const{ return 0 >= compare(other); }
    operator unsigned long () const {  return mpz_get_ui(n); }
    operator unsigned int () const {  return (unsigned int)mpz_get_ui(n); }
    operator int () const {  return (int)mpz_get_ui(n); }

    bignumber& operator = (const bignumber& other) {
        mpz_set(n, other.n);
        return *this;
    }

    bignumber& operator += (const bignumber& other) {
        mpz_add(n, n, other.n); return *this;
        return *this;
    }

    bignumber& operator -= (const bignumber& other) {
        mpz_sub(n, n, other.n); return *this;
        return *this;
    }

    bignumber& operator *= (const bignumber& other) {
        mpz_mul(n, n, other.n); return *this;
        return *this;
    }

    bignumber& operator /= (const bignumber& other) { 
        mpz_div(n, n, other.n); return *this;
        return *this;
    }

    bignumber operator + (const bignumber& other) { 
        bignumber t = *this;
        mpz_add(t.n, t.n, other.n);
        return t;
    }
    
    bignumber operator - (const bignumber& other) { 
        bignumber t = *this;
        mpz_sub(t.n, t.n, other.n);
        return t;
    }

    bignumber operator * (const bignumber& other) { 
        bignumber t = *this;
        mpz_mul(t.n, t.n, other.n);
        return t;
    }

    bignumber operator / (const bignumber& other) { 
        bignumber t = *this;
        mpz_div(t.n, t.n, other.n);
        return t;
    }
    
    std::string to_string(int base=10) const;
    game_error parse_string(const char* s, int base=10);
    
    void load_binary_be(unsigned char* data, int len);
    void store_binary_be(unsigned char* data, int len);
    
};

typedef bignumber money_t;

std::ostream& operator << (std::ostream &out, const bignumber& v);

}

#endif