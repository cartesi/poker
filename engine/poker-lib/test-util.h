#ifndef TEST_UTIL_H
#define TEST_UTIL_H

#define assert_eql(expected, actual) { \
    std::cerr <<  "..." #actual << " == " << #expected << std::endl; \
    auto a = (actual); \
    if (!(a == (expected))) { \
        std::cerr << "Assertion failed. Expected '" #actual "' to be " << #expected << ", got: " << a << std::endl; \
        exit(65); \
    }}

#define assert_neq(expected, actual) { \
    std::cerr <<  "..." #actual << " != " << #expected << std::endl; \
    auto a = (actual); \
    if (a == (expected)) { \
        std::cerr << "Assertion failed. Expected != '" #actual "' to not be " << #expected << ", got: " << a << std::endl; \
        exit(65); \
    }}

#endif
