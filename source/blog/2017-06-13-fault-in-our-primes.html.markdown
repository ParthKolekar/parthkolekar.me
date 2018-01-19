---
title: Fault in our Primes
date: 2017-06-13 18:24 UTC
tags: 
  - ctf
  - crypto
  - rsa
  - Fermat
---

c = 26191355940216514058828050272090150139390105143316571288916153959981987155364392954681002096093811060534927092859120901667895980558351695183915403894182364524347204398303912481028969683750214274848084070775246727321046148252133500795342545499148992521849021332747338401076716206206836615083856166994789822570460117243518366900792518256064537225383342326351881682268623120346344160800766471622876341688831087817377673995827709465873793531598458486278334606573583545504597466349568081151696945328172365621531283265041924009357925158333224321566901753418442265655624943219944771093126875477706910554618181364928356402397

n = 32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385831836629839931604913217189678592433570595407204979975197471265575262159281392120754939673496694769217137019932616744005961351912588355903082072668035686677658498973949178916826070183694275197585406793551975206643412017773626759006299241727738775594205159882555660007770314370476543983057729710165883222009486123

e = 65537

Fault in our primes.

Solution
--------

This is yet another fault in the RSA cryptography. This time, it is due to the
bad selection of primes, namely when primes are taken too close to each other.

In this case, Fermat's factorization can be used to factorize the number effectively.

The algorithm goes something like this...

- `p` and `q` are written as (`a` + `b`) and (`a` - `b`), for some numbers, `a` and `b`.
- `n` = `p` * `q` now becomes (`a` ** 2) - (`b` ** 2)
- Picking `a` = isqrt(`n`), we can brute force a little for a `a` that satisfies the condition
- This gives us the factors that we need.

~~~ python
while a <= n:
    b_2 = a * a - n
    if is_square(b_2):
        b = isqrt(b_2)
        p, q = a + b, a - b
        print(p, q)
        break
    a = a + 1
~~~

Using this, we can now break RSA. 

~~~ python
print(bytes.fromhex(hex(m)[2:]))
b'flag{if you used that online tool, fuck you Nemani!}'
~~~

This is a reference to a participant [Arjun](https://github.com/nemaniarjun) who found and used an online tool,
that solved all the common RSA types, and it annoyed me a fair bit.

Another method that was used by [Abhineet](https://github.com/AbhineetJain) was to find the `next_prime(isqrt(n))`,
and to repeat it until the p and q were found. 

Since `next_prime()` was what I used to generate two primes close to each other,
this method is a one-liner, and works quite nicely.

Flag
----
flag{if you used that online tool, fuck you Nemani!}
