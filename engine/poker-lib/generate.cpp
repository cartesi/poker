#include <fstream>
#include <iostream>

#include "game-generator.h"
#include "poker-lib.h"

using namespace poker;

void save_turns(const char* dir, std::vector<std::tuple<int, std::string>>& turns) {
    for (int i = 0; i < turns.size(); i++) {
        auto player = std::get<0>(turns[i]);
        auto data = std::get<1>(turns[i]);
        char path[1024];
        snprintf(path, sizeof(path), "%s/turn-%02d-%01d.raw", dir, i, player);
        FILE* fp = fopen(path, "wb");
        if (!fp) {
            std::cerr << "Error creating " << path << std::endl;
            exit(-1);
        }
        if (1 != fwrite(data.data(), data.size(), 1, fp)) {
            std::cerr << "Error writing to " << path << std::endl;
            exit(-1);
        }
        fclose(fp);
    }
}

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
    int padding = 4 * 1024;
    for (; len % padding != 0; len++) {
        char t = 0;
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
    poker-lib-src/generate 200 100 10 -1 -1 /poker/xfer
    poker-lib-src/verify /poker/xfer/player-info.raw  /poker/xfer/turn-metadata.raw  /poker/xfer/verification-info.raw /poker/xfer/turn-data.raw /poker/xfer/result.raw
*/
int main(int argc, char** argv) {
    game_error res;
    if (argc != 7) {
        fprintf(stderr, "Usage: %s <alice_money> <bob_money> <big_blind> <last_aggressor> <winner> <dest_directory>\n", argv[0]);
        exit(-1);
    }
    game_generator gen;
    poker_lib_options opt;

    gen.alice_money.parse_string(argv[1], 10);
    gen.bob_money.parse_string(argv[2], 10);
    gen.big_blind.parse_string(argv[3], 10);
    gen.last_aggressor = std::stoi(std::string(argv[4]));
    opt.winner = std::stoi(std::string(argv[5]));
    
    opt.encryption = opt.winner != -1 ? false : true;
    init_poker_lib(&opt);

    char* dir = argv[6];
    if ((res = gen.generate())) {
        std::cerr << "Error " << (int)res << " generating game" << std::endl;
        exit(-1);
    }

    save(dir, "player-info.raw", gen.raw_player_info);
    save(dir, "turn-metadata.raw", gen.raw_turn_metadata);
    save(dir, "verification-info.raw", gen.raw_verification_info);
    save(dir, "turn-data.raw", gen.raw_turn_data);
    auto output = std::string("placeholder");
    save(dir, "output.raw", output);
    save_turns(dir, gen.turns);

    std::cout
        << "Game files saved on " << dir << std::endl
        << "-------------------" << std::endl
        << "Game state (ALICE): " << gen.alice_game.to_json() << std::endl
        << "-------------------" << std::endl
        << "Game state (BOB)  : " << gen.bob_game.to_json() << std::endl
        << "-------------------" << std::endl
        << "Alice address: " << gen.alice_addr.to_string(16) << std::endl
        << "Bob address: " << gen.bob_addr.to_string(16) << std::endl
        << "Challenger address: " << gen.challenger_addr.to_string(16) << std::endl
        << "Claimer address: " << gen.claimer_addr.to_string(16) << std::endl;

    return 0;
}
