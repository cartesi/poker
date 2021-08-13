#ifndef SERVICE_LOCATOR_H
#define SERVICE_LOCATOR_H

#include "participant.h"
#include "unencrypted_participant.h"

namespace poker {

class service_locator {
    typedef i_participant* (*factory)();

    service_locator() {}

   public:
    factory make_participant;

    service_locator(service_locator const&) = delete;
    void operator=(service_locator const&) = delete;

    static service_locator& instance() {
        static service_locator instance;
        return instance;
    }

    i_participant* new_participant() { return make_participant(); }
};

}  //namespace poker

#endif