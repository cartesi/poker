#include <vector>
#include <sstream>
#include <brotli/decode.h>
#include <brotli/encode.h>

#include "compression.h"

namespace poker {

static BROTLI_BOOL compress_stream(BrotliEncoderState* enc, BrotliEncoderOperation op, std::vector<uint8_t>* output, uint8_t* input, size_t input_length);
static BROTLI_BOOL decompress_stream(BrotliDecoderState* dec, std::vector<uint8_t>* output, uint8_t* input, size_t input_length);

struct wrap_header {
  int32_t total_len;
  int32_t data_len;
};

std::string wrap(const std::string& data) {
    wrap_header hdr;

    hdr.data_len = data.size();
    hdr.total_len = sizeof(hdr) + hdr.data_len;

    auto pads = 0;
    auto mod = hdr.total_len % wrap_padding_size;
    if (mod != 0)
      pads += (wrap_padding_size - mod);;    
    hdr.total_len += pads;

    std::ostringstream os;
    os.write((const char*)&hdr, sizeof(hdr));
    os.write(data.data(), data.size());
    for(; pads; pads--)
      os.write("#", 1);

    return os.str();
}

game_error unwrap(const std::string& in, std::string& out) {
    wrap_header hdr;

    if (in.size() < sizeof(wrap_header))
        return CPR_INVALID_DATA_LENGTH;

    std::istringstream is(in);
    is.read((char*)&hdr, sizeof(hdr));
    if (!is.good())
        return CPR_READ_ERROR;

    if (hdr.data_len > wrap_max_len)
      return CPR_DATA_TOO_BIG;

    if (in.size() < sizeof(hdr) + hdr.data_len)
      return CPR_INSUFFICIENT_DATA;
    
    out = in.substr(sizeof(hdr), hdr.data_len);

    return SUCCESS;
}

game_error compress(const std::string& in, std::string &out) {
    std::vector<uint8_t> output;
    
    BrotliEncoderState* enc = BrotliEncoderCreateInstance(0, 0, 0);
    if (!enc)
        return CPR_COMPRESS_INIT;

    auto in_size = in.size();
    auto ok = compress_stream(enc, BROTLI_OPERATION_PROCESS, &output, (uint8_t*)in.data(), in.size());
    if (ok != BROTLI_TRUE)
        return CPR_COMPRESS;

    ok = compress_stream(enc, BROTLI_OPERATION_FLUSH, &output, NULL, 0);
    if (ok != BROTLI_TRUE)
        return CPR_COMPRESS_FLUSH;

    BrotliEncoderDestroyInstance(enc);

    out = std::string(output.begin(), output.end());
    //logger << "## --> compressed " << in_size << " -> " << out.size() << std::endl;

    return SUCCESS; 
}

game_error decompress(const std::string& in, std::string &out) {
    std::vector<uint8_t> output;
    
    BrotliDecoderState* dec = BrotliDecoderCreateInstance(0, 0, 0);
    if (!dec)
        return CPR_DECOMPRESS_INIT;

    auto ok = decompress_stream(dec, &output, (uint8_t*)in.data(), in.size());
    if (ok != BROTLI_TRUE)
        return CPR_DECOMPRESS;

    BrotliDecoderDestroyInstance(dec);

    out = std::string(output.begin(), output.end());
    // logger << "## --< decompressed " << in.size() << " -> " << out.size() << std::endl;
    
    return SUCCESS; 
}

game_error compress_and_wrap(const std::string& in, std::string &out) {
    game_error res;
    std::string compressed;
    if (in.size())
        if ((res=compress(in, compressed)))
            return res;
    out = wrap(compressed);
    return SUCCESS;
}

game_error unwrap_and_decompress(const std::string& in, std::string &out) {
    game_error res;

    std::string compressed;
    if ((res=unwrap(in, compressed)))
        return res;

    if (!compressed.size())
        out = compressed;
    else
        if ((res=decompress(compressed, out)))
            return res;
    return SUCCESS;
}

game_error unwrap_next(std::istream& in, std::string& out) {
    game_error res;
    wrap_header hdr;

    if ((res = read_exactly(in, sizeof(hdr), (char*)&hdr)))
        return res;

    if (hdr.data_len > wrap_max_len)
      return CPR_DATA_TOO_BIG;

    if ((res = read_exactly(in, hdr.data_len, out)))
        return res;

    for (int pads = hdr.total_len - sizeof(hdr) - hdr.data_len; pads > 0; pads--) {
      char tmp;
      in.read(&tmp, 1);
      if (!in.good())
        return CPR_READ_ERROR;
    }

    return SUCCESS;
}

game_error unwrap_and_decompress_next(std::istream& is, std::string &out) {
    game_error res;
    std::string compressed;
    if ((res=unwrap_next(is, compressed)))
        return res;

    return decompress(compressed, out);
}

static BROTLI_BOOL compress_stream(BrotliEncoderState* enc, BrotliEncoderOperation op, std::vector<uint8_t>* output, uint8_t* input, size_t input_length) {
  BROTLI_BOOL ok = BROTLI_TRUE;

  size_t available_in = input_length;
  const uint8_t* next_in = input;
  size_t available_out = 0;
  uint8_t* next_out = NULL;

  while (ok) {
    ok = BrotliEncoderCompressStream(enc, op,
                                     &available_in, &next_in,
                                     &available_out, &next_out, NULL);
    if (!ok)
      break;

    size_t buffer_length = 0; // Request all available output.
    const uint8_t* buffer = BrotliEncoderTakeOutput(enc, &buffer_length);
    if (buffer_length) {
      (*output).insert((*output).end(), buffer, buffer + buffer_length);
    }

    if (available_in || BrotliEncoderHasMoreOutput(enc)) {
      continue;
    }

    break;
  }
  return ok;
}

static BROTLI_BOOL decompress_stream(BrotliDecoderState* dec, std::vector<uint8_t>* output, uint8_t* input, size_t input_length) {
  BROTLI_BOOL ok = BROTLI_TRUE;
  size_t available_in = input_length;
  const uint8_t* next_in = input;
  size_t available_out = 0;
  uint8_t* next_out = NULL;

  BrotliDecoderResult result = BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT;
  while (result == BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT) {
    result = BrotliDecoderDecompressStream(dec,
                                           &available_in, &next_in,
                                           &available_out, &next_out, NULL);
    size_t buffer_length = 0; // Request all available output.
    const uint8_t* buffer = BrotliDecoderTakeOutput(dec, &buffer_length);
    if (buffer_length) {
      (*output).insert((*output).end(), buffer, buffer + buffer_length);
    }
  }
  ok = result != BROTLI_DECODER_RESULT_ERROR && !available_in;

  return ok;
}

}
