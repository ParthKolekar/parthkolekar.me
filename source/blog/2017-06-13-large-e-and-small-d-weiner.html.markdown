---
title: Large e and Small d (Weiner)
date: 2017-06-13 18:21 UTC
tags: 
  - ctf
  - crypto
  - rsa
  - Weiner
---

c = 49938873005546615435687311504872509785022284769848698526216639826561007249140360312632267256915204926681345807364733487154803200306964789424438457669341375204871001335059277860364152540205309441986059468568646721718475252818788849738581432943901958543446753508706429359356503196241596325655490713282416769960

n = 142269281344535869088742736116943280058390173908199123033731860167637256284058438570026290267171503564593144579038791106258246936460019066646984380347557856973633574180883795126232851811359705463053986537018379016661776217821802817244947657640746566344862496416333791072979037570103637215724467194819497299907

e = 141211410131186565836904979237284528246734880966191156417995210689827710794052151990500502219902268625710499228242391963419318931769810679560221659007691633465075476338925509588659989483348207094645823751037728970137889820529978911004235927900663723568956034787737608209610740379437975880462460234131696007491

Find the flag.

Solution
--------

The RSA parameter `e` can be chosen at will, however there are some values of 
`e` for which the resulting `d` will become very small. In the above example,
for instance, the `e` is comparable to the size of `n`. 

For a choice of parameters as this, the RSA has been broken, and in particular,
this attack for a large `e` which results in a computably small `d` is called 
as Weiner's attack. 

This procedure works out by trying the Euler totient function via a continued
fraction approximation of e / N.

How this works exactly, I don't really know. 

The implementation part, however is as follows. 

Copied shamelessly from [15 ways to break RSA security - Renaud Lifchitz](https://speakerdeck.com/rlifchitz/15-ways-to-break-rsa-security)

~~~ python
for f in continued_fraction(e/n).convergents():
    k, d = f.numerator(), f.denominator()
    if k:
        psi2 = int((e * d - 1) / k)
        a, b, c = 1, -(n - psi2 + 1), n
        delta = b * b - 4 * a * c
        if is_square(delta):
            p, q = (-b - sqrt(delta)) / 2 * a, (-b + sqrt(delta)) / 2 * a
            print(p, q)
~~~

This gives us `p` and `q`.

On breaking RSA as usual, gives us a small `d` = `4669523849932130508876392554713407521319117239637943224980015676156491`

It also gives us the flag.

~~~ python
print(bytes.fromhex(hex(pow(c, d, n))[2:]))
b'flag{overlarge_numbers_might_reveal_large_flaws}'
~~~

Flag
----
flag{overlarge_numbers_might_reveal_large_flaws}