#ifndef CARDS_H
#define CARDS_H

namespace poker {

typedef int card_t;

/*
    Theses constants help to refer to a specific card without having to 
    memorize its index.

    All cards are represented by an integer from 0-51, 52 total cards.
    
    Each constant is made of two chars: one to represent the rank 
    (2,3,4,5,6,7,8,9,T,Q,K,A) and another for the suit ((h)earts, 
    (d)iamonds, (c)lubs, (s)pades). The char order is the unortodox suit|rank
    simply to create a valid C++ identifier.
 */

namespace cards {
   const card_t h2 = 0;
   const card_t h3 = 1;
   const card_t h4 = 2;
   const card_t h5 = 3;
   const card_t h6 = 4;
   const card_t h7 = 5;
   const card_t h8 = 6;
   const card_t h9 = 7;
   const card_t hT = 8;
   const card_t hJ = 9;
   const card_t hQ = 10;
   const card_t hK = 11;
   const card_t hA = 12;
   const card_t d2 = 13;
   const card_t d3 = 14;
   const card_t d4 = 15;
   const card_t d5 = 16;
   const card_t d6 = 17;
   const card_t d7 = 18;
   const card_t d8 = 19;
   const card_t d9 = 20;
   const card_t dT = 21;
   const card_t dJ = 22;
   const card_t dQ = 23;
   const card_t dK = 24;
   const card_t dA = 25;
   const card_t c2 = 26;
   const card_t c3 = 27;
   const card_t c4 = 28;
   const card_t c5 = 29;
   const card_t c6 = 30;
   const card_t c7 = 31;
   const card_t c8 = 32;
   const card_t c9 = 33;
   const card_t cT = 34;
   const card_t cJ = 35;
   const card_t cQ = 36;
   const card_t cK = 37;
   const card_t cA = 38;
   const card_t s2 = 39;
   const card_t s3 = 40;
   const card_t s4 = 41;
   const card_t s5 = 42;
   const card_t s6 = 43;
   const card_t s7 = 44;
   const card_t s8 = 45;
   const card_t s9 = 46;
   const card_t sT = 47;
   const card_t sJ = 48;
   const card_t sQ = 49;
   const card_t sK = 50;
   const card_t sA = 51;
   const card_t uk = 99; //unknown card

} // namespace cards

} // namespace poker

#endif // CARDS_H