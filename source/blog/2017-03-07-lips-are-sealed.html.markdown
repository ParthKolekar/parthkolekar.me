---
title: Lips Are Sealed
date: 2017-03-07 19:03 UTC
tags:
  - ctf
  - reverse
  - gdb
  - introductory
---

A mythical beast has broken through the magical community and is wreaking havoc in the human world. Shrenik was assigned to go and subdue the said beast, but in his haste, he forgot to ask what manner of beast it was. He asks me to tell it to him, but through magics unknown their identities concealed, I'm sorry to say these lips are sealed. I do give him a file tho...

Bonus Brownie for guessing which series the reference is from.

Flag Format: /flag{[a-zA-Z]+}/

Provided [messsage](2017-03-07-lips-are-sealed/message)

Solution
========

The trusted `file` is the first thing to do for anything, so, let's do that.

	$ file message
	message: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, for GNU/Linux 2.6.32, BuildID[sha1]=670d3cafb3acdbe76501b1eb73eab04e0ed6dd1e, stripped

This is curious...

The file is dynamically linked, and stripped. What this means is that we would be able to get information about library functions called by the program but not about the functions that are embedded in the program.

This suggests that a `ltrace` / `strace` would be helpful.

	$ ltrace ./message
	__libc_start_main(0x400470, 1, 0x7ffc742b3a88, 0x400810 <no return ...>
	+++ exited (status 0) +++

Huh?

	$ strace ./message
	execve("./message", ["./message"], [/* 83 vars */]) = 0
	brk(NULL)                               = 0x6c6000
	access("/etc/ld.so.nohwcap", F_OK)      = -1 ENOENT (No such file or directory)
	mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f92f3dbd000
	access("/etc/ld.so.preload", R_OK)      = -1 ENOENT (No such file or directory)
	open("/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
	fstat(3, {st_mode=S_IFREG|0644, st_size=146512, ...}) = 0
	mmap(NULL, 146512, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f92f3d99000
	close(3)                                = 0
	access("/etc/ld.so.nohwcap", F_OK)      = -1 ENOENT (No such file or directory)
	open("/lib/x86_64-linux-gnu/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
	read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0P\t\2\0\0\0\0\0"..., 832) = 832
	fstat(3, {st_mode=S_IFREG|0755, st_size=1864888, ...}) = 0
	mmap(NULL, 3967392, PROT_READ|PROT_EXEC, MAP_PRIVATE|MAP_DENYWRITE, 3, 0) = 0x7f92f37d1000
	mprotect(0x7f92f3990000, 2097152, PROT_NONE) = 0
	mmap(0x7f92f3b90000, 24576, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x1bf000) = 0x7f92f3b90000
	mmap(0x7f92f3b96000, 14752, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_ANONYMOUS, -1, 0) = 0x7f92f3b96000
	close(3)                                = 0
	mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f92f3d98000
	mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f92f3d97000
	mmap(NULL, 4096, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f92f3d96000
	arch_prctl(ARCH_SET_FS, 0x7f92f3d97700) = 0
	mprotect(0x7f92f3b90000, 16384, PROT_READ) = 0
	mprotect(0x600000, 4096, PROT_READ)     = 0
	mprotect(0x7f92f3dbf000, 4096, PROT_READ) = 0
	munmap(0x7f92f3d99000, 146512)          = 0
	exit_group(0)                           = ?
	+++ exited with 0 +++

Huh?

So it seems that the main function of this does not call any interesting syscalls or library calls before exiting with status 0.
Let us see what library calls are defined in the message. 

We would be able to make out the function skeleton since the file is dynamically linked.


	$ gdb ./message
	...
	0x0000000000400440  _IO_putc@plt
	0x0000000000400450  __libc_start_main@plt
	...


So it seems that there is a reference to a putc function in the code. This is interesting enough for us to take a look at.
So let us take the binary and find out where this call is embedded.

	$ objdump -S message
	...
	  40057d:	00 00 00 
	  400580:	48 83 ec 08          	sub    $0x8,%rsp
	  400584:	48 8b 35 ad 0a 20 00 	mov    0x200aad(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  40058b:	bf 66 00 00 00       	mov    $0x66,%edi
	  400590:	e8 ab fe ff ff       	callq  400440 <_IO_putc@plt>
	  400595:	48 8b 35 9c 0a 20 00 	mov    0x200a9c(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  40059c:	bf 6c 00 00 00       	mov    $0x6c,%edi
	  4005a1:	e8 9a fe ff ff       	callq  400440 <_IO_putc@plt>
	  4005a6:	48 8b 35 8b 0a 20 00 	mov    0x200a8b(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4005ad:	bf 61 00 00 00       	mov    $0x61,%edi
	  4005b2:	e8 89 fe ff ff       	callq  400440 <_IO_putc@plt>
	  ...

So there seems to be a large chunk of a function with a huge amout of `putc` calls. The `main` function, as we can see is totally empty and there are no branches anywhere. So we see that our solution must be in this putc calling function. Let us try to call it.

	$ gdb ./message
	...
	(gdb) catch syscall exit_group 
	Catchpoint 1 (syscall 'exit_group' [231])
	(gdb) b _IO_putc
	Breakpoint 2 at 0x400440
	(gdb) b __libc_start_main
	Breakpoint 3 at 0x400450
	(gdb) r
	Starting program: /home/parth/projects/slash-blog/media/lips-are-sealed/message 

	Breakpoint 3, __libc_start_main (main=0x400470, argc=1, argv=0x7fffffffdb78, init=0x400810, fini=0x400880, rtld_fini=0x7ffff7de78e0 <_dl_fini>, stack_end=0x7fffffffdb68) at ../csu/libc-start.c:134
	134	../csu/libc-start.c: No such file or directory.
	(gdb) c
	Continuing.

	Catchpoint 1 (call to syscall exit_group), 0x00007ffff7ad9b98 in __GI__exit (status=status@entry=0) at ../sysdeps/unix/sysv/linux/_exit.c:31
	31	../sysdeps/unix/sysv/linux/_exit.c: No such file or directory.
	(gdb) j *0x400580
	Line 0 is not in `__GI__exit'.  Jump anyway? (y or n) y
	Continuing at 0x400580.

	Breakpoint 2, __GI__IO_putc (c=102, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	putc.c: No such file or directory.
	(gdb) c
	Continuing.

	...
	
	Breakpoint 2, __GI__IO_putc (c=125, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Program received signal SIGSEGV, Segmentation fault.
	__run_exit_handlers (status=0, listp=0x7ffff7dcd8e0 <__elf_set___libc_thread_subfreeres_element_arena_thread_freeres__>, run_list_atexit=run_list_atexit@entry=true) at exit.c:68
	68	exit.c: No such file or directory.
	(gdb) q
	A debugging session is active.

		Inferior 1 [process 21837] will be killed.

	Quit anyway? (y or n) y


The important part to notice here is that the arguments to the putc function are human readable strings. The longish chain of `putc` also ends with a  SIGSEGV meaning that there is an unterminated block here that we should not have touched. 

No biggie, we already got all the arguments of putc. 

	0x66 = 'f'
	0x6c = 'l'
	0x61 = 'a'
	0x67 = 'g'
	0x7b = '{'
	0x38 = '8'
	0x36 = '6'
	0x32 = '2'
	0x31 = '1'
	0x66 = 'f'
	0x66 = 'f'
	0x64 = 'd'
	0x62 = 'b'
	0x63 = 'c'
	0x35 = '5'
	0x36 = '6'
	0x39 = '9'
	0x38 = '8'
	0x38 = '8'
	0x32 = '2'
	0x39 = '9'
	0x33 = '3'
	0x39 = '9'
	0x37 = '7'
	0x64 = 'd'
	0x39 = '9'
	0x37 = '7'
	0x37 = '7'
	0x36 = '6'
	0x37 = '7'
	0x61 = 'a'
	0x63 = 'c'
	0x31 = '1'
	0x33 = '3'
	0x64 = 'd'
	0x62 = 'b'
	0x33 = '3'
	0x7d = '}'


That is great! We got the flag!

	flag{8621ffdbc5698829397d97767ac13db3}

But wait. That does not make sense. 

	> Flag Format: /flag{[a-zA-Z]+}/

So this must be a hash. 

A hash lookup does indeed give us a match.

	md5sum(dragon) = 8621ffdbc5698829397d97767ac13db3


Flag
====

flag{dragon}
