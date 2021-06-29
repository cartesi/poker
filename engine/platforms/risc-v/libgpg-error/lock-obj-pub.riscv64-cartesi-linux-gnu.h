## lock-obj-pub.riscv64-cartesi-linux-gnu.h - NO LOCK SUPPORT
## File created by gen-posix-lock-obj - DO NOT EDIT
## To be included by mkheader into gpg-error.h

/* Dummy object - no locking available.  */
typedef struct
{
  long _vers;
} gpgrt_lock_t;

#define GPGRT_LOCK_INITIALIZER {-1}
##
## Local Variables:
## mode: c
## buffer-read-only: t
## End:
##
