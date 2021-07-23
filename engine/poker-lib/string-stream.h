#ifndef SSTREAM_H
#define SSTREAM_H

#include <iostream>
#include <cstring>
#include <memory.h>
#include "common.h"

namespace poker {


/*
* convenience stream to help inspecting libTMCG IO
*/
class string_stream {
    int _r;
public:
    std::string& data;
    string_stream(std::string &s) : _r(0), data(s) { }
    int  write(const char *s, int num) {
        // logger << "write " << num << std::endl;
        data = data + std::string(s, num);
        return num;
    }
    int  read(char *s, int num) {
        int av = (int)data.size() - _r;
        if (av < num) num=av;
        auto subs = data.substr(_r, _r+num);
        memcpy(s, subs.c_str(), num);
        s[num] = 0;
        _r += num;
        //logger << "read " << num << std::endl;
        return num;
    }
    void rewind() { _r = 0; }
    int rpos() { return _r; }
    void rseek(int pos) { _r=pos; }
};

struct sbuf_traits {
	static inline bool buffer_output () { return false; 	}
	static inline size_t o_buffer_sz () {return 512;	}
	static inline size_t i_buffer_sz()	{ return 1024;	}
	static inline size_t putback_sz() {	return 4; }
};

typedef int int_type;

template <class traits = sbuf_traits> class basic_sbuf :	public std::streambuf {
	protected:
        string_stream &tx;
		char *mRBuffer;
		char *mWBuffer;
		size_t numWrite, numRead;
	public:
		typedef traits traits_type;
		basic_sbuf (string_stream &s) : tx(s), mRBuffer(NULL), mWBuffer(NULL) {
            reset();
		}
		~basic_sbuf() {
			sync();
			delete [] mRBuffer;
			delete [] mWBuffer;
		}
        void reset() {
            delete [] mRBuffer;
            delete [] mWBuffer;
			mRBuffer = new char[traits_type::i_buffer_sz()];
			mWBuffer = new char[traits_type::o_buffer_sz()];
			if (traits_type::buffer_output())	{
				setp(mWBuffer, mWBuffer+(traits_type::o_buffer_sz()-1));
			}
			char *pos = mRBuffer+traits_type::putback_sz();
			setg(pos, pos, pos);
			numWrite = 0, numRead = 0;

        }
	protected:
		int flushOutput() {
			ssize_t num = pptr() - pbase();
			if (tx.write(mWBuffer, num) != num)
				return EOF;
			pbump(-num);
			numWrite += num;
			return num;
		}
		virtual int_type overflow(int_type c) {
			if (traits_type::buffer_output()) {
				*pptr() = c;
				pbump(1);
				if (flushOutput() == EOF)
					return EOF;
				return c;
			}
			else {
				if (c != EOF) {
					char z = c;
					if (tx.write(&z, 1) != 1)
						return EOF;
					numWrite += 1;
				}
				return c;
			}
		}
		virtual int sync() {
			if (flushOutput() == EOF) {
				return -1;
            }
			return 0;
		}
		virtual std::streamsize xsputn(const char *s, std::streamsize num) {
			numWrite += num;
			int ret = tx.write(s, num);
			return ret;
		}
		virtual int_type underflow() {
			if (gptr() < egptr())
				return *gptr();
			size_t numPutBack = gptr() - eback();
			if (numPutBack > traits_type::putback_sz())
				numPutBack = traits_type::putback_sz();
			std::memmove(mRBuffer+(traits_type::putback_sz() - numPutBack),
				gptr() - numPutBack, numPutBack);
			
			size_t bufsiz = traits_type::i_buffer_sz() - 
				traits_type::putback_sz();
			ssize_t count;
			while (1)
			{
                //logger << "** reading... " << std::endl; 
				count = tx.read(mRBuffer+traits_type::putback_sz(), bufsiz);
				if (count == 0)
					return EOF;
				else if (count == -1)
				{
                    poker::logger << "----> -1 -1 -1\n";
					if (errno == EAGAIN || errno == EWOULDBLOCK ||
						errno == EINTR)
						continue;
					else
						return EOF;
				}
				else
				{
					numRead += count;
					break;
				}
			}
			setg(mRBuffer+(traits_type::putback_sz()-numPutBack),
				mRBuffer+traits_type::putback_sz(), 
				mRBuffer+traits_type::putback_sz()+count);

        
			return *gptr();
		}
	public:
		size_t get_numRead() { return numRead; }
		size_t get_numWrite () { return numWrite; }
};

typedef basic_sbuf<> sbuf;

class osstream : public std::ostream {
	protected:
        string_stream s;
		sbuf buf;
	public:
		osstream(std::string& out) : s(out), buf(s), std::ostream(&buf) {	}
};

class isstream : public std::istream {
	protected:
        string_stream s;
		sbuf buf;
	public:
		isstream(std::string& in) : s(in), buf(s), std::istream(&buf) {	}
        void rewind() {
            s.rewind();
        }
        int rpos() { return s.rpos(); }
        void rseek(int pos) { s.rseek(pos); }
};

}

#endif
