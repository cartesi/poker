#include "solver.h"

#include <stdio.h>
#include <stdlib.h>
#include <cstring>
#include <cstdint>
#include <vector>

using namespace poker;
using namespace poker::cards;

int32_t failures = 0;
int32_t testCount = 0;

bool assert_compare_n(
    int32_t n,
    const char* name,
    int32_t expected,
    std::vector<int32_t> h1,
    std::vector<int32_t> h2)
{
  testCount++;
  solver sol; 
  auto actual = sol.compare_hands(h1.data(), h2.data(), n);

  if (actual == expected) return true;
  
  printf("assertion failed - %s - expected %d, actual %d\n", name, expected, actual);
  failures++;
  return false;
}

bool assert_hand_name(
    int32_t n,
    const char* name,
    const char* expected,
    std::vector<int32_t> h)
{
  testCount++;
  solver sol;
  const char * actual;

  if(!(actual = sol.get_hand_name(h.data(), n))) {
    printf("assertion failed - %s - couldn't evaluate hand\n", name);
    failures++;
    return false; 
  } else if(strcmp(actual, expected) != 0) {
    printf("assertion failed - %s - expected %s, actual %s\n", name, expected, actual);
    failures++;
    return false;
  }
  return true;
}

int32_t main(int32_t argc, char **argv) {
  solver sol;
  failures = 0;
  testCount = 0;
  
  assert_compare_n(5, "5_NOPAIR_with_NOPAIR",   2, {c7, s6, c4, d3, h2}, {c8, s6, c4, d3, h2});
  assert_compare_n(5, "5_NOPAIR_with_PAIR",     2, {c7, s6, c4, d3, h2}, {d2, s6, c4, d3, h2});
  assert_compare_n(5, "5_PAIR_with_TWOPAIR",    1, {d2, h4, c4, d3, h2}, {d2, s6, c4, d3, h2});
  assert_compare_n(5, "5_TWOPAIR_with_TRIPS",   2, {d2, h4, c4, d3, h2}, {d2, c2, c4, d3, h2});
  assert_compare_n(5, "5_TRIPS_with_STRAIGHT",  1, {s6, d5, c4, d3, h2}, {d2, c2, c4, d3, h2});
  assert_compare_n(5, "5_STRAIGHT_with_FLUSH",  2, {s6, d5, c4, d3, h2}, {hT, h8, h6, h4, h2});
  assert_compare_n(5, "5_FLUSH_with_FULLHOUSE", 1, {hK, dK, cK, d2, h2}, {hT, h8, h6, h4, h2});
  assert_compare_n(5, "5_FULLHOUSE_with_QUADS", 2, {hK, dK, cK, d2, h2}, {hT, s2, c2, d2, h2});
  assert_compare_n(5, "5_QUADS_with_STFLUSH",   1, {h6, h5, h4, h3, h2}, {hT, s2, c2, d2, h2});
  
  assert_compare_n(7, "7_NOPAIR_with_NOPAIR",   2, {hJ, h9, c7, s6, c4, d3, h2}, {hA, dQ, c7, s6, c4, d3, h2});
  assert_compare_n(7, "7_NOPAIR_with_PAIR",     1, {d2, h9, c7, s6, c4, d3, h2}, {hA, dQ, c7, s6, c4, d3, h2});
  assert_compare_n(7, "7_PAIR_with_TWOPAIR",    2, {d2, h9, c7, s6, c4, d3, h2}, {s2, d6, c7, s6, c4, d3, h2});
  assert_compare_n(7, "7_TWOPAIR_with_TRIPS",   1, {d2, c2, c7, s6, c4, d3, h2}, {s2, d6, c7, s6, c4, d3, h2});
  assert_compare_n(7, "7_TRIPS_with_STRAIGHT",  2, {d2, c2, c7, s6, c4, d3, h2}, {c8, h5, c7, s6, c4, d3, h2});
  assert_compare_n(7, "7_STRAIGHT_with_FLUSH",  1, {cK, cJ, c7, s6, c4, c3, h2}, {c8, h5, c7, s6, c4, c3, h2});
  assert_compare_n(7, "7_FLUSH_with_FULLHOUSE", 2, {cK, cJ, c7, s6, c4, c3, d3}, {s7, d7, c7, s6, c4, c3, d3});
  assert_compare_n(7, "7_FULLHOUSE_with_QUADS", 1, {s3, h3, c7, s6, c4, c3, d3}, {s7, d7, c7, s6, c4, c3, d3});
  assert_compare_n(7, "7_QUADS_with_STFLUSH",   2, {s3, h3, d7, d6, d4, c3, d3}, {d8, d5, d7, d6, d4, c3, d3});
  
  assert_compare_n(4, "4_NOPAIR_with_NOPAIR",           2, {c7, s6, c4, d3}, {c3, s6, c4, d3});
  assert_compare_n(6, "6_NOPAIR_with_NOPAIR",           1, {s2, c7, s6, c4, d3, h2}, {c8, c7, s6, c4, d3, h2});
  assert_compare_n(8, "8_PAIR_with_NOPAIR",             1, {d2, hJ, h9, c7, s6, c4, d3, h2}, {sK, hA, dQ, c7, s6, c4, d3, h2});
  assert_compare_n(4, "5_PAIR_with_NOPAIR_wrong_size",  2, {d2, hJ, h9, c7, s2}, {sK, hA, dQ, c7, s6});
  assert_compare_n(7, "7_non_existing_card",           -1, {s3, h3, uk, s6, c4, c3, d3}, {s7, d7, c7, s6, c4, c3, d3});

  assert_hand_name(7, "hand_name_NOPAIR",     "NoPair",   {hA, dQ, c7, s6, c4, d3, h2});
  assert_hand_name(7, "hand_name_PAIR",       "OnePair",  {d2, h9, c7, s6, c4, d3, h2});
  assert_hand_name(7, "hand_name_TWOPAIR",    "TwoPair",  {s2, d6, c7, s6, c4, d3, h2});
  assert_hand_name(7, "hand_name_TRIPS",      "Trips",    {d2, c2, c7, s6, c4, d3, h2});
  assert_hand_name(7, "hand_name_STRAIGHT",   "Straight", {c8, h5, c7, s6, c4, d3, h2});
  assert_hand_name(7, "hand_name_FLUSH",      "Flush",    {cK, cJ, c7, s6, c4, c3, h2});
  assert_hand_name(7, "hand_name_FULLHOUSE",  "FlHouse",  {s7, d7, c7, s6, c4, c3, d3});
  assert_hand_name(7, "hand_name_QUADS",      "Quads",    {s3, h3, c7, s6, c4, c3, d3});
  assert_hand_name(7, "hand_name_STFLUSH",    "StFlush",  {d8, d5, d7, d6, d4, c3, d3});
  
  printf("Executed %d tests, with %d failures.\n.", testCount, std::abs(failures));

  return failures ? 1 : 0;
}
