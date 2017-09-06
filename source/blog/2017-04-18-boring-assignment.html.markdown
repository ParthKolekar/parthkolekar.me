---
title: Boring Assignment
date: 2017-04-18 13:44 UTC
tags:
  - ctf
  - forensics
  - crypto
  - python
featured: true
---

There was once a guy,
who hadn't anything to do.
So he made haiku.

CTF question,
related to cryptography,
he presents to you.

Solve you can or not,
you must at least try or else,
you disappoint him.

- Flag Format : /FLAG[A-Z]+/

Provided [boring-assignment](2017-04-18-boring-assignment/boring-assignment)

Hint: Cipher used is a really popular cipher.

Solution
--------

Starting this with the usual.

    $ file boring-assignment
    boring-assignment: data

Huh... Nothing. Ok... Let us open this file and see what it is.

    $ cat boring-assignment

    <Redacted Binary>
    ./a.py
    <listcomp>s
    dSdS)Nr)
    plain_textarr<module>
    <Redacted Binary>

Ok... So now we are getting somewhere. This has some interesting characters. The ./a.py catches my eye. As does the <listcomp>, <module> tags. This is quite plainly a python object compiled file. These can be decompiled.

    $ cp boring-assignment boring-assignment.pyc

    $ uncompyle6 boring-assignment.pyc
    # uncompyle6 version 2.9.10
    # Python bytecode 3.5 (3350)
    # Decompiled from: Python 3.5.2 (default, Nov 17 2016, 17:05:23) 
    # [GCC 5.4.0 20160609]
    # Embedded file name: ./a.py
    # Compiled at: 2017-03-26 02:56:19
    # Size of source mod 2**32: 298 bytes
    cipher_text = ''.join([chr(x) for x in [80, 80, 89, 81, 71, 80, 73, 84, 82, 89, 86, 67, 65, 89, 71, 66, 73, 81, 68, 76, 67, 69, 87, 67, 89, 74, 75, 75, 88, 70, 79, 81, 89, 68, 77, 65, 67]])

    def decrypt(cipher_text=None):
        if not cipher_text:
            return


    plain_text = decrypt(cipher_text)
    # okay decompiling boring-assignment.pyc

Woohoo! We now have a source. And there seems to be a python function here. That gives us a cipher text. And a template for a decrypt function, which gives us a nothing.

Let's see what the cipher text is. The program seems kind enough to join it into a string for us. 

~~~python
    In [1]: cipher_text
    Out[1]: 'PPYQGPITRYVCAYGBIQDLCEWCYJKKXFOQYDMAC'
~~~

So... Weird cipher_text. It is too readable. Seems like a simple shift cipher or a substitution cipher. Substitution ciphers generally provide more text for frequency analysis, so we can try a shift cipher.

I quickly whip up a code for shift cipher, and fire it up.

~~~python
    In [9]: def shift_cipher(n, cipher):
       ...:     d = {}
       ...:     for i in range(0, len(string.ascii_uppercase)):
       ...:         d[string.ascii_uppercase[i]] = string.ascii_uppercase[(i + n) % len(string.ascii_uppercase)]
       ...:     print("".join([d[x] for x in cipher]))
       ...:     
       ...:     
       ...:     

    In [10]: for i in range(26):
        ...:     shift_cipher(i, cipher_text)
        ...:     
    PPYQGPITRYVCAYGBIQDLCEWCYJKKXFOQYDMAC
    QQZRHQJUSZWDBZHCJREMDFXDZKLLYGPRZENBD
    RRASIRKVTAXECAIDKSFNEGYEALMMZHQSAFOCE
    SSBTJSLWUBYFDBJELTGOFHZFBMNNAIRTBGPDF
    TTCUKTMXVCZGECKFMUHPGIAGCNOOBJSUCHQEG
    UUDVLUNYWDAHFDLGNVIQHJBHDOPPCKTVDIRFH
    VVEWMVOZXEBIGEMHOWJRIKCIEPQQDLUWEJSGI
    WWFXNWPAYFCJHFNIPXKSJLDJFQRREMVXFKTHJ
    XXGYOXQBZGDKIGOJQYLTKMEKGRSSFNWYGLUIK
    YYHZPYRCAHELJHPKRZMULNFLHSTTGOXZHMVJL
    ZZIAQZSDBIFMKIQLSANVMOGMITUUHPYAINWKM
    AAJBRATECJGNLJRMTBOWNPHNJUVVIQZBJOXLN
    BBKCSBUFDKHOMKSNUCPXOQIOKVWWJRACKPYMO
    CCLDTCVGELIPNLTOVDQYPRJPLWXXKSBDLQZNP
    DDMEUDWHFMJQOMUPWERZQSKQMXYYLTCEMRAOQ
    EENFVEXIGNKRPNVQXFSARTLRNYZZMUDFNSBPR
    FFOGWFYJHOLSQOWRYGTBSUMSOZAANVEGOTCQS
    GGPHXGZKIPMTRPXSZHUCTVNTPABBOWFHPUDRT
    HHQIYHALJQNUSQYTAIVDUWOUQBCCPXGIQVESU
    IIRJZIBMKROVTRZUBJWEVXPVRCDDQYHJRWFTV
    JJSKAJCNLSPWUSAVCKXFWYQWSDEERZIKSXGUW
    KKTLBKDOMTQXVTBWDLYGXZRXTEFFSAJLTYHVX
    LLUMCLEPNURYWUCXEMZHYASYUFGGTBKMUZIWY
    MMVNDMFQOVSZXVDYFNAIZBTZVGHHUCLNVAJXZ
    NNWOENGRPWTAYWEZGOBJACUAWHIIVDMOWBKYA
    OOXPFOHSQXUBZXFAHPCKBDVBXIJJWENPXCLZB
~~~

So... Nothing. However if we now see the flag format, and take a look at the hint provided, two things become clear.

* It is a historically used cipher
* The plaintext begins with FLAG

This rules out mono-aliphatic substitution ciphers (because cipher text begins with two P's).
And also reduces the chance of a poly-aliphatic substitution cipher. Because we don't have any more information, and this given information is incomplete.

One cipher comes to mind which maps each character to different characters. It is also quite well known. The Vigenère cipher. A pretty nice website for decoding such a cipher is [here](http://www.dcode.fr/vigenere-cipher).

It even gives us an exact solution for our case, where we presumably know the first word of the series. We feed it the values, and it spits out the following.

Plain Text: FLAGCRYPTOREQUIRESTHEUSEOFMATHEMATICS

Cipher Key : KEY

Alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ

The flag is CRYPTOREQUIRESTHEUSEOFMATHEMATICS

Flag
----

CRYPTOREQUIRESTHEUSEOFMATHEMATICS
