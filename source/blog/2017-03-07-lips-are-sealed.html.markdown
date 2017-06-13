---
title: Lips Are Sealed
date: 2017-03-07 19:03 UTC
tags:
  - ctf
  - reverse
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
	Reading symbols from ./message...(no debugging symbols found)...done.
	gdb-peda$ info functions
	All defined functions:

	Non-debugging symbols:
	0x0000000000400440  _IO_putc@plt
	0x0000000000400450  __libc_start_main@plt
	gdb-peda$ 


So it seems that there is a reference to a putc function in the code. This is interesting enough for us to take a look at.
So let us take the binary and find out where this call is embedded.

	$ objdump -S message

	message:     file format elf64-x86-64


	Disassembly of section .init:

	0000000000400410 <.init>:
	  400410:	48 83 ec 08          	sub    $0x8,%rsp
	  400414:	48 8b 05 dd 0b 20 00 	mov    0x200bdd(%rip),%rax        # 600ff8 <__libc_start_main@plt+0x200ba8>
	  40041b:	48 85 c0             	test   %rax,%rax
	  40041e:	74 05                	je     400425 <_IO_putc@plt-0x1b>
	  400420:	e8 3b 00 00 00       	callq  400460 <__libc_start_main@plt+0x10>
	  400425:	48 83 c4 08          	add    $0x8,%rsp
	  400429:	c3                   	retq   

	Disassembly of section .plt:

	0000000000400430 <_IO_putc@plt-0x10>:
	  400430:	ff 35 d2 0b 20 00    	pushq  0x200bd2(%rip)        # 601008 <__libc_start_main@plt+0x200bb8>
	  400436:	ff 25 d4 0b 20 00    	jmpq   *0x200bd4(%rip)        # 601010 <__libc_start_main@plt+0x200bc0>
	  40043c:	0f 1f 40 00          	nopl   0x0(%rax)

	0000000000400440 <_IO_putc@plt>:
	  400440:	ff 25 d2 0b 20 00    	jmpq   *0x200bd2(%rip)        # 601018 <__libc_start_main@plt+0x200bc8>
	  400446:	68 00 00 00 00       	pushq  $0x0
	  40044b:	e9 e0 ff ff ff       	jmpq   400430 <_IO_putc@plt-0x10>

	0000000000400450 <__libc_start_main@plt>:
	  400450:	ff 25 ca 0b 20 00    	jmpq   *0x200bca(%rip)        # 601020 <__libc_start_main@plt+0x200bd0>
	  400456:	68 01 00 00 00       	pushq  $0x1
	  40045b:	e9 d0 ff ff ff       	jmpq   400430 <_IO_putc@plt-0x10>

	Disassembly of section .plt.got:

	0000000000400460 <.plt.got>:
	  400460:	ff 25 92 0b 20 00    	jmpq   *0x200b92(%rip)        # 600ff8 <__libc_start_main@plt+0x200ba8>
	  400466:	66 90                	xchg   %ax,%ax

	Disassembly of section .text:

	0000000000400470 <.text>:
	  400470:	31 c0                	xor    %eax,%eax
	  400472:	c3                   	retq   
	  400473:	66 2e 0f 1f 84 00 00 	nopw   %cs:0x0(%rax,%rax,1)
	  40047a:	00 00 00 
	  40047d:	0f 1f 00             	nopl   (%rax)
	  400480:	31 ed                	xor    %ebp,%ebp
	  400482:	49 89 d1             	mov    %rdx,%r9
	  400485:	5e                   	pop    %rsi
	  400486:	48 89 e2             	mov    %rsp,%rdx
	  400489:	48 83 e4 f0          	and    $0xfffffffffffffff0,%rsp
	  40048d:	50                   	push   %rax
	  40048e:	54                   	push   %rsp
	  40048f:	49 c7 c0 80 08 40 00 	mov    $0x400880,%r8
	  400496:	48 c7 c1 10 08 40 00 	mov    $0x400810,%rcx
	  40049d:	48 c7 c7 70 04 40 00 	mov    $0x400470,%rdi
	  4004a4:	e8 a7 ff ff ff       	callq  400450 <__libc_start_main@plt>
	  4004a9:	f4                   	hlt    
	  4004aa:	66 0f 1f 44 00 00    	nopw   0x0(%rax,%rax,1)
	  4004b0:	b8 3f 10 60 00       	mov    $0x60103f,%eax
	  4004b5:	55                   	push   %rbp
	  4004b6:	48 2d 38 10 60 00    	sub    $0x601038,%rax
	  4004bc:	48 83 f8 0e          	cmp    $0xe,%rax
	  4004c0:	48 89 e5             	mov    %rsp,%rbp
	  4004c3:	76 1b                	jbe    4004e0 <__libc_start_main@plt+0x90>
	  4004c5:	b8 00 00 00 00       	mov    $0x0,%eax
	  4004ca:	48 85 c0             	test   %rax,%rax
	  4004cd:	74 11                	je     4004e0 <__libc_start_main@plt+0x90>
	  4004cf:	5d                   	pop    %rbp
	  4004d0:	bf 38 10 60 00       	mov    $0x601038,%edi
	  4004d5:	ff e0                	jmpq   *%rax
	  4004d7:	66 0f 1f 84 00 00 00 	nopw   0x0(%rax,%rax,1)
	  4004de:	00 00 
	  4004e0:	5d                   	pop    %rbp
	  4004e1:	c3                   	retq   
	  4004e2:	0f 1f 40 00          	nopl   0x0(%rax)
	  4004e6:	66 2e 0f 1f 84 00 00 	nopw   %cs:0x0(%rax,%rax,1)
	  4004ed:	00 00 00 
	  4004f0:	be 38 10 60 00       	mov    $0x601038,%esi
	  4004f5:	55                   	push   %rbp
	  4004f6:	48 81 ee 38 10 60 00 	sub    $0x601038,%rsi
	  4004fd:	48 c1 fe 03          	sar    $0x3,%rsi
	  400501:	48 89 e5             	mov    %rsp,%rbp
	  400504:	48 89 f0             	mov    %rsi,%rax
	  400507:	48 c1 e8 3f          	shr    $0x3f,%rax
	  40050b:	48 01 c6             	add    %rax,%rsi
	  40050e:	48 d1 fe             	sar    %rsi
	  400511:	74 15                	je     400528 <__libc_start_main@plt+0xd8>
	  400513:	b8 00 00 00 00       	mov    $0x0,%eax
	  400518:	48 85 c0             	test   %rax,%rax
	  40051b:	74 0b                	je     400528 <__libc_start_main@plt+0xd8>
	  40051d:	5d                   	pop    %rbp
	  40051e:	bf 38 10 60 00       	mov    $0x601038,%edi
	  400523:	ff e0                	jmpq   *%rax
	  400525:	0f 1f 00             	nopl   (%rax)
	  400528:	5d                   	pop    %rbp
	  400529:	c3                   	retq   
	  40052a:	66 0f 1f 44 00 00    	nopw   0x0(%rax,%rax,1)
	  400530:	80 3d 09 0b 20 00 00 	cmpb   $0x0,0x200b09(%rip)        # 601040 <stdout@@GLIBC_2.2.5+0x8>
	  400537:	75 11                	jne    40054a <__libc_start_main@plt+0xfa>
	  400539:	55                   	push   %rbp
	  40053a:	48 89 e5             	mov    %rsp,%rbp
	  40053d:	e8 6e ff ff ff       	callq  4004b0 <__libc_start_main@plt+0x60>
	  400542:	5d                   	pop    %rbp
	  400543:	c6 05 f6 0a 20 00 01 	movb   $0x1,0x200af6(%rip)        # 601040 <stdout@@GLIBC_2.2.5+0x8>
	  40054a:	f3 c3                	repz retq 
	  40054c:	0f 1f 40 00          	nopl   0x0(%rax)
	  400550:	bf 20 0e 60 00       	mov    $0x600e20,%edi
	  400555:	48 83 3f 00          	cmpq   $0x0,(%rdi)
	  400559:	75 05                	jne    400560 <__libc_start_main@plt+0x110>
	  40055b:	eb 93                	jmp    4004f0 <__libc_start_main@plt+0xa0>
	  40055d:	0f 1f 00             	nopl   (%rax)
	  400560:	b8 00 00 00 00       	mov    $0x0,%eax
	  400565:	48 85 c0             	test   %rax,%rax
	  400568:	74 f1                	je     40055b <__libc_start_main@plt+0x10b>
	  40056a:	55                   	push   %rbp
	  40056b:	48 89 e5             	mov    %rsp,%rbp
	  40056e:	ff d0                	callq  *%rax
	  400570:	5d                   	pop    %rbp
	  400571:	e9 7a ff ff ff       	jmpq   4004f0 <__libc_start_main@plt+0xa0>
	  400576:	66 2e 0f 1f 84 00 00 	nopw   %cs:0x0(%rax,%rax,1)
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
	  4005b7:	48 8b 35 7a 0a 20 00 	mov    0x200a7a(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4005be:	bf 67 00 00 00       	mov    $0x67,%edi
	  4005c3:	e8 78 fe ff ff       	callq  400440 <_IO_putc@plt>
	  4005c8:	48 8b 35 69 0a 20 00 	mov    0x200a69(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4005cf:	bf 7b 00 00 00       	mov    $0x7b,%edi
	  4005d4:	e8 67 fe ff ff       	callq  400440 <_IO_putc@plt>
	  4005d9:	48 8b 35 58 0a 20 00 	mov    0x200a58(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4005e0:	bf 38 00 00 00       	mov    $0x38,%edi
	  4005e5:	e8 56 fe ff ff       	callq  400440 <_IO_putc@plt>
	  4005ea:	48 8b 35 47 0a 20 00 	mov    0x200a47(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4005f1:	bf 36 00 00 00       	mov    $0x36,%edi
	  4005f6:	e8 45 fe ff ff       	callq  400440 <_IO_putc@plt>
	  4005fb:	48 8b 35 36 0a 20 00 	mov    0x200a36(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400602:	bf 32 00 00 00       	mov    $0x32,%edi
	  400607:	e8 34 fe ff ff       	callq  400440 <_IO_putc@plt>
	  40060c:	48 8b 35 25 0a 20 00 	mov    0x200a25(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400613:	bf 31 00 00 00       	mov    $0x31,%edi
	  400618:	e8 23 fe ff ff       	callq  400440 <_IO_putc@plt>
	  40061d:	48 8b 35 14 0a 20 00 	mov    0x200a14(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400624:	bf 66 00 00 00       	mov    $0x66,%edi
	  400629:	e8 12 fe ff ff       	callq  400440 <_IO_putc@plt>
	  40062e:	48 8b 35 03 0a 20 00 	mov    0x200a03(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400635:	bf 66 00 00 00       	mov    $0x66,%edi
	  40063a:	e8 01 fe ff ff       	callq  400440 <_IO_putc@plt>
	  40063f:	48 8b 35 f2 09 20 00 	mov    0x2009f2(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400646:	bf 64 00 00 00       	mov    $0x64,%edi
	  40064b:	e8 f0 fd ff ff       	callq  400440 <_IO_putc@plt>
	  400650:	48 8b 35 e1 09 20 00 	mov    0x2009e1(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400657:	bf 62 00 00 00       	mov    $0x62,%edi
	  40065c:	e8 df fd ff ff       	callq  400440 <_IO_putc@plt>
	  400661:	48 8b 35 d0 09 20 00 	mov    0x2009d0(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400668:	bf 63 00 00 00       	mov    $0x63,%edi
	  40066d:	e8 ce fd ff ff       	callq  400440 <_IO_putc@plt>
	  400672:	48 8b 35 bf 09 20 00 	mov    0x2009bf(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400679:	bf 35 00 00 00       	mov    $0x35,%edi
	  40067e:	e8 bd fd ff ff       	callq  400440 <_IO_putc@plt>
	  400683:	48 8b 35 ae 09 20 00 	mov    0x2009ae(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  40068a:	bf 36 00 00 00       	mov    $0x36,%edi
	  40068f:	e8 ac fd ff ff       	callq  400440 <_IO_putc@plt>
	  400694:	48 8b 35 9d 09 20 00 	mov    0x20099d(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  40069b:	bf 39 00 00 00       	mov    $0x39,%edi
	  4006a0:	e8 9b fd ff ff       	callq  400440 <_IO_putc@plt>
	  4006a5:	48 8b 35 8c 09 20 00 	mov    0x20098c(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4006ac:	bf 38 00 00 00       	mov    $0x38,%edi
	  4006b1:	e8 8a fd ff ff       	callq  400440 <_IO_putc@plt>
	  4006b6:	48 8b 35 7b 09 20 00 	mov    0x20097b(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4006bd:	bf 38 00 00 00       	mov    $0x38,%edi
	  4006c2:	e8 79 fd ff ff       	callq  400440 <_IO_putc@plt>
	  4006c7:	48 8b 35 6a 09 20 00 	mov    0x20096a(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4006ce:	bf 32 00 00 00       	mov    $0x32,%edi
	  4006d3:	e8 68 fd ff ff       	callq  400440 <_IO_putc@plt>
	  4006d8:	48 8b 35 59 09 20 00 	mov    0x200959(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4006df:	bf 39 00 00 00       	mov    $0x39,%edi
	  4006e4:	e8 57 fd ff ff       	callq  400440 <_IO_putc@plt>
	  4006e9:	48 8b 35 48 09 20 00 	mov    0x200948(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4006f0:	bf 33 00 00 00       	mov    $0x33,%edi
	  4006f5:	e8 46 fd ff ff       	callq  400440 <_IO_putc@plt>
	  4006fa:	48 8b 35 37 09 20 00 	mov    0x200937(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400701:	bf 39 00 00 00       	mov    $0x39,%edi
	  400706:	e8 35 fd ff ff       	callq  400440 <_IO_putc@plt>
	  40070b:	48 8b 35 26 09 20 00 	mov    0x200926(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400712:	bf 37 00 00 00       	mov    $0x37,%edi
	  400717:	e8 24 fd ff ff       	callq  400440 <_IO_putc@plt>
	  40071c:	48 8b 35 15 09 20 00 	mov    0x200915(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400723:	bf 64 00 00 00       	mov    $0x64,%edi
	  400728:	e8 13 fd ff ff       	callq  400440 <_IO_putc@plt>
	  40072d:	48 8b 35 04 09 20 00 	mov    0x200904(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400734:	bf 39 00 00 00       	mov    $0x39,%edi
	  400739:	e8 02 fd ff ff       	callq  400440 <_IO_putc@plt>
	  40073e:	48 8b 35 f3 08 20 00 	mov    0x2008f3(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400745:	bf 37 00 00 00       	mov    $0x37,%edi
	  40074a:	e8 f1 fc ff ff       	callq  400440 <_IO_putc@plt>
	  40074f:	48 8b 35 e2 08 20 00 	mov    0x2008e2(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400756:	bf 37 00 00 00       	mov    $0x37,%edi
	  40075b:	e8 e0 fc ff ff       	callq  400440 <_IO_putc@plt>
	  400760:	48 8b 35 d1 08 20 00 	mov    0x2008d1(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400767:	bf 36 00 00 00       	mov    $0x36,%edi
	  40076c:	e8 cf fc ff ff       	callq  400440 <_IO_putc@plt>
	  400771:	48 8b 35 c0 08 20 00 	mov    0x2008c0(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400778:	bf 37 00 00 00       	mov    $0x37,%edi
	  40077d:	e8 be fc ff ff       	callq  400440 <_IO_putc@plt>
	  400782:	48 8b 35 af 08 20 00 	mov    0x2008af(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400789:	bf 61 00 00 00       	mov    $0x61,%edi
	  40078e:	e8 ad fc ff ff       	callq  400440 <_IO_putc@plt>
	  400793:	48 8b 35 9e 08 20 00 	mov    0x20089e(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  40079a:	bf 63 00 00 00       	mov    $0x63,%edi
	  40079f:	e8 9c fc ff ff       	callq  400440 <_IO_putc@plt>
	  4007a4:	48 8b 35 8d 08 20 00 	mov    0x20088d(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4007ab:	bf 31 00 00 00       	mov    $0x31,%edi
	  4007b0:	e8 8b fc ff ff       	callq  400440 <_IO_putc@plt>
	  4007b5:	48 8b 35 7c 08 20 00 	mov    0x20087c(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4007bc:	bf 33 00 00 00       	mov    $0x33,%edi
	  4007c1:	e8 7a fc ff ff       	callq  400440 <_IO_putc@plt>
	  4007c6:	48 8b 35 6b 08 20 00 	mov    0x20086b(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4007cd:	bf 64 00 00 00       	mov    $0x64,%edi
	  4007d2:	e8 69 fc ff ff       	callq  400440 <_IO_putc@plt>
	  4007d7:	48 8b 35 5a 08 20 00 	mov    0x20085a(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4007de:	bf 62 00 00 00       	mov    $0x62,%edi
	  4007e3:	e8 58 fc ff ff       	callq  400440 <_IO_putc@plt>
	  4007e8:	48 8b 35 49 08 20 00 	mov    0x200849(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  4007ef:	bf 33 00 00 00       	mov    $0x33,%edi
	  4007f4:	e8 47 fc ff ff       	callq  400440 <_IO_putc@plt>
	  4007f9:	48 8b 35 38 08 20 00 	mov    0x200838(%rip),%rsi        # 601038 <stdout@@GLIBC_2.2.5>
	  400800:	bf 7d 00 00 00       	mov    $0x7d,%edi
	  400805:	48 83 c4 08          	add    $0x8,%rsp
	  400809:	e9 32 fc ff ff       	jmpq   400440 <_IO_putc@plt>
	  40080e:	66 90                	xchg   %ax,%ax
	  400810:	41 57                	push   %r15
	  400812:	41 56                	push   %r14
	  400814:	41 89 ff             	mov    %edi,%r15d
	  400817:	41 55                	push   %r13
	  400819:	41 54                	push   %r12
	  40081b:	4c 8d 25 ee 05 20 00 	lea    0x2005ee(%rip),%r12        # 600e10 <__libc_start_main@plt+0x2009c0>
	  400822:	55                   	push   %rbp
	  400823:	48 8d 2d ee 05 20 00 	lea    0x2005ee(%rip),%rbp        # 600e18 <__libc_start_main@plt+0x2009c8>
	  40082a:	53                   	push   %rbx
	  40082b:	49 89 f6             	mov    %rsi,%r14
	  40082e:	49 89 d5             	mov    %rdx,%r13
	  400831:	4c 29 e5             	sub    %r12,%rbp
	  400834:	48 83 ec 08          	sub    $0x8,%rsp
	  400838:	48 c1 fd 03          	sar    $0x3,%rbp
	  40083c:	e8 cf fb ff ff       	callq  400410 <_IO_putc@plt-0x30>
	  400841:	48 85 ed             	test   %rbp,%rbp
	  400844:	74 20                	je     400866 <__libc_start_main@plt+0x416>
	  400846:	31 db                	xor    %ebx,%ebx
	  400848:	0f 1f 84 00 00 00 00 	nopl   0x0(%rax,%rax,1)
	  40084f:	00 
	  400850:	4c 89 ea             	mov    %r13,%rdx
	  400853:	4c 89 f6             	mov    %r14,%rsi
	  400856:	44 89 ff             	mov    %r15d,%edi
	  400859:	41 ff 14 dc          	callq  *(%r12,%rbx,8)
	  40085d:	48 83 c3 01          	add    $0x1,%rbx
	  400861:	48 39 eb             	cmp    %rbp,%rbx
	  400864:	75 ea                	jne    400850 <__libc_start_main@plt+0x400>
	  400866:	48 83 c4 08          	add    $0x8,%rsp
	  40086a:	5b                   	pop    %rbx
	  40086b:	5d                   	pop    %rbp
	  40086c:	41 5c                	pop    %r12
	  40086e:	41 5d                	pop    %r13
	  400870:	41 5e                	pop    %r14
	  400872:	41 5f                	pop    %r15
	  400874:	c3                   	retq   
	  400875:	90                   	nop
	  400876:	66 2e 0f 1f 84 00 00 	nopw   %cs:0x0(%rax,%rax,1)
	  40087d:	00 00 00 
	  400880:	f3 c3                	repz retq 

	Disassembly of section .fini:

	0000000000400884 <.fini>:
	  400884:	48 83 ec 08          	sub    $0x8,%rsp
	  400888:	48 83 c4 08          	add    $0x8,%rsp
	  40088c:	c3                   	retq   


So there seems to be a large chunk of a function with a huge amout of `putc` calls. The `main` function, as we can see is totally empty and there are no branches anywhere. So we see that our solution must be in this putc calling function. Let us try to call it.

	$ gdb ./message
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
	Reading symbols from ./message...(no debugging symbols found)...done.
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

	Breakpoint 2, __GI__IO_putc (c=108, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=97, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=103, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=123, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=56, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=54, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=50, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=49, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=102, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=102, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=100, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=98, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=99, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=53, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=54, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=57, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=56, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=56, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=50, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=57, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=51, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=57, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=55, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=100, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=57, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=55, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=55, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=54, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=55, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=97, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=99, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=49, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=51, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=100, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=98, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

	Breakpoint 2, __GI__IO_putc (c=51, fp=0x7ffff7dd2620 <_IO_2_1_stdout_>) at putc.c:25
	25	in putc.c
	(gdb) c
	Continuing.

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
