#include "blob.h"

namespace poker {

blob::blob() : _out(_data), _in(_data), _auto_rewind(true) {
}

blob::blob(const char* s) : _data(s), _out(_data), _in(_data), _auto_rewind(true) {
}

blob::blob(const blob &other) : _data(other._data), _out(_data), _in(_data) {
}

blob& blob::operator = (const blob& rhs) {
    _data = rhs._data;
    _auto_rewind = rhs._auto_rewind;
    return *this;
}

bool blob::empty() {
    return _data.size() == 0;
}

void blob::set_data(const char* d) {
    _data = d;
}

void blob::append(const std::string& s) {
    _data += s;
}

void blob::append(const  blob& b) {
    _data += b._data;
}

const char* blob::get_data() {
    return _data.c_str();
}

int blob::size() {
    return _data.size();
}

void blob::clear() { _data.clear(); }

void blob::rewind() {
    _in.rewind();
}

void blob::set_auto_rewind(bool v) {
    _auto_rewind=v;
}

std::ostream& blob::out() { 
    return _out;
}

std::istream& blob::in(bool auto_rewind) { 
    set_auto_rewind(auto_rewind);
    return in();
}

std::istream& blob::in() { 
    if (_auto_rewind)
        rewind();
    return _in;
}

blob::operator std::string () {
    return _data;
}

blob::operator const char*() {
    return _data.c_str();
}

bool blob::operator == (const char* rhs) {
    return _data == rhs;
}



}