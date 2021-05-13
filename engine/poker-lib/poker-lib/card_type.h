#ifndef CARD_TYPE_H
#define CARD_TYPE_H

/*
    Theses constants help to refer to a specific card without having to 
    memorize its index.

    All cards are represented by an integer from 0-51, 52 total cards.
    
    Each constant is made of two chars: one to represent the rank 
    (2,3,4,5,6,7,8,9,T,Q,K,A) and another for the suit ((h)earts, 
    (d)iamonds, (c)lubs, (s)pades). The char order is the unortodox suit|rank
    simply to create a valid C++ identifier.
 */

namespace poker {
    const int h2 = 0;
    const int h3 = 1;
    const int h4 = 2;
    const int h5 = 3;
    const int h6 = 4;
    const int h7 = 5;
    const int h8 = 6;
    const int h9 = 7;
    const int hT = 8;
    const int hJ = 9;
    const int hQ = 10;
    const int hK = 11;
    const int hA = 12;
    const int d2 = 13;
    const int d3 = 14;
    const int d4 = 15;
    const int d5 = 16;
    const int d6 = 17;
    const int d7 = 18;
    const int d8 = 19;
    const int d9 = 20;
    const int dT = 21;
    const int dJ = 22;
    const int dQ = 23;
    const int dK = 24;
    const int dA = 25;
    const int c2 = 26;
    const int c3 = 27;
    const int c4 = 28;
    const int c5 = 29;
    const int c6 = 30;
    const int c7 = 31;
    const int c8 = 32;
    const int c9 = 33;
    const int cT = 34;
    const int cJ = 35;
    const int cQ = 36;
    const int cK = 37;
    const int cA = 38;
    const int s2 = 39;
    const int s3 = 40;
    const int s4 = 41;
    const int s5 = 42;
    const int s6 = 43;
    const int s7 = 44;
    const int s8 = 45;
    const int s9 = 46;
    const int sT = 47;
    const int sJ = 48;
    const int sQ = 49;
    const int sK = 50;
    const int sA = 51;
    const int uk = 99; //unknown card
}

#endif
