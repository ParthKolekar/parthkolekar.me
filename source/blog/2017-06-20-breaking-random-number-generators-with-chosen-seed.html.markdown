---
title: breaking-random-number-generators-with-chosen-seed
date: 2017-06-20 17:32 UTC
tags: 
  - ctf
  - crypto
  - misc
  - python
featured: true
---

Find the flag.

Source is as follows

~~~ python
#!/usr/bin/env python3

import random
import time
import string
import signal

# use secure seed
random.seed(int(time.time()))

with open('flag.txt') as f:
	flag = f.read()

# large constant prime
p = 174807157365465092731323561678522236549173502913317875393564963123330281052524687450754910240009920154525635325209526987433833785499384204819179549544106498491589834195860008906875039418684191252537604123129659746721614402346449135195832955793815709136053198207712511838753919608894095907732099313139446299843

# large constant generator
g = 41899070570517490692126143234857256603477072005476801644745865627893958675820606802876173648371028044404957307185876963051595214534530501331532626624926034521316281025445575243636197258111995884364277423716373007329751928366973332463469104730271236078593527144954324116802080620822212777139186990364810367977

# large secret key because safety is number one priority
a = random.randrange(1, p - 2)

print("A = ", pow(g, a, p))

# In 60 seconds, deliver a SIGALRM and terminate                  
signal.alarm(30)

_a = int(input("Now give me \"a\" back!\n"))

if a == _a:
	print("Nice!")
	print(flag)
else:
	print("Boo!")
~~~

Solution
--------

The prime, `p`, generator `g`, are given and an `a` is closen from the interval
`1` to `p - 2`. The user is asked to break the discrete log problem and find a
number `a`, with a given constant `g`, `p`, and `A`. Where 

	A = pow(g, a, p)

Normally, this sort of a problem would involve a weakness in the prime or a 
weakness in the choice of numbers used. However in this case, the numbers chosen
are relatively secure, and there was no brute-force attack which could solve the
problem in such a small time-frame. 

A decent suggestion that I heard was to randomly compute `a`, and the corresponding
`A` for a computable set of numbers, and run the script until we get lucky. This
could perhaps yeild results. 

However the primary flaw here was the usage of a bad seed. 

The seed is 

~~~ python
# use secure seed
random.seed(int(time.time()))
~~~

This is very, very bad to use for security. The reason being that you can now
find out exactly what the secret pseudo-random number generator will generate next
and you can do this deterministically. So as long as you are able to match the seed.

From the top of my memory, the time.time() returns a float, which is seconds
from unix epoch in a UTC timezone. This remains constant for all timezones too.

What's more is that I make it even easier... the seed is cast to int. So you don't 
even need to match the floating point seed generated, you just need to match it to the
closest integer second. 

Let's break it by re-using the same code itself. 

~~~ python
#!/usr/bin/env python3

import random
import time
import string

# use secure seed
random.seed(int(time.time()))

# large constant prime
p = 174807157365465092731323561678522236549173502913317875393564963123330281052524687450754910240009920154525635325209526987433833785499384204819179549544106498491589834195860008906875039418684191252537604123129659746721614402346449135195832955793815709136053198207712511838753919608894095907732099313139446299843

a = random.randrange(1, p - 2)

print(a)
~~~

Now we run this, and connect to the service at the same time.... Something 
interesting happens. We are able to find out what the randomly generated `a` is.
It takes a few tries to get the timing exact, but withing a few tries, I got my
answers.

	$ python solution.py # run in a different terminal
	58549141448034825724470421456086046263783009030305765315029214732103597725629643584640519564993686952460147424224499824237208320256710402644454885977843807235722331321468491704215402565594336151254611301385405568079284208008877673066349902012892511931129094269278697396028322758428218881094326448915019094908

	$ nc yuno.parthkolekar.me 1143
	A =  162845821762659164979308029502757300883569801448030678296035478772826604789837097465089145966790720159023736096828352235603744416863113902483466847601771758735899269752092426466070440647296490845779612629770248165661953834419624646583136868830812897675991836545617055134899212084666355607002046548367853130352
	Now give me "a" back!
	58549141448034825724470421456086046263783009030305765315029214732103597725629643584640519564993686952460147424224499824237208320256710402644454885977843807235722331321468491704215402565594336151254611301385405568079284208008877673066349902012892511931129094269278697396028322758428218881094326448915019094908
	Nice!
	flag{random number generators? Or did you break discrete log?}

Flag
----
flag{random number generators? Or did you break discrete log?}
