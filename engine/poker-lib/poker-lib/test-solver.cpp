#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "solver.h"
#include <string>

int  main(int argc, char **argv) {
  poker::solver sol;
  int ctype = sol.card_type_from_str("As");
  printf("card_type_from_str(As) =. %d\n", ctype);

  std::string cstr = sol.card_str_from_type(ctype);
  printf("card_str_from_type(%d) =. %s\n", ctype, cstr.c_str());

  int h1[] = {0, 1, 2, 3, 4, 5};
  int h2[] = {10, 11, 12, 13, 14, 15};
  sol.compare_hands(h1, h2, 5);

  return 0;
}
