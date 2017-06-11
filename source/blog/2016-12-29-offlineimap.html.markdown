---
title: offlineimap setup
date: 2016-12-29 19:08 UTC
tags:
  - sysadmin
  - setup
  - offlineimap
---

OfflineIMAP is a GPLv2 software to dispose your mailbox(es) as a local 
Maildir(s). What it allows you to do is to make a complete sync of your email
over the IMAP protocol and in essence keep local copies of email. This is a 
GUI-less alternative for a thunderbird email backups, plus you also forgo the
usablity of a proper email client which would allow you to make replies to old
emails. For these reasons, I personally recommend using thuderbird configured
to keep deleted copies of emails as an alternative, but some needs are more
basic, and this will get the work done. 

Installation
------------

OfflineIMAP comes in package repos for all major distos, so installation is 
as easy as running

	$ apt install offlineimap

Or whatever is your package manager of choice.

Usage
-----

Create a file `~/.offlineimaprc` and fill it with the following content

~~~ini
[general]
accounts = <Any Name>

[Account <Any Name (Same as one above)>]
localrepository = Local
remoterepository = Remote

[Repository Local]
type = Maildir
localfolders = <Path to the folder for backup>

[Repository Remote]
type = IMAP
remotehost = <host>
remoteuser = <user>
sslcacertfile = /etc/ssl/certs/ca-certificates.crt
~~~

Then all you need to do is run 

	$ offlineimap

It should prompt for your login password. Enter that, and you should see 
the emails being downloaded locally and put into the folder you provided.

Restoring Emails
----------------

Flipping the localrepository and remoterepository should get the job done. It
has not yet been tested.
