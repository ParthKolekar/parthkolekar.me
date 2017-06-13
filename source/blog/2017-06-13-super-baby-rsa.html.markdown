---
title: Super Baby RSA
date: 2017-06-13 16:04 UTC
tags: 
  - ctf
  - crypto
  - rsa
---

Time for RSA!

e = 65537

n = 134023913680045880492110426626164090971954352532495944119602241841766743315344885078078359876157853261789964632342961459801834169156073972150056251259429043527344585589350222304649100454018523375146422111308080990153227407607374257909945989989405880451908900962388521742688809203045971595430040363546058882461

c = 28029822339281125656746130462465126562337695724847502110361462137424051877785282190017747622367185811734822848358173889752744532793526865170001730008026265012114272142868291439355242497819138690415609825725896275747305098862360965342890612304634184172461662826694263502110523984165435588581876100119126419239

p = 10982621221489294931830537773519582919197608543135586716536756890800033254598710943732068869355188441831549541090720220093538940987353399632224377192068317

Flag Format: /flag{.+}/

Solution
--------

RSA is a cryptosystem which allows for secure data transmission. RSA mangles
the `plain text` in a form that makes it `undecipherable` to people without the
key, while making it much easier for people with a key to open it and get back
the message. 

The mathematics is out of the scope of this article, I would encourage a 
serious reading on your own to figure it out. 

The steps to generate a RSA key is as follows.

- Generate two large prime numbers `p`, and `q`. 
- `n` = `p` * `q`. 
- `e` is a number co-prime to `n` and 1 < `e` < `n`
- `d` = `1 / e mod (p - 1)(q - 1)`

The `1 / e` in this case, should not be confused with division. It is the 
`inverse_modulo` operation, I.E. `d` is the number, which when multiplied with
`e` has the following relation. 

	ed = 1 mod (p - 1)(q - 1)

This notation will also be confusing for a newbie to modular arithmatic.
What this means is that

	(e * d) mod (p - 1)(q - 1) = 1

The public key consists of `n` and `e`. The secret key consists of the rest.
Namely, `d`, `p`, `q`. 

The security of RSA relies on the one-way trap function of multiplication. 
Which means that for a function `f`

	f((x, y)) = x * y | x, y ∈ Z

It is easy enough to go from `(x, y)` to `x * y` (multiplication). But is is 
far more difficult to go from `x * y` to `(x, y)` (factorization). 

The encryption for an message, converted to an integer form, `m` is given as... 

	c = RSA_e_n(m) = m ^ e mod n

`c` is the cipher text. `RSA_e_n` is a notation used to denote that the RSA
parameters of `e`, and `n` are constant and a feature of RSA instead of being
a part of the arguments to a RSA function.

To get back the `m` from the `c` we require the presence of `d`, which is a good
hint as to why it is a part of the  `private` key in the first place. 

	m' = inverse_RSA_e_n_d(c) = c ^ d mod n

It is also now interesting to note why `p` and `q` are part of the `private`
key. That comes because if you have either of `p` or `q`, generating a `d` 
for the RSA key is trivial. Because you can easily find the other factor, and 
quickly generate the `d` via doing a modular_inverse operation of e on base of 
(p - 1) * (q - 1). 

Once `d` is obtained, decryption can be done since you now have the key. 

Since this is the introductory RSA problem, I am kind enough to give the `p`
directly, which means that this RSA is totally broken.

I also give the following number to integer conversion scheme. 

	A -> 0x41 = 64
	AA -> 0x4141 = 16705
	AAAAAA -> 0x4141414141 = 280267669825

Which basically says that the number is converted to a hexadecimal representation,
and then the hexadecimal is intepreted as an ASCII string. 

So now, it's time for some `sage`. Sage Math is a number crunching library with
a ton of useful functions built-in.

There are many alternatives give, but it is a personal preference of quite a few 
people to use sage, and it is not without reason. 

~~~ python
e = 65537
n = 134023913680045880492110426626164090971954352532495944119602241841766743315344885078078359876157853261789964632342961459801834169156073972150056251259429043527344585589350222304649100454018523375146422111308080990153227407607374257909945989989405880451908900962388521742688809203045971595430040363546058882461
c = 28029822339281125656746130462465126562337695724847502110361462137424051877785282190017747622367185811734822848358173889752744532793526865170001730008026265012114272142868291439355242497819138690415609825725896275747305098862360965342890612304634184172461662826694263502110523984165435588581876100119126419239
p = 10982621221489294931830537773519582919197608543135586716536756890800033254598710943732068869355188441831549541090720220093538940987353399632224377192068317

q = n / p

d = inverse_mod(e, (p - 1) * (q - 1))

m = pow(c, d, n)

print(m)
~~~

This prints out `240545625414703578862070172273428889513126431163886829837844391499244541180606084628879027055096318636117555581`.

Converting this to integer is done by.

~~~ python
print(bytes.fromhex(hex(240545625414703578862070172273428889513126431163886829837844391499244541180606084628879027055096318636117555581)[2:]))
~~~ 

Which prints out `b'flag{breaking_rsa_is_easy_if_you_know_the_key}'`. Which is the flag.

Flag
----
flag{breaking_rsa_is_easy_if_you_know_the_key}
