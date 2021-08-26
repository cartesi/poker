#include <iostream>
#include <fstream>
#include "common.h"
#include "poker-lib.h"
#include "verifier.h"

void open_write(std::ofstream &f, char* path);
void open_read(std::ifstream &f, char* path);

using namespace poker;

int usage(int argc, char**argv) {
    std::cerr << "Usage: " << argv[0]
        << "<player-info-path>  <turn-metadata-path> <verification-info-path>  <turn-data-path> <output-path>"
        << std::endl;
    return 1;
}

/*
* poker verifier
*/
int main(int argc, char**argv) {
    if (argc !=6)
        return usage(argc, argv);
    
    logger << "verifier is starting \n";
        
    logger << "initializing library... \n";
    poker_lib_options opts;
    opts.logging = true;
    init_poker_lib(&opts);

    logger << "opening files... \n";
    std::ifstream player_info,  turn_metadata,  verification_info,  turn_data;
    std::ofstream output;

    logger << "library initialized \n";
    open_read(player_info, argv[1]);
    open_read(turn_metadata, argv[2]);
    open_read(verification_info, argv[3]);
    open_read(turn_data, argv[4]);
    open_write(output, argv[5]);

    
    logger << "verifying... \n";
    verifier ver(player_info, turn_metadata, verification_info, turn_data, output);
    auto res = ver.verify();
    std::cout << std::endl << ver.game().to_json() << std::endl;
    for(auto&& r: ver.result())
        std::cout << r.to_string() << " ";

    std::cout << std::endl;
    return 0;
}

void open_read(std::ifstream &f, char* path) {
    f.open (path, std::ifstream::in);
    if (!f.good()) {
        std::cerr << "failed to open " << path << std::endl;
        exit(-1);
    }
}

void open_write(std::ofstream &f, char* path) {
    f.open (path, std::ifstream::out);
    if (!   f.good()) {
        std::cerr << "failed to open " << path << std::endl;
        exit(-1);
    }
}

