---
title: Important Anime Information
date: 2017-04-18 13:04 UTC
tags: 
  - ctf 
  - forensics
  - stegno
  - parted
  - kpartx
  - exif
featured: true
---

There is some really important anime information that I want to tell you guys. You absolutely definitely need to know this. It is a matter of life or death.

Find the information.

- Flag Format /{FLAG : .+}/

Note: Some tools that you might use will mess up the file and also your system. Root Responsible.

- Category : forensics

Provided [important-anime-information](2017-04-18-important-anime-information/important-anime-information)

Solution
========

    $ file important-anime-information
    important-anime-information: DOS/MBR boot sector; partition 1 : ID=0xee, start-CHS (0x0,0,1), end-CHS (0x3ff,254,63), startsector 1, 154756 sectors, extended partition table (last)

Whoa... Fancy....
In Linux... everything is a file. Your RAM is a file, your Rem is a file, your Emilia is a file, also your hard disk is a file and your harddisk partitions are files.

The above is a disk image. You should not mistake it for a partition image. Partition images are more or less file system copies. (Subject to change with respect to tools used, and assumptions made by the user.). This contains a partition table and some partitions, and each partition will have it's own file system.

The partition table here is a MBR partition, and judging by the size, it is expected to have quite a few interesting items.

    $ parted important-anime-information
    WARNING: You are not superuser.  Watch out for permissions.
    GNU Parted 3.2
    Using /home/parth/projects/slash-blog/media/important-anime-information/important-anime-information
    Welcome to GNU Parted! Type 'help' to view a list of commands.
    (parted) print
    Model:  (file)
    Disk /home/parth/projects/slash-blog/media/important-anime-information/important-anime-information: 79.2MB
    Sector size (logical/physical): 512B/512B
    Partition Table: gpt
    Disk Flags:

    Number  Start   End     Size    File system  Name                              Flags
    1      1049kB  2097kB  1049kB               e529a9cea4a728eb9c5828b13b22844c
    2      2097kB  3146kB  1049kB               3691308f2a4c2f6983f2880d32e29c84
    3      3146kB  4194kB  1049kB               e0a0862398ccf49afa6c809d3832915c
    4      4194kB  5243kB  1049kB               eeec033a2c4d56d7ba16b69358779091
    5      5243kB  6291kB  1049kB               e265492707dd0595fd1f399bb8a2690e
    6      6291kB  7340kB  1049kB               4d682ec4eed27c53849758bc13b6e179
    7      7340kB  8389kB  1049kB               0674272bac0715f803e382b5aa437e08
    8      8389kB  9437kB  1049kB               5f02f0889301fd7be1ac972c11bf3e7d
    9      9437kB  10.5MB  1049kB               12eccbdd9b32918131341f38907cbbb5
    10      10.5MB  11.5MB  1049kB               952988da97fbd8f2ea65990c03eac425
    11      11.5MB  12.6MB  1049kB               12eccbdd9b32918131341f38907cbbb5
    12      12.6MB  13.6MB  1049kB               5059a07a66618dd8b856fc0ffb31975a
    13      13.6MB  14.7MB  1049kB               f05a225e14ff5e194a8eef0c6990cefb

Here, we see two things of note.

* There are interesting labels as partition names.
* There are things missing here. Because the sizes don't simply add up.

Let's see what our buddy [crackstation](https://crackstation.net/) has to say...

    e529a9cea4a728eb9c5828b13b22844c	md5	pa
    3691308f2a4c2f6983f2880d32e29c84	md5	ss
    e0a0862398ccf49afa6c809d3832915c	md5	wo
    eeec033a2c4d56d7ba16b69358779091	md5	rd
    e265492707dd0595fd1f399bb8a2690e	Unknown	Not found.
    4d682ec4eed27c53849758bc13b6e179	md5	ts
    0674272bac0715f803e382b5aa437e08	md5	un
    5f02f0889301fd7be1ac972c11bf3e7d	md5	de
    12eccbdd9b32918131341f38907cbbb5	md5	re
    952988da97fbd8f2ea65990c03eac425	Unknown	Not found.
    12eccbdd9b32918131341f38907cbbb5	md5	re
    5059a07a66618dd8b856fc0ffb31975a	Unknown	Not found.
    f05a225e14ff5e194a8eef0c6990cefb	md5	ic

Fancy... We have text. And all of it is 2 characters long. We also have some hashes which crackstation was unable to give to us.

Let us assume those will be of two characters too, and brute force it for a while...

We get the text...

    password: tsundere are nice

This does not match the file format, so we need to move on. 

Since the space did not add up, we can assume a deleted partition and work on it.

We use the motherlode of all disk recovery tools. Humbly named testdisk.
.
.
.

Hey! It found a partition. There is an ext4 in here. Let's mount it.

To mount a disk, which is actually a file, we need to do some kernel magic. We need to map a device to this file, by which the kernel
can recognize the partitions within, and so that we are able to read this. Linux provides a loop device, which you can map to files.

kpartx uses the newer fancy device-mapper to do this for us.

    $ kpartx -av important-anime-information
    add map loop3p1 (252:5): 0 124928 linear 7:3 28672

It mapped the found partition to loop3p1. Great. Testdisk also found nothing of use on our other partitions, so it kinda nuked them. :(

    $ mount /dev/mapper/loop3p1 /mnt
    $ cd /mnt
    $ ls
    lost+found  hax0r_file

Fancy file names. Let's see what it is.

    $ file hax0r_file
    hax0r_file: PNG image data, 1912 x 1017, 8-bit/color RGBA, non-interlaced

A png file. Of a large height and width. Seems interesting. Opening it shows a terminal running quite a bit of commands, with my one true love Emilia in the background. Before I kick out the stegsolve, It is imperative to first check the file for other data in it.

    $ binwalk hax0r_file

    DECIMAL       HEXADECIMAL     DESCRIPTION
    --------------------------------------------------------------------------------
    0             0x0             PNG image, 1912 x 1017, 8-bit/color RGBA, non-interlaced
    100           0x64            Zlib compressed data, default compression
    1803304       0x1B8428        Zip archive data, encrypted at least v1.0 to extract, compressed size: 236, uncompressed size: 224, name: key-required.zip
    1803716       0x1B85C4        End of Zip archive

Woohoo! We find a zip file. Let's extract it pronto, and see what's in it.

    $ foremost hax0r_file
    Processing: hax0r_file
    |foundat=key-required.zipUT
    *|


    $ unzip output/zip/00003522.zip
    Archive:  output/zip/00003522.zip
    [output/zip/00003522.zip] key-required.zip password:

Let's try the password that we found already.

    $ unzip output/zip/00003522.zip
    Archive:  output/zip/00003522.zip
    [output/zip/00003522.zip] key-required.zip password:
    extracting: key-required.zip

Awesome. That worked. We get another zip. Let's try to extract that one.

    $ unzip key-required.zip
    Archive:  key-required.zip
    [key-required.zip] flag.txt password:

Guess that we need another password. Time to bring out the stegsolve after all. But still we have no luck. Where else could the password be?

Could it be in the hax0r_file? Or did we miss anything in important-anime-information? Let's see the file from a different angle.

    $ strings hax0r_file 
    HDR
    sBIT
    tEXtSoftware
    key: kuudere are nicerak
    IDATx
    BzeR

Yay! We found a key. But where did that come from? PNG along with other file formats have support for a EXIF meta data.

    $ exiftool hax0r_file
    ...
    Interlace                       : Noninterlaced
    Significant Bits                : 8 8 8 8
    Software                        : key: kuudere are nicer
    Warning                         : [minor] Trailer data after PNG IEND chunk
    Image Size                      : 1912x1017
    ...

So we now have a key. Let's send it to our key-required.zip.

    $ unzip key-required.zip
    Archive:  key-required.zip
    [key-required.zip] flag.txt password:
    password incorrect--reenter:
     extracting: flag.txt

Woohoo! And behind door number one is...

    $ cat flag.txt
    {FLAG : yandere are the best}

As an alternative, quite a few people tried to binwalk on the zip. That obtained the hax0r file but missed out on the first flag.

Flag
====
yandere are the best
