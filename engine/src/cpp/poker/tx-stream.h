
class transport {
public:
    std::string data;
    int size() { return data.size(); }
    int  write(const char *s, int num) {
        //std::cout << "write " << num << std::endl;
        data = data + std::string(s, num);
        return num;
    }
    int  read(char *s, int num) {
        //std::cout << "read " << num << std::endl;
        int av = (int)data.size();
        if (av < num) num=av;
        auto subs = data.substr(0, num);
        memcpy(s, subs.c_str(), num);
        s[num] = 0;
        data.erase(0, num);
        return num;
    }
    void dump(std::string msg) {
        std::cout << "TX: " << msg << " size:" << size() 
            << std::endl;
    }
};

struct txbuf_traits {
	static inline bool buffer_output () { return false; 	}
	static inline size_t o_buffer_sz () {return 512;	}
	static inline size_t i_buffer_sz()	{ return 1024;	}
	static inline size_t putback_sz() {	return 4; }
};

typedef int int_type;

template <class traits = txbuf_traits> class basic_txbuf :	public std::streambuf {
	protected:
        transport& tx;
		char *mRBuffer;
		char *mWBuffer;
		size_t numWrite, numRead;
	public:
		typedef traits traits_type;
		basic_txbuf (transport &t) : tx(t), mRBuffer(NULL), mWBuffer(NULL) {
            reset();
            /*
			mRBuffer = new char[traits_type::i_buffer_sz()];
			mWBuffer = new char[traits_type::o_buffer_sz()];
			if (traits_type::buffer_output())	{
				setp(mWBuffer, mWBuffer+(traits_type::o_buffer_sz()-1));
			}
			char *pos = mRBuffer+traits_type::putback_sz();
			setg(pos, pos, pos);
			numWrite = 0, numRead = 0;
            */
		}
		~basic_txbuf() {
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
                //std::cout << "** reading... " << std::endl; 
				count = tx.read(mRBuffer+traits_type::putback_sz(), bufsiz);
				if (count == 0)
					return EOF;
				else if (count == -1)
				{
                    std::cout << "----> -1 -1 -1\n";
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

typedef basic_txbuf<> txbuf;

class itxstream : public std::istream {
	protected:
		txbuf buf;
	public:
		itxstream(transport &itx) : std::istream(&buf), buf(itx) {	}
		size_t get_numRead() { return buf.get_numRead(); }
		size_t get_numWrite() { return buf.get_numWrite(); }
        void reset() { buf.reset(); }
};

class otxstream : public std::ostream {
	protected:
		txbuf buf;
	public:
		otxstream(transport &oPipe) : std::ostream(&buf), buf(oPipe) {	}
		size_t get_numRead () {	return buf.get_numRead();	}
		size_t get_numWrite	() { return buf.get_numWrite();	}
        void reset() { buf.reset(); }
};

class iotxstream : public std::iostream {
	protected:
		txbuf buf;
	public:
		size_t get_numRead() { return buf.get_numRead(); }
		size_t get_numWrite(){ return buf.get_numWrite(); }
};

