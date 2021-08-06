#ifndef SERVICE_LOCATOR_H
#define SERVICE_LOCATOR_H

#include "mock_participant.h"
#include "participant.h"
#include "tmcg_participant.h"

namespace poker {

class service_locator {
    bool encryption = true;

    service_locator() {}

   public:
    service_locator(service_locator const&) = delete;
    void operator=(service_locator const&) = delete;

    static service_locator& get_instance() {
        static service_locator instance;
        return instance;
    }

    participant* new_participant(int id, int num_participants, bool predictable);
    friend int init_poker_lib(bool encryption);
};

}  //namespace poker

#endif