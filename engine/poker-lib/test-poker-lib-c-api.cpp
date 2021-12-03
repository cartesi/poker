#include <iostream>
#include <sstream>
#include <map>
#include <cstring>
#include "test-util.h"
#include "common.h"
#include "poker-lib-c-api.h"

#define FLOP(n) (n)
#define TURN    FLOP(2)+1
#define RIVER   FLOP(2)+2

void test_the_happy_path() {
    assert_eql(PAPI_SUCCESS, papi_init(true, true, -1));
    PAPI_PLAYER alice, bob;
    assert_eql(PAPI_SUCCESS, papi_new_player(0, &alice));
    assert_eql(PAPI_SUCCESS, papi_new_player(1, &bob));
    assert_eql(PAPI_SUCCESS, papi_init_player(alice, (PAPI_MONEY)"100", (PAPI_MONEY)"300", (PAPI_MONEY)"10"));
    assert_eql(PAPI_SUCCESS, papi_init_player(bob, (PAPI_MONEY)"100", (PAPI_MONEY)"300", (PAPI_MONEY)"10"));

    std::map<int, PAPI_MESSAGE> msg; // messages exchanged during game
    PAPI_INT len;

    assert_eql(PAPI_SUCCESS, papi_create_handshake(alice, &msg[0], &len));
    assert_eql(PAPI_CONTINUED, papi_process_handshake(bob, msg[0], len, &msg[1], &len));
    assert_eql(PAPI_CONTINUED, papi_process_handshake(alice, msg[1], len,  &msg[2], &len));
    assert_eql(PAPI_CONTINUED, papi_process_handshake(bob, msg[2], len, &msg[3], &len));
    assert_eql(PAPI_SUCCESS, papi_process_handshake(alice, msg[3], len, &msg[4], &len));
    assert_eql(PAPI_SUCCESS, papi_process_handshake(bob, msg[4], len, &msg[5], &len));
    assert_eql(true, len==0);

    // Preflop: Alice calls
    assert_eql(PAPI_SUCCESS, papi_create_bet(alice, poker::BET_CALL, (PAPI_MONEY)"0", &msg[5], &len));

    PAPI_INT type;
    char amt[10];
    assert_eql(PAPI_SUCCESS, papi_process_bet(bob, msg[5], len, &msg[6], &len, &type, amt, sizeof(amt)));
    assert_eql(true, (int)type == (int)poker::BET_CALL);
    assert_eql(0, strcmp(amt, "0"));

    for(auto m: msg)
      if (m.second)
        assert_eql(PAPI_SUCCESS, papi_delete_message(m.second));

    assert_eql(PAPI_SUCCESS, papi_delete_player(alice));
    assert_eql(PAPI_SUCCESS, papi_delete_player(bob));
}

int main(int argc, char** argv) {
    test_the_happy_path();
    std::cout << "---- SUCCESS" << std::endl;
    return 0;
}
