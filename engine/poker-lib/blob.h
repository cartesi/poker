#ifndef BLOB_H
#define BLOB_H

#include <algorithm>
#include <iostream>
#include "string-stream.h"

namespace poker {


/*
 *  Opaque data container 
*/
class blob {
    std::string _data;
    osstream _out;
    isstream _in;
    bool _auto_rewind;
public:
    blob();
    blob(const blob &other);
    blob(const char* s);
    void set_data(const char* d);
    void set_data(const std::string& s) { _data=s; }
    void append(const blob& b);
    void append(const std::string& s);
    const char* get_data();
    const std::string& str() { return _data; }
    int size();
    void clear();
    void rewind();
    void set_auto_rewind(bool v);
    std::ostream& out();
    std::istream& in();
    std::istream& in(bool auto_rewind);
    operator std::string ();
    operator const char*();
    bool empty();
    bool operator == (const char* rhs);
    blob& operator = (const blob& rhs);
};

}

#endif