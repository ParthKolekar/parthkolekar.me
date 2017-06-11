---
title: Setting Up httpd (2.2) as ReverseProxy (OLD)
date: 2015-12-02 02:20 UTC
tags: 
  - sysadmin
  - setup
  - httpd2.2 
---

httpd can be configured as a frontend load balancing proxyfier. There are better
tools in the market for doing this exact thing, and `nginx` and `haproxy` have shown
a much better performance in real world and benchmarks with a lower RAM footprint
but like all servers httpd can also be configured with mod_proxy to act as a
http proxy engine.

Setup Notes
-----------

Point all your DNS to your httpd node. And setup virtual hosts as listed below.
Be sure to install mod_proxy on your httpd node.

~~~ apache
<VirtualHost *:80>                                                                     
  ServerAdmin jp@iiit.ac.in                                                          
  ServerName ithelp.iiit.ac.in                                                                 
  ErrorLog logs/ithelp.iiit.ac.in-error_log                                                 
  CustomLog logs/ithelp.iiit.ac.in-access_log combined                                       
  <Location />                                                                             
    ProxyPass http://ithelp.iiit.ac.in/                                                        
  </Location>                                                                               
</VirtualHost>
~~~

For serving https content be sure to install mod_ssl as well.

~~~ apache
<VirtualHost *:443>
  ServerAdmin jp@iiit.ac.in
  ServerName ithelp.iiit.ac.in
  ErrorLog logs/ithelp.iiit.ac.in-error_log
  CustomLog logs/ithelp.iiit.ac.in-access_log combined
  SSLEngine on
  SSLProxyEngine on
  SSLProxyCheckPeerCN off
  SSLProxyCheckPeerExpire off
  <Location />
    ProxyPass https://ithelp.iiit.ac.in/
  </Location>
</VirtualHost>
~~~

In addition, if you want to enable appropriate SSL, be sure to add the additional 
config into the `*:443` VHost

~~~ apache
  SSLProtocol All -SSLv2 -SSLv3
  SSLCipherSuite ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4
  SSLHonorCipherOrder On
  SSLCertificateFile /path/to/certificate
  SSLCertificateKeyFile /path/to/key/file
  Header always set Strict-Transport-Security "max-age=63072000"
~~~

SNI (Server Name Indication)
---------------------------

Since it is mighty difficult for hostname to be detected from a https:// connection the 
folks out there making browsers have implemented SNI. 

What SNI does is that it indicates what hostname is being accessed to the server
so that the connections can be made without the additional headache of passing the
proxy.

To test a SNI site, you need to dish in your server name as follows

    openssl s_client -servername <name> -host <name> -port <port>

This is already implemented in most browsers, so unless you are using cURL for a primary
browser role, you would not even notice this. 

Setting the `SSLCertificate` would automatically handle it so you should not have
any issues doing this. 
