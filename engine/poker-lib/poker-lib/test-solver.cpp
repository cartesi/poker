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

int32_t test_compare_5_cards_HIGHCARD_with_HIGHCARD() {
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {31, 43, 28, 14, 0}; //7c 6s 4c 3d 2h
  int32_t h2[] = {32, 43, 28, 14, 0}; //8c 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_HIGHCARD_with_HIGHCARD] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_HIGHCARD_with_PAIR() {
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {31, 43, 28, 14, 0}; //7c 6s 4c 3d 2h
  int32_t h2[] = {13, 43, 28, 14, 0}; //2d 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_HIGHCARD_with_PAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_PAIR_with_TWOPAIR() {
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {13, 2, 28, 14, 0}; //2d 4h 4c 3d 2h
  int32_t h2[] = {13, 43, 28, 14, 0}; //2d 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_PAIR_with_TWOPAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_TWOPAIR_with_TRIPS() {
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {13, 2, 28, 14, 0}; //2d 4h 4c 3d 2h
  int32_t h2[] = {13, 26, 28, 14, 0}; //2d 2c 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_TWOPAIR_with_TRIPS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_TRIPS_with_STRAIGHT() {
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {43, 16, 28, 14, 0}; //6s 5d 4c 3d 2h
  int32_t h2[] = {13, 26, 28, 14, 0}; //2d 2c 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_TRIPS_with_STRAIGHT] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_STRAIGHT_with_FLUSH() {
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {43, 16, 28, 14, 0}; //6s 5d 4c 3d 2h
  int32_t h2[] = {8, 6, 4, 2, 0}; //Th 8h 6h 4h 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_STRAIGHT_with_FLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_FLUSH_with_FULLHOUSE() {
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {11, 24, 37, 13, 0}; //Kh Kd Kc 2d 2h
  int32_t h2[] = {8, 6, 4, 2, 0}; //Th 8h 6h 4h 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_FLUSH_with_FULLHOUSE] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_FULLHOUSE_with_QUADS() {
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {11, 24, 37, 13, 0}; //Kh Kd Kc 2d 2h
  int32_t h2[] = {8, 39, 26, 13, 0}; //Th 2s 2c 2d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_FULLHOUSE_with_QUADS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_5_cards_QUADS_with_STFLUSH() {
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {4, 3, 2, 1, 0}; //6h 5h 4h 3h 2h
  int32_t h2[] = {8, 39, 26, 13, 0}; //Th 2s 2c 2d 2h

  int32_t result = sol.compare_hands(h1, h2, 5);

  if(result != expected_result) {
    printf("[test_compare_5_cards_QUADS_with_STFLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_HIGHCARD_with_HIGHCARD(){
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {9, 7, 31, 43, 28, 14, 0}; //Jh 9h 7c 6s 4c 3d 2h
  int32_t h2[] = {12, 23, 31, 43, 28, 14, 0}; //Ah Qd 7c 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_HIGHCARD_with_HIGHCARD] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_HIGHCARD_with_PAIR(){
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {13, 7, 31, 43, 28, 14, 0}; //2d 9h 7c 6s 4c 3d 2h
  int32_t h2[] = {12, 23, 31, 43, 28, 14, 0}; //Ah Qd 7c 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_HIGHCARD_with_PAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_PAIR_with_TWOPAIR(){
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {13, 7, 31, 43, 28, 14, 0}; //2d 9h 7c 6s 4c 3d 2h
  int32_t h2[] = {39, 17, 31, 43, 28, 14, 0}; //2s 6d 7c 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_PAIR_with_TWOPAIR] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_TWOPAIR_with_TRIPS(){
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {13, 26, 31, 43, 28, 14, 0}; //2d 2c 7c 6s 4c 3d 2h
  int32_t h2[] = {39, 17, 31, 43, 28, 14, 0}; //2s 6d 7c 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_TWOPAIR_with_TRIPS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_TRIPS_with_STRAIGHT(){
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {13, 26, 31, 43, 28, 14, 0}; //2d 2c 7c 6s 4c 3d 2h
  int32_t h2[] = {32, 3, 31, 43, 28, 14, 0}; //8c 5h 7c 6s 4c 3d 2h

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_TRIPS_with_STRAIGHT] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_STRAIGHT_with_FLUSH(){
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {37, 35, 31, 43, 28, 27, 0}; //Kc Jc 7c 6s 4c 3c 2h
  int32_t h2[] = {32, 3, 31, 43, 28, 27, 0}; //8c 5h 7c 6s 4c 3c 2h

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_STRAIGHT_with_FLUSH] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_FLUSH_with_FULLHOUSE(){
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {37, 35, 31, 43, 28, 27, 14}; //Kc Jc 7c 6s 4c 3c 3d
  int32_t h2[] = {44, 18, 31, 43, 28, 27, 14}; //7s 7d 7c 6s 4c 3c 3d

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_FLUSH_with_FULLHOUSE] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_FULLHOUSE_with_QUADS(){
  poker::solver sol;
  int32_t expected_result = 1;
  int32_t h1[] = {40, 1, 31, 43, 28, 27, 14}; //3s 3h 7c 6s 4c 3c 3d
  int32_t h2[] = {44, 18, 31, 43, 28, 27, 14}; //7s 7d 7c 6s 4c 3c 3d

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_FULLHOUSE_with_QUADS] Failed. Expected %d, found %d\n", expected_result, result);
    return -1;
  }
  return 0;
}

int32_t test_compare_7_cards_QUADS_with_STFLUSH(){
  poker::solver sol;
  int32_t expected_result = 2;
  int32_t h1[] = {40, 1, 18, 17, 15, 27, 14}; //3s 3h 7d 6d 4d 3c 3d
  int32_t h2[] = {19, 16, 18, 17, 15, 27, 14}; //8d 5d 7d 6d 4d 3c 3d

  int32_t result = sol.compare_hands(h1, h2, 7);

  if(result != expected_result) {
    printf("[test_compare_7_cards_QUADS_with_STFLUSH] Failed. Expected %d, found %d\n", expected_result, result);
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
  poker::solver sol;
  failures = 0;
  testCount = 0;

  run(test_compare_5_cards_HIGHCARD_with_HIGHCARD);
  run(test_compare_5_cards_HIGHCARD_with_PAIR);
  run(test_compare_5_cards_PAIR_with_TWOPAIR);
  run(test_compare_5_cards_TWOPAIR_with_TRIPS);
  run(test_compare_5_cards_TRIPS_with_STRAIGHT);
  run(test_compare_5_cards_STRAIGHT_with_FLUSH);
  run(test_compare_5_cards_FLUSH_with_FULLHOUSE);
  run(test_compare_5_cards_FULLHOUSE_with_QUADS);
  run(test_compare_5_cards_QUADS_with_STFLUSH);

  run(test_compare_7_cards_HIGHCARD_with_HIGHCARD);
  run(test_compare_7_cards_HIGHCARD_with_PAIR);
  run(test_compare_7_cards_PAIR_with_TWOPAIR);
  run(test_compare_7_cards_TWOPAIR_with_TRIPS);
  run(test_compare_7_cards_TRIPS_with_STRAIGHT);
  run(test_compare_7_cards_STRAIGHT_with_FLUSH);
  run(test_compare_7_cards_FLUSH_with_FULLHOUSE);
  run(test_compare_7_cards_FULLHOUSE_with_QUADS);
  run(test_compare_7_cards_QUADS_with_STFLUSH);

  printf("Executed %d tests, with %d failures.\n.", testCount, std::abs(failures));

  return failures ? 1 : 0;
}
