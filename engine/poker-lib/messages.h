#ifndef MESSAGES_H
#define MESSAGES_H

#include "common.h"
#include "codec.h"

namespace poker {

   /*
    *  Messages transfered during live game and result verification
   */
   class message {
   public:
       message_type msgtype;

       message(message_type t);
       virtual ~message() { }
       virtual game_error write(std::ostream& os) = 0;
       virtual game_error read(std::istream& is) = 0;
       virtual std::string to_string() = 0;
       static game_error decode(std::istream& is, message** msg);
   };

   class msg_vtmf : public message {
   public:
       money_t alice_money;
       money_t bob_money;
       money_t big_blind;
       blob vtmf;
       blob alice_key;
    
       msg_vtmf();
       virtual ~msg_vtmf() {}
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

   class msg_vtmf_response : public message {
   public:
       money_t alice_money;
       money_t bob_money;
       money_t big_blind;
       blob bob_key;

       msg_vtmf_response();
       virtual ~msg_vtmf_response() { }
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

   class msg_vsshe : public message{
   public:
       blob vsshe;
       blob stack;
       blob stack_proof;

       msg_vsshe();
       virtual ~msg_vsshe() { }
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

   class msg_vsshe_response : public message {
   public:
       blob stack;
       blob stack_proof;
       blob cards_proof;
    
       msg_vsshe_response();
       virtual ~msg_vsshe_response() { }
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

   class msg_bob_private_cards : public message {
   public:
       blob cards_proof;

       msg_bob_private_cards();
       virtual ~msg_bob_private_cards() { }
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

   class msg_bet_request : public message {
   public:
       int player_id;
       bet_type type;
       money_t amt;
       blob cards_proof;

       msg_bet_request();
       virtual ~msg_bet_request() { }
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

   class msg_card_proof : public message {
   public:
       int player_id;
       bet_type type;
       money_t amt;
       blob cards_proof;
       bool muck;

       msg_card_proof();
       virtual ~msg_card_proof() { }
       game_error write(std::ostream& os) override;
       game_error read(std::istream& is) override;
       std::string to_string() override;
   };

} //namespace poker

#endif

