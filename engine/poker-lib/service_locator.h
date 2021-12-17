#ifndef SERVICE_LOCATOR_H
#define SERVICE_LOCATOR_H

#include "participant.h"
#include "poker-lib.h"
#include "unencrypted_participant.h"

namespace poker {

class service_locator {
    poker_lib_options _opts;
    service_locator() {}

   public:
    service_locator(service_locator const&) = delete;
    void operator=(service_locator const&) = delete;

    static service_locator& instance() {
        static service_locator instance;
        return instance;
    }

    static void load(poker_lib_options* opts) {
        instance()._opts = *opts;
    }

    i_participant* new_participant() {
        if (_opts.encryption) {
            return new participant();
        } else {
            return new unencrypted_participant(_opts.winner);
        }
    }
};

}  //namespace poker

#endif