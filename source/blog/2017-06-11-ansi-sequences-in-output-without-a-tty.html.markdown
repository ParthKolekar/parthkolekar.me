---
title: ANSI Sequences in Output Without a TTY
date: 2017-06-11 15:12 UTC
tags: 
  - sysadmin
  - ansi
  - colors
  - bundler
featured: true
---

ANSI Sequences or ansi escape codes are special formatting characters used to 
inform a receiving terminal about special colors and formatting to use when 
displaying text. These sequences still remain in use to this day, with a lot of
utilities supporting the representation of text.

I ran into a problem `bundler` when setting up my git-hook based deployment of 
this blog. The problem was simple. 

![image1.png](2017-06-11-ansi-sequences-in-output-without-a-tty/image1.png)

This has color. 

![image2.png](2017-06-11-ansi-sequences-in-output-without-a-tty/image2.png)

This does not. 

What bundler does is that when the output of the command is set to a pipe, the
command quite understandably neglects to output the required ansi sequences to
render things with color. 

This is the behavior of quite a few other software too. This is done so that 
software that are unaware of ANSI do not trip and get confused seeing this new
text representation. Coreutils, for example does this too.

![image3.png](2017-06-11-ansi-sequences-in-output-without-a-tty/image3.png)

You can usually override this by asking the coreutils to explicity work it's 
ANSI coloring by an commandline option

![image4.png](2017-06-11-ansi-sequences-in-output-without-a-tty/image4.png)

In the specific example, of bundler, I found that it tried a stdout.isatty(),
which checks if the output is a tty or not.

ANSI Sequences?
---------------

The ANSI sequences in RAW form are just a series of characters. The following
value set to my PS1 shell variable causes shell to emit these special sequences
when giving me my prompt, which is intepretted as color by my 
terminal-emulator.

	\[\e]0;\u@\h: \w\a\]${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$

This is the ubuntu default color term PS1. This is interestingly *not* set 
unless you enable a certain `force_color_prompt` inside the `.bashrc`. 

This is the interesting part `\033[01;32m`. This causes the shell to output
a series of sequences of special note which the terminal emulator will then
colourize. 

	$ echo -e "\033[01;32m 12345 \n 12345"

In a `bash` shell, the above will generate yellow output. It will also forward
this color all the way to the remainder of your shell, and make it yellow too. 

The `\033[00m` resets the color back to the default. 

	$ echo -e "\033[01;32m 12345 \033[00m \n 12345"

This will cause your first line to be yellow and second to be in normal color.

There exist online, entire tables which allow you to colorize your terminal
as you so please. 

The important thing to look at here, is that the ANSI sequence is binary. The
`\033[01;31m` is a not printed on the screen with the rest of the output. 

It is consumed by the terminal-emulator to render your output in the required
formatting.

Needless to say, adding unexpected binary content is not generally favorable to 
do. And a lot of programs don't really appriciate it. Hence, by default, a lot
of applications will neglect to put it in the output when the output is not a 
terminal (or a pseudo-terminal). 

How to fix?
-----------

To force a output of ANSI, when the binary suspects the output will not be able 
to handle it, there usually is a toggle. `ls` has the `--color=force` option.

In a general program, if you want to force the program to emit ANSI, and in 
particular, allow the ANSI to be sent out even across pipes, you need to wrap
the program in a "wrapper", and make the binary think that it's output is
in fact being sent to a terminal, and hence it is safe to put ANSI. 

In my case, the `bundler` binary had it's output piped to me, but it is not sent
via a "terminal", and hence the output does not have the nice ANSI color sequences.

To fool `bundler` into adding ANSI sequences, I installed the handy `expect`
package.

	apt install expect

And I used the `unbuffer` from the package.

	unbuffer bundle update | cat

![image5.png](2017-06-11-ansi-sequences-in-output-without-a-tty/image5.png)

Aww yiss. Colors.

Why does it work?
-----------------

Un-buffer wraps about the program, and causes the output to not be buffered,
by doing this, it essentially emulates an interactive system. Which makes
`bundler` have no quaims about adding the ANSI in. 

In technical terms, the `isatty()` function for the stdout file descriptor 
returns true. This is because `unbuffer` uses `expect` to create a pseudo-tty
allocation and attaches it to the stdout of the child process.

The main purpose of `unbuffer` is to send some raw data over to the receiver 
without output bufferring, which it does and as a side effect, our ANSI remains
included, and this seems like decent solution to having colors without a TTY.

Especially for ssh based git hooks, because you don't have any way of creating
a tty there, and forcing a pseudo-tty allocation causes the `git` part to break.
