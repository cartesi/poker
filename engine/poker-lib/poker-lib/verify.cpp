#include <iostream>
#include <fstream>
#include "verifier.h"

int usage() {
    std::cerr << "syntax: verify <data-file>" << std::endl;
    return 1;
}

/*
* Game verification command line program
*/
int main(int argc, char**argv) {
    if (argc !=2)
        return usage();
    
    std::ifstream is;
    is.open (argv[1], std::ifstream::in);
    poker::verifier v;
    auto res = v.verify(is);
    is.close();
    return (int)res;
}