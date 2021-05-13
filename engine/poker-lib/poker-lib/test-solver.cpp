#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "solver.h"
#include <string>
#include <cstdint>

/*
StdRules_HandType_NOPAIR    0
StdRules_HandType_ONEPAIR   1
StdRules_HandType_TWOPAIR   2
StdRules_HandType_TRIPS     3
StdRules_HandType_STRAIGHT  4
StdRules_HandType_FLUSH     5
StdRules_HandType_FULLHOUSE 6
StdRules_HandType_QUADS     7
StdRules_HandType_STFLUSH   8
*/

using namespace poker;

int32_t test_compare_5_cards_NOPAIR_with_NOPAIR() {
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {c7, s6, c4, d3, h2}; 
  int32_t hand2[] = {c8, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_NOPAIR_with_NOPAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_NOPAIR_with_PAIR() {
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {c7, s6, c4, d3, h2};
  int32_t hand2[] = {d2, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_NOPAIR_with_PAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_PAIR_with_TWOPAIR() {
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {d2, h4, c4, d3, h2};
  int32_t hand2[] = {d2, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_PAIR_with_TWOPAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_TWOPAIR_with_TRIPS() {
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {d2, h4, c4, d3, h2};
  int32_t hand2[] = {d2, c2, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_TWOPAIR_with_TRIPS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_TRIPS_with_STRAIGHT() {
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {s6, d5, c4, d3, h2};
  int32_t hand2[] = {d2, c2, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_TRIPS_with_STRAIGHT] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_STRAIGHT_with_FLUSH() {
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {s6, d5, c4, d3, h2};
  int32_t hand2[] = {hT, h8, h6, h4, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_STRAIGHT_with_FLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_FLUSH_with_FULLHOUSE() {
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {hK, dK, cK, d2, h2};
  int32_t hand2[] = {hT, h8, h6, h4, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_FLUSH_with_FULLHOUSE] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_FULLHOUSE_with_QUADS() {
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {hK, dK, cK, d2, h2};
  int32_t hand2[] = {hT, s2, c2, d2, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_FULLHOUSE_with_QUADS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_QUADS_with_STFLUSH() {
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {h6, h5, h4, h3, h2};
  int32_t hand2[] = {hT, s2, c2, d2, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_QUADS_with_STFLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_NOPAIR_with_NOPAIR(){
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {hJ, h9, c7, s6, c4, d3, h2};
  int32_t hand2[] = {hA, dQ, c7, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_NOPAIR_with_NOPAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_NOPAIR_with_PAIR(){
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {d2, h9, c7, s6, c4, d3, h2};
  int32_t hand2[] = {hA, dQ, c7, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_NOPAIR_with_PAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_PAIR_with_TWOPAIR(){
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {d2, h9, c7, s6, c4, d3, h2};
  int32_t hand2[] = {s2, d6, c7, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_PAIR_with_TWOPAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_TWOPAIR_with_TRIPS(){
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {d2, c2, c7, s6, c4, d3, h2};
  int32_t hand2[] = {s2, d6, c7, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_TWOPAIR_with_TRIPS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_TRIPS_with_STRAIGHT(){
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {d2, c2, c7, s6, c4, d3, h2};
  int32_t hand2[] = {c8, h5, c7, s6, c4, d3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_TRIPS_with_STRAIGHT] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_STRAIGHT_with_FLUSH(){
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {cK, cJ, c7, s6, c4, c3, h2};
  int32_t hand2[] = {c8, h5, c7, s6, c4, c3, h2};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_STRAIGHT_with_FLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_FLUSH_with_FULLHOUSE(){
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {cK, cJ, c7, s6, c4, c3, d3};
  int32_t hand2[] = {s7, d7, c7, s6, c4, c3, d3};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_FLUSH_with_FULLHOUSE] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_FULLHOUSE_with_QUADS(){
  solver sol;
  int32_t expected_result = 1;
  int32_t hand1[] = {s3, h3, c7, s6, c4, c3, d3};
  int32_t hand2[] = {s7, d7, c7, s6, c4, c3, d3};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_FULLHOUSE_with_QUADS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_QUADS_with_STFLUSH(){
  solver sol;
  int32_t expected_result = 2;
  int32_t hand1[] = {s3, h3, d7, d6, d4, c3, d3};
  int32_t hand2[] = {d8, d5, d7, d6, d4, c3, d3};

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_QUADS_with_STFLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_NOPAIR() {
  solver sol;
  int32_t hand[] = {hA, dQ, c7, s6, c4, d3, h2};
  const char *expected_result = "NoPair";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_NOPAIR] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_PAIR() {
  solver sol;
  int32_t hand[] = {d2, h9, c7, s6, c4, d3, h2};
  const char *expected_result = "OnePair";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_PAIR] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_TWOPAIR() {
  solver sol;
  int32_t hand[] = {s2, d6, c7, s6, c4, d3, h2};
  const char *expected_result = "TwoPair";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_TWOPAIR] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_TRIPS() {
  solver sol;
  int32_t hand[] = {d2, c2, c7, s6, c4, d3, h2};
  const char *expected_result = "Trips";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_TRIPS] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_STRAIGHT() {
  solver sol;
  int32_t hand[] = {c8, h5, c7, s6, c4, d3, h2};
  const char *expected_result = "Straight";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_STRAIGHT] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_FLUSH() {
  solver sol;
  int32_t hand[] = {cK, cJ, c7, s6, c4, c3, h2};
  const char *expected_result = "Flush";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_FLUSH] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_FULLHOUSE() {
  solver sol;
  int32_t hand[] = {s7, d7, c7, s6, c4, c3, d3};
  const char *expected_result = "FlHouse";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_FULLHOUSE] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_QUADS() {
  solver sol;
  int32_t hand[] = {s3, h3, c7, s6, c4, c3, d3};
  const char *expected_result = "Quads";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_QUADS] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_get_hand_name_with_STFLUSH() {
  solver sol;
  int32_t hand[] = {d8, d5, d7, d6, d4, c3, d3};
  const char *expected_result = "StFlush";
  
  const char *result = sol.get_hand_name(hand, 7);

  if(strcmp(result, expected_result) != 0) {
    printf("[test_get_hand_name_with_STFLUSH] Failed. Expected %s, found %s\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_hand_with_non_existing_card() {
  solver sol;
  int32_t hand1[] = {s3, h3, uk, s6, c4, c3, d3};
  int32_t hand2[] = {s7, d7, c7, s6, c4, c3, d3};
  int32_t expected_result = -1;

  int32_t result = sol.compare_hands(hand1, hand2, 7);

  if(result != expected_result) {
    printf("[test_hand_with_non_existing_card] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t failures = 0;
int32_t testCount = 0;

void run(int32_t (*func)()) {
  testCount++;
  failures += (*func)();
}

int32_t main(int32_t argc, char **argv) {
  solver sol;
  failures = 0;
  testCount = 0;

  run(test_compare_5_cards_NOPAIR_with_NOPAIR);
  run(test_compare_5_cards_NOPAIR_with_PAIR);
  run(test_compare_5_cards_PAIR_with_TWOPAIR);
  run(test_compare_5_cards_TWOPAIR_with_TRIPS);
  run(test_compare_5_cards_TRIPS_with_STRAIGHT);
  run(test_compare_5_cards_STRAIGHT_with_FLUSH);
  run(test_compare_5_cards_FLUSH_with_FULLHOUSE);
  run(test_compare_5_cards_FULLHOUSE_with_QUADS);
  run(test_compare_5_cards_QUADS_with_STFLUSH);

  run(test_compare_7_cards_NOPAIR_with_NOPAIR);
  run(test_compare_7_cards_NOPAIR_with_PAIR);
  run(test_compare_7_cards_PAIR_with_TWOPAIR);
  run(test_compare_7_cards_TWOPAIR_with_TRIPS);
  run(test_compare_7_cards_TRIPS_with_STRAIGHT);
  run(test_compare_7_cards_STRAIGHT_with_FLUSH);
  run(test_compare_7_cards_FLUSH_with_FULLHOUSE);
  run(test_compare_7_cards_FULLHOUSE_with_QUADS);
  run(test_compare_7_cards_QUADS_with_STFLUSH);

  run(test_get_hand_name_with_NOPAIR);
  run(test_get_hand_name_with_PAIR);
  run(test_get_hand_name_with_TWOPAIR);
  run(test_get_hand_name_with_TRIPS);
  run(test_get_hand_name_with_STRAIGHT);
  run(test_get_hand_name_with_FLUSH);
  run(test_get_hand_name_with_FULLHOUSE);
  run(test_get_hand_name_with_QUADS);
  run(test_get_hand_name_with_STFLUSH);
  
  run(test_hand_with_non_existing_card);

  printf("Executed %d tests, with %d failures.\n.", testCount, std::abs(failures));

  return failures ? 1 : 0;
}
