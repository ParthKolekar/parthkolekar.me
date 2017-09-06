---
title: Foren-Steg
date: 2017-09-05 23:34 UTC
tags: 
  - ctf
  - forensics
  - stegno
  - zip
---

Find the flag, flag finder.
¯\_(ツ)_/¯

- Flag Format: /flag{.+}/

Provided [foren-steg.docx](2017-09-05-foren-steg/foren-steg.docx)

Solution
--------

The file provided to us appears to be a docx file. Let us see what happens 
when we try to open it.

There appears to be nothing in the file but gibberish. 

Maybe... the file is broken? We should try to fix it. A docx file format
is nothing but a fancy way to wrap XML into a zip file. Hence commonly used 
file recovery software attempt to do the same thing as zip file recovery
on the file.

Let us try that too. 

	$ zip -F --out foren-steg-fixed.docx foren-steg.docx
	Fix archive (-F) - assume mostly intact archive
		zip warning: bad archive - missing end signature
		zip warning: (If downloaded, was binary mode used?  If not, the
		zip warning:  archive may be scrambled and not recoverable)
		zip warning: Can't use -F to fix (try -FF)

	zip error: Zip file structure invalid (foren-steg.docx)

Well... that did not seem to work. 


But


The `zip` command has an extra flag toggle. `zip -FF` which says 

	When  doubled as in -FF, the archive is scanned from the beginning and zip 
	scans for special signatures to identify the limits between the archive 
	members. The single -F is more reliable if the archive is not too much damaged, 
	so try this option first.

This means that `zip -FF` reads the file, and attemps to recover based on magic
signatures and that the missing end signature is not required. It will attempt to
build that portion by itself.
It also says that `zip -F` is more reliable for minorly damaged files. But we 
already tried that, and it tells us that the zip central archive is broken. 

Let us try it out.

	$ zip -FF --out foren-steg-fixed.docx foren-steg.docx
	Fix archive (-FF) - salvage what can
		zip warning: Missing end (EOCDR) signature - either this archive
	                     is not readable or the end is damaged
	Is this a single-disk archive?  (y/n): y
	  Assuming single-disk archive
	Scanning for entries...
	  Found spanning marker, but did not expect split (multi-disk) archive...
	 copying: word/document.xml  (996 bytes)
	 copying: word/styles.xml  (681 bytes)
	 copying: word/_rels/document.xml.rels  (197 bytes)
	 copying: word/settings.xml  (165 bytes)
	 copying: word/fontTable.xml  (311 bytes)
	 copying: docProps/app.xml  (298 bytes)
	 copying: docProps/core.xml  (339 bytes)
	 copying: [Content_Types].xml  (298 bytes)
	Central Directory found...
	no local entry: _rels/.rels
	no local entry: word/_rels/document
	no local entry: word/fontT
		zip warning: zero-length name for entry #9
		zip warning: skipping this entry...

Well, that seemed to have worked. Let us search for a flag in this file. 

	$ zcat foren-steg-fixed.docx
	<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
	...
	</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="PreformattedText"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr></w:r></w:p><w:p><w:pPr><w:pStyle w:val="PreformattedText"/><w:rPr></w:rPr></w:pPr><w:r><w:rPr></w:rPr><w:t>flag{docx files are zip eh}</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="PreformattedText"/>
	...
	gzip: foren-steg-fixed.docx: invalid compressed data--crc error

	gzip: foren-steg-fixed.docx: invalid compressed data--length error

We get our flag. What's more, is that we find that certain softwares now have
the ability to read our broken docx file too, We can open this is `libreoffice`
and view the flag too.

A large portion of the file is still broken. But all we want is the flag. 

Flag
----
flag{docx files are zip eh}