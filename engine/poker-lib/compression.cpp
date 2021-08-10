#include <vector>
#include <brotli/decode.h>
#include <brotli/encode.h>

#include "compression.h"

namespace poker {

static BROTLI_BOOL compress_stream(BrotliEncoderState* enc, BrotliEncoderOperation op, std::vector<uint8_t>* output, uint8_t* input, size_t input_length);
static BROTLI_BOOL decompress_stream(BrotliDecoderState* dec, std::vector<uint8_t>* output, uint8_t* input, size_t input_length);

#define STR(x) #x
#define HEADER_FMT(len) "%0" STR(len) "d"
#define HEADER_LEN 8

std::string wrap(const std::string& data) {
    char header[1+HEADER_LEN];
    sprintf(header, HEADER_FMT(HEADER_LEN), (int)data.size());
    return std::string(header) + data;
}

game_error unwrap(const std::string& in, std::string& out) {
    if (in.size() < HEADER_LEN)
        return CPR_HEADER_TOO_SMALL;

    int len = 0;
    if (1 != sscanf(in.c_str(), HEADER_FMT(HEADER_LEN), &len))
        return CPR_UNPARSEABLE_LEN;

    if (in.size() < len + HEADER_LEN)
        return CPR_PAYLOAD_TOO_SMALL;

    out = in.substr(HEADER_LEN, len);
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
    std::string header;
    if ((res=read_exactly(in, HEADER_LEN, header)))
        return res;

    int len;
    if (1 != sscanf(header.c_str(), HEADER_FMT(HEADER_LEN), &len))
        return CPR_UNPARSEABLE_LEN;

    if ((res=read_exactly(in, len, out)))
        return res;

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
