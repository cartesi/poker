#include "codec.h"
#include <iostream>
#include <sstream>
#include <inttypes.h>
#include "common.h"
#include "test-util.h"

#define TEST_SUITE_NAME "Test transport"

using namespace poker;

void the_happy_path() {
    std::cout << "---- " TEST_SUITE_NAME << " - the_happy_path" << std::endl;
    std::stringstream ss;
    const int padding = 10;
    poker::encoder e(ss);    
    assert_eql(SUCCESS, e.write(123));
    assert_eql(SUCCESS, e.write("foo"));
    assert_eql(SUCCESS, e.write(4567));
    assert_eql(SUCCESS, e.write("bar"));
    assert_eql(SUCCESS, e.pad(padding));
    assert_eql(SUCCESS, e.write("baz"));
    assert_eql(SUCCESS, e.pad(padding));
    assert_eql("#123|$3|foo#4567|$3|bar-------$3|baz----", ss.str());
    
    std::istringstream is(ss.str());
    poker::decoder d(is);
    int i;
    std::string s;
    poker::blob b;
    assert_eql(false, d.eof());
    assert_eql(SUCCESS, d.read(i));
    assert_eql(123, i);
    assert_eql(SUCCESS, d.read(s));
    assert_eql("foo", s);
    assert_eql(SUCCESS, d.read(i));
    assert_eql(4567, i);
    assert_eql(SUCCESS, d.read(s));
    assert_eql("bar", s);
    assert_eql(SUCCESS, d.read(b));
    assert_eql("baz", b);
    assert_eql(COD_ERROR, d.read(b));
    assert_eql(true, d.eof());
}

int main(int argc, char** argv) {
    the_happy_path();
    std::cout << "---- SUCCESS - " TEST_SUITE_NAME << std::endl;
    return 0;
}
