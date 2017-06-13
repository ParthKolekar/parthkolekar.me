---
title: Kill My Linux
date: 2017-03-28 05:03 UTC
tags: 
  - ctf 
  - reverse
---

So I have another reverse question. This one should be easy, all you have to do is to
let this binary run, and it will eventually print the correct answer. :)

- Hint : The binary is dynamically linked.
- Hint : How is the executable crashing the system? Can you prevent the executable from doing random BC on your system?

- Flag Format : /flag{[a-z]+}/

Provided [kill-my-linux](2017-03-28-kill-my-linux/kill-my-linux)


Solution
--------


So we start off with the basic tests.

    $ file kill-my-linux
    kill-my-linux: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 2.6.32, BuildID[sha1]=98869d89b9397811a12119d5e71002c02b0a4797, not stripped

Hmm, seems to be a ELF file, which is dynamically linked and also not stripped.
That is quite interesting, because that enables us to view exactly what functions
are being called here.

    $ gdb kill-my-linux
    GNU gdb (Ubuntu 7.11.1-0ubuntu1~16.04) 7.11.1
    Copyright (C) 2016 Free Software Foundation, Inc.
    License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
    This is free software: you are free to change and redistribute it.
    There is NO WARRANTY, to the extent permitted by law.  Type "show copying"
    and "show warranty" for details.
    This GDB was configured as "x86_64-linux-gnu".
    Type "show configuration" for configuration details.
    For bug reporting instructions, please see:
    <http://www.gnu.org/software/gdb/bugs/>.
    Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.
    For help, type "help".
    Type "apropos word" to search for commands related to "word"...
    Reading symbols from kill-my-linux...(no debugging symbols found)...done.
    (gdb) info functions
    All defined functions:

    Non-debugging symbols:
    0x0000000000400788  _init
    0x00000000004007c0  free@plt
    0x00000000004007d0  putchar@plt
    0x00000000004007e0  omp_get_thread_num@plt
    0x00000000004007f0  memset@plt
    0x0000000000400800  __libc_start_main@plt
    0x0000000000400810  calloc@plt
    0x0000000000400820  omp_get_num_threads@plt
    0x0000000000400830  fflush@plt
    0x0000000000400840  GOMP_parallel@plt
    0x0000000000400850  execlp@plt
    0x0000000000400860  sleep@plt
    0x0000000000400870  fork@plt
    0x0000000000400880  usleep@plt
    0x00000000004008a0  _start
    0x00000000004008d0  deregister_tm_clones
    0x0000000000400910  register_tm_clones
    0x0000000000400950  __do_global_dtors_aux
    0x0000000000400970  frame_dummy
    0x0000000000400996  main
    0x0000000000410e75  main._omp_fn
    ...
    0x0000000000451e77  main._omp_fn
    0x0000000000451f10  __libc_csu_init
    0x0000000000451f80  __libc_csu_fini
    0x0000000000451f84  _fini
    (gdb)

This is quite an interesting output.

We see a whole lot of functions called main._omp_fn.
We also see some other omp related functions like GOMP_parallel@plt

This means that the file was compiled with OpenMP, a library to do
multi-processing in C.

We decompile the main function to see what exactly is being parallelized.

    $ objdump -S kill-my-linux
    ...
    0000000000400996 <main>:
    400996:	55                   	push   %rbp
    400997:	48 89 e5             	mov    %rsp,%rbp
    40099a:	48 83 ec 20          	sub    $0x20,%rsp
    40099e:	89 7d ec             	mov    %edi,-0x14(%rbp)
    4009a1:	48 89 75 e0          	mov    %rsi,-0x20(%rbp)
    4009a5:	be 01 00 00 00       	mov    $0x1,%esi
    4009aa:	bf 30 75 00 00       	mov    $0x7530,%edi
    4009af:	e8 5c fe ff ff       	callq  400810 <calloc@plt>
    4009b4:	48 89 45 f0          	mov    %rax,-0x10(%rbp)
    4009b8:	bf 88 13 00 00       	mov    $0x1388,%edi
    4009bd:	e8 be fe ff ff       	callq  400880 <usleep@plt>
    4009c2:	b9 00 00 00 00       	mov    $0x0,%ecx
    4009c7:	ba 00 00 00 00       	mov    $0x0,%edx
    4009cc:	be 00 00 00 00       	mov    $0x0,%esi
    4009d1:	bf 75 0e 41 00       	mov    $0x410e75,%edi
    4009d6:	e8 65 fe ff ff       	callq  400840 <GOMP_parallel@plt>
    4009db:	b9 00 00 00 00       	mov    $0x0,%ecx
    4009e0:	ba 00 00 00 00       	mov    $0x0,%edx
    4009e5:	be 00 00 00 00       	mov    $0x0,%esi
    4009ea:	bf 08 0f 41 00       	mov    $0x410f08,%edi
    4009ef:	e8 4c fe ff ff       	callq  400840 <GOMP_parallel@plt>
    4009f4:	b9 00 00 00 00       	mov    $0x0,%ecx
    4009f9:	ba 00 00 00 00       	mov    $0x0,%edx
    4009fe:	be 00 00 00 00       	mov    $0x0,%esi
    400a03:	bf 9b 0f 41 00       	mov    $0x410f9b,%edi
    400a08:	e8 33 fe ff ff       	callq  400840 <GOMP_parallel@plt>
    400a0d:	bf 88 13 00 00       	mov    $0x1388,%edi
    400a12:	e8 69 fe ff ff       	callq  400880 <usleep@plt>
    ...


So, here I see a call to usleep for 1ms, then GOMP_parallel, and then another
call to usleep.

Looking across the output, I see that the entire binary is filled with the calls to
GOMP_parallel followed by usleep.

Looking into the function being called...

    410ed0:       89 c3                   mov    %eax,%ebx
    410ed2:       c7 45 ec 00 00 00 00    movl   $0x0,-0x14(%rbp)
    410ed9:       8b 45 ec                mov    -0x14(%rbp),%eax
    410edc:       3b 45 e8                cmp    -0x18(%rbp),%eax
    410edf:       7c 0b                   jl     410eec <main._omp_fn.0+0x77>
    410ee1:       83 6d e8 01             subl   $0x1,-0x18(%rbp)
    410ee5:       39 5d e8                cmp    %ebx,-0x18(%rbp)
    410ee8:       7f e8                   jg     410ed2 <main._omp_fn.0+0x5d>
    410eea:       eb 15                   jmp    410f01 <main._omp_fn.0+0x8c>
    410eec:       e8 7f f9 fe ff          callq  400870 <fork@plt>
    410ef1:       83 45 ec 01             addl   $0x1,-0x14(%rbp)
    410ef5:       eb e2                   jmp    410ed9 <main._omp_fn.0+0x64>
    410ef7:       b8 00 00 00 00          mov    $0x0,%eax
    410efc:       83 c1 01                add    $0x1,%ecx
    410eff:       eb ae                   jmp    410eaf <main._omp_fn.0+0x3a>
    410f01:       48 83 c4 28             add    $0x28,%rsp
    410f05:       5b                      pop    %rbx
    410f06:       5d                      pop    %rbp
    410f07:       c3                      retq


Huh!

So it does a parallel call of the fork().

I also find another interesting function call.

    406381:       ba 00 00 00 00          mov    $0x0,%edx
    406386:       be 94 1f 45 00          mov    $0x451f94,%esi
    40638b:       bf 94 1f 45 00          mov    $0x451f94,%edi
    406390:       b8 00 00 00 00          mov    $0x0,%eax
    406395:       e8 b6 a4 ff ff          callq  400850 <execlp@plt>


That is the pointer to where `/sbin/reboot` string is. 

So we have this program doing parallelized fork, along with parallelized reboots, along with
a bunch of usleep function calls in the middle.

I see in the above `info functions` that there is a call to putchar, memset, and sleep. Of which
sleep seems more interesting. ( Since we came into a ton of usleep calls.)

    40a1b4:       bf 80 01 66 09          mov    $0x9660180,%edi
    40a1b9:       e8 a2 66 ff ff          callq  400860 <sleep@plt>
    40a1be:       48 8b 45 f0             mov    -0x10(%rbp),%rax

Oh dear. It also does a long sleep of 0x9660190 seconds or 157680000 seconds. Which makes it exactly 5 years.

Guessing by the nature of the question, and the hints, I suppose we can try to skip all the function calls that we
don't want to. And since it is a dynamically linked, and non-stripped binary, that should be easy enough to do.

We make a block.c

~~~c
    int fork() {
    	return 0;
    }

    int usleep() {
      	return 0;
    }

    int sleep() {
      	return 0;
    }

    int execlp(char * file, char * arg, ...) {
	      return 0;
    }
~~~

Then we do the following.

    $ gcc -c block.c
    $ gcc block.o -shared -o libtest.so

This makes a libtest.so file, which contains a dummy declaration of all the
functions that we want to override.

Now comes the magic.

    $ LD_PRELOAD=./libtest.so ./kill-my-linux

What `LD_PRELOAD` does is that it tells the dynamic linker that the file provided
should be preloaded. Which means that the functions from the library are going to get
overridden.

Since I am the creator of the question, I know for a fact that skipping the OpenMP function
is safe by itself too. But even without skipping that part, we get to the solution in a minute.

The binary completes the multiprocessing and spits out the following. 

    $ LD_PRELOAD=./libtest.so ./kill-my-linux
    I see you shiver with antici ...... pation. flag{tweettweet}

Flag
----

flag{tweettweet}


Additional Notes
----------------

This is a nod to the account of [Frank Furter](https://twitter.com/DrFNFurter),
who made a two tweet legendary joke that was spaced exactly 5 years apart.

The binary itself is computing a 3-D matrix addition problem in parallel, while running
a transliterated brainfuck program to print the above string.

The completed C code without the garbage fork, usleep, and sleep is,

~~~c
    #include <stdio.h>
    #include <stdlib.h>
    #include <string.h>
    int main(int argc, char const *argv[]) {
      unsigned char *cell = calloc(30000, 1);
      unsigned char *cells = cell;
      --*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      memset(cells, 0, 30000);
      ++*cell;
      ++*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        ++cell;
        ++*cell;
        ++*cell;
        ++*cell;
        --cell;
      }
      ++cell;
      putchar(*cell);
      fflush(stdout);
      putchar(*cell);
      fflush(stdout);
      while (*cell) {
        --*cell;
        --*cell;
        --*cell;
        ++cell;
        ++*cell;
        --cell;
      }
      ++cell;
      --*cell;
      --*cell;
      --*cell;
      putchar(*cell);
      fflush(stdout);
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      ++*cell;
      putchar(*cell);
      fflush(stdout);
      free(cells);
      return 0;
    }
~~~

Which makes it quite difficult for a person to read.