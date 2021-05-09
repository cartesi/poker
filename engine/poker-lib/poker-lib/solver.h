#ifndef SOLVER_H
#define SOLVER_H


namespace poker {

class solver {
public:
    solver();
    ~solver();
    int card_type_from_str(const char* card_str);
    const char* card_str_from_type(int card_type);
    int compare_hands(int *hand1, int * hand2, int hand_size);
};


} // namespace poker

#endif // SOLVER_H