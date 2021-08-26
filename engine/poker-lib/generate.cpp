#include <iostream>
#include <fstream>
#include "poker-lib.h"
#include "game-generator.h"

using namespace poker;

void save(const char* dir, const char* name, std::string& data) {
    std::string path = std::string(dir) + std::string("/") + std::string(name);
    std::cout << "Saving " << path << std::endl;
    FILE* fp = fopen(path.c_str(), "wb");
    if (!fp) {
        std::cerr << "Error creating " << path << std::endl;
        exit(-1);
    }
    auto len = data.size();
    if (1 != fwrite(data.data(), len, 1, fp)) {
        std::cerr << "Error writing to " << path << std::endl;
        exit(-1);
    }
    int padding = 4*1024;
    for(; len % padding != 0; len++) {
        char t=0;
        fwrite(&t, 1, 1, fp);
    }
    
    fclose(fp);
}


/*
   Generates game files for verification
   Example: 
   # run this from inside the x64 shell
    cd engine/platforms/x64
    make shell
    cd poker-lib
    poker-lib-src/generate 200 100 10 /poker/xfer
    poker-lib-src/verify /poker/xfer/player-info.raw  /poker/xfer/turn-metadata.raw  /poker/xfer/verification-info.raw /poker/xfer/turn-data.raw /poker/xfer/result.raw
*/
int main(int argc, char**argv) {
    game_error res;
    if (argc != 5) {
        fprintf(stderr, "Usage: %s <alice_money> <bob_money> <big_blind> <dest_directory>\n", argv[0]);
        exit(-1);
    }
    init_poker_lib();
    game_generator gen;
    gen.alice_money.parse_string(argv[1], 10);
    gen.bob_money.parse_string(argv[2], 10);
    gen.big_blind.parse_string(argv[3], 10);
    char * dir =  argv[4];
    if ((res=gen.generate())) {
        std::cerr << "Error " << (int)res << " generating game" << std::endl;
        exit(-1);
    }

    save(dir, "player-info.raw", gen.raw_player_info);
    save(dir, "turn-metadata.raw", gen.raw_turn_metadata);
    save(dir, "verification-info.raw", gen.raw_verification_info);
    save(dir, "turn-data.raw", gen.raw_turn_data);
    auto output = std::string("placeholder");
    save(dir, "output.raw", output);
    
    std::cout 
        << "Game files saved on " << dir << std::endl
        << "Game state: " << gen.game.to_json() << std::endl
        << "Alice address: " << gen.alice_addr.to_string(16) << std::endl
        << "Bob address: " << gen.bob_addr.to_string(16) << std::endl
        << "Challenger address: " << gen.challenger_addr.to_string(16) << std::endl
        << "Claimer address: " << gen.claimer_addr.to_string(16) << std::endl
        ;

    return 0;
}

