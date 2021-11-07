#include "blob.h"

namespace poker {

blob::blob() : 
  _buf(new std::stringbuf()), 
  _out(_buf), 
  _in(_buf), 
  _auto_rewind(true) 
{
}

blob::blob(const char* s) : 
  _buf(new std::stringbuf()), 
  _out(_buf), 
  _in(_buf), 
  _auto_rewind(true) 
{
  std::string init;
  if (s)
    init = s;
  _buf->str(init);
}

blob::blob(const blob &other) : 
  _buf(new std::stringbuf()),  
  _out(_buf), 
  _in(_buf), 
  _auto_rewind(other._auto_rewind)
{
  _buf->str(other._buf->str());
}

blob::~blob() {
  delete _buf;
}

void blob::set_data(const char* d) {
  std::string init;
  if (d)
    init = *d;
  _buf->str(init);
}

void blob::set_data(const std::string& s) {
  _buf->str(s);
}

void blob::append(const blob& b) {
  std::string s = b._buf->str();
  _buf->sputn(s.data(), s.size());
}

void blob::append(const std::string& s) {
  _buf->sputn(s.data(), s.size());
}

const char* blob::get_data() {
  _tmp = _buf->str();
  return _tmp.data();
}

const std::string& blob::str() { 
  _tmp = _buf->str();
  return _tmp;
}

int blob::size() {
  return _buf->str().size();
}

void blob::clear() {
  _buf->str("");
}

void blob::set_auto_rewind(bool v) {
    _auto_rewind=v;
}

void blob::rewind() {
  _buf->pubseekpos(0);
}

std::ostream& blob::out() {
  return _out;
}

std::istream& blob::in() {
  if (_auto_rewind) {
    rewind();
  }
  return _in;
}

std::istream& blob::in(bool auto_rewind) {
    set_auto_rewind(auto_rewind);
    return _in;
}

blob::operator std::string () {
  return _buf->str();
}

blob::operator const char*() {
  _tmp = _buf->str();
  return _tmp.data();
}

bool blob::operator == (const char* rhs) {
  return _buf->str() == rhs;
}

bool blob::empty() {
  return _buf->str().size() == 0;
}

blob& blob::operator = (const blob& rhs) {
  _buf->str(rhs._buf->str());
  return *this;
}


}