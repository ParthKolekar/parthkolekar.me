---
title: Find The Idiot
date: 2016-02-13 10:13 UTC
tags: 
  - ctf
  - forensics
---

> Your friend Bob, is an expert penetration tester. 
>
> He loves solving and creating puzzles. 
>
> He is invited by Pied Diaper Inc. for some testing. 
>
> You join him for this technical expedition.  At the site, you watch 
>
> him work for a few minutes, when he exclaims, "What an idiot!". Then,
>
> he looks at you with a with a playful gaze. 
>
> Then, handing out a flash drive to you he says, "Find the idiotic user".
>
> Link: [Here](2016-02-13-find-the-idiot/find-the-idiot.zip){:target="_blank"}

## Write-up

by [ParthKolekar](https://github.com/ParthKolekar){:target="_blank"}

This is a straight forward question. You are given a zip file containing the
entire filesystem dumps for the users. You have to run a dictionary attack on the
shadow file.

The attack reveals that user `gohan` has password `dragon1`. 

The flag is `dragon1`.
