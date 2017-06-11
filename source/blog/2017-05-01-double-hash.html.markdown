---
title: Double Hash
date: 2017-05-01 23:05 UTC
tags:
  - ctf 
  - crypto
---

one fish twofish red fish blowfish

0xcaae8ee4f458ff776860e57141313e1e145423932e79e799d5133af8610e40d
94299046d28022d0b0efaa7fd3177b87e8e8530667111180e47da98f84846d753
cf9afa7c2635c93cf93ef8035b2217c05e192e3d2547e084c86085c2b83ef2b5


Solution
========

The hint says one fish twofish red fish blowfish. This is a vague hint. But it gives me two ciphers. twofish and blowfish. This is evident because the word "twofish" is a single word. The two hash functions can now be combined in a few different ways. If we call them h1 and h2, we can have the following.

* `h1(x) + h2(y)` => Addition 
	* This does not work. Because the addition of two hash functions will make it impossible to recover the original hash.

* `h1(x) | h2(y)` => Concatination
	* This is plausible. But look at the sizes of the hashes. For the concatination operation, the hash would be much much larger in size for a reasonably sized cipher text. 

* `h1(h2(x))` => Chaining
	* This is plausible too. And it also benefits from a single cipher text instead of the multiple texts for the other ones.

The 0x prefix explains that this is a hexadecimal.

Both these have a word prefixed to them. `one fish` twofish `red fish` blowfish. I try out what I get when I use these strings as the "key" for the ciphers. Since we don't have any additional information about any kind of initialization vectors, we can ignore them, and run the cipher under ECB mode. A hint was also added to make this obvious that ECB is to be done.

After trying a few combinations, we do end up with a valid output. 

Decryption of the cipher text with ECB, key `red fish`, and cipher `blowfish` gives us `d378383f7995e22f97ba3e88bd1eb97b68620c6d965c531e238ae40cfc8e73b75f7ae130215d0bb62d42f61dc3d71939`.

Decryption of this with key "one fish", and cipher "twofish" gives us the flag "one fish twofish red fish blowfish".

Flag
====
one fish twofish red fish blowfish

