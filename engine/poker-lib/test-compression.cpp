#include <iostream>
#include <vector>
#include <sstream>
#include <inttypes.h>
#include "poker-lib.h"
#include "compression.h"
#include "common.h"
#include "test-util.h"

#define TEST_SUITE_NAME "Test compress"

using namespace poker;

void test_the_naive_happy_path() {
    std::vector<std::string> test_cases{
        "1",
        "",
        "1234",
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        std::string(77000, '!')
    };
    for(auto&& foo: test_cases) {
        std::cout << "compressing " << foo.size()  << " bytes\n";
        std::string bar, baz;
        assert_eql(SUCCESS, compress(foo, bar));
        std::cout << "compressed " << foo.size() << " -> " << bar.size() << std::endl;
        assert_eql(SUCCESS, decompress(bar, baz));
        assert_eql(foo, baz);

        assert_eql(SUCCESS, compress_and_wrap(foo, bar));
        assert_eql(0, bar.size() % wrap_padding_size);        
        assert_eql(SUCCESS, unwrap_and_decompress(bar, baz));
        assert_eql(foo, baz);
    }

    // loading messages from stream
    std::ostringstream os;
    std::string m1, m2;
    std::string s1 = std::string(30, '1');
    std::string s2 = std::string(30, '2');
    assert_eql(SUCCESS, compress_and_wrap(s1, m1));
    assert_eql(SUCCESS, compress_and_wrap(s2, m2));
    os << m1 << m2;

    assert_eql(0, os.str().size() % wrap_padding_size);

    std::istringstream is(os.str());    
    std::string mm1, mm2, mm3;
    assert_eql(SUCCESS, unwrap_and_decompress_next(is, mm1));
    assert_eql(s1, mm1);
    assert_eql(SUCCESS, unwrap_and_decompress_next(is, mm2));
    assert_eql(s2, mm2);
    assert_eql(END_OF_STREAM, unwrap_and_decompress_next(is, mm3));
        
    std::cout <<  "---- " TEST_SUITE_NAME << " - the_happy_path" << std::endl;
}

int main(int argc, char** argv) {
    init_poker_lib();
    test_the_naive_happy_path();
    std::cout <<  "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
