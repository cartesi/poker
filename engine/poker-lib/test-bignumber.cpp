#include <iostream>
#include <sstream>
#include <memory.h>
#include <inttypes.h>
#include "common.h"
#include "test-util.h"
#include "bignumber.h"


#define TEST_SUITE_NAME "Test bignumber"

using namespace poker;

void the_happy_path() {
    std::cout <<  "---- " TEST_SUITE_NAME << " - the_happy_path" << std::endl;
    bignumber x = 1;
    bignumber y = 2;
    assert_eql((int)1, (int)x);
    x = x + y;
    assert_eql((int)3, (int)x);
    x += y;
    assert_eql((int)5, (int)x);
    x *= y;
    assert_eql((int)10, (int)x);

    assert_eql("10", x.to_string());
    assert_eql("a", x.to_string(16));

    x -= y;
    assert_eql((int)8, (int)x);
    x -= y;
    assert_eql((int)6, (int)x);
    x /= y;
    assert_eql((int)3, (int)x);
    x *= y;
    assert_eql((int)6, (int)x);

    unsigned char data[32] =   {0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 };
    x.load_binary_be(data, sizeof(data));
    assert_eql("8000000000000000000000000000000000000000000000000000000000000001", x.to_string(16));

    unsigned char data2[32];
    memset(data2, 0xff, 32);
    x.store_binary_be(data2, sizeof(data2));
    assert_eql(0, memcmp(data, data2, 32));

    bignumber z;
    assert_eql(SUCCESS, z.parse_string("8000000000000000000000000000000000000000000000000000000000000001", 16));
    assert_eql("8000000000000000000000000000000000000000000000000000000000000001", z.to_string(16));

}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout <<  "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
