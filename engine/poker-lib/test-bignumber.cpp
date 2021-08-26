#include <iostream>
#include <sstream>
#include <memory.h>
#include <inttypes.h>
#include "poker-lib.h"
#include "common.h"
#include "test-util.h"
#include "bignumber.h"


#define TEST_SUITE_NAME "Test bignumber"

using namespace poker;

void the_happy_path() {
    std::cout <<  "---- " TEST_SUITE_NAME << " - the_happy_path" << std::endl;

    bignumber two = 2;
    std::ostringstream ss2;
    assert_eql(SUCCESS, two.write_binary_be(ss2, 4));
    assert_eql(std::string("\x00\x00\x00\x02",4), ss2.str());
    std::istringstream ss22(ss2.str());
    bignumber two2;
    assert_eql(SUCCESS, two2.read_binary_be(ss22, ss2.str().size()));
    assert_eql(two, two2);

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

    char data[32] =   {(char)0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 };
    x.load_binary_be(data, sizeof(data));
    char data2[32];
    memset(data2, 0xff, 32);



    x.store_binary_be(data2, sizeof(data2));
    assert_eql(0, memcmp(data, data2, 32));

    bignumber z;
    assert_eql(SUCCESS, z.parse_string("8000000000000000000000000000000000000000000000000000000000000001", 16));
    assert_eql("8000000000000000000000000000000000000000000000000000000000000001", z.to_string(16));

    std::istringstream is("\x01\x02\x03");
    assert_eql(SUCCESS, z.read_binary_be(is, 3));
    assert_eql(0x010203, (int)z);

    std::stringstream ss;
    assert_eql(SUCCESS, z.write_binary_be(ss, 3));
    assert_eql(true, std::string("\x01\x02\x03") == ss.str());
}

int main(int argc, char** argv) {
    init_poker_lib();
    the_happy_path();
    std::cout <<  "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
