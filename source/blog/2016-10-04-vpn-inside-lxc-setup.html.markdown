---
title: VPN Setup in LXC
date: 2016-10-04 12:29 UTC
tags:
  - sysadmin
  - setup
  - openvpn
  - lxc
---

We would be using OpenVPN to provide a VPN server as a lxc container and set it
up so that we are able to access the private subnet 192.168.1.0/24 by connecting
it via the OpenVPN tunnel. 

We would also be setting up routing such that all packets are forwarded properly.
As the base machine handles being the default gateway for all communications, the
setting is not changed and routing is added on the base machine instead of each
container.


Installation
------------

We would need to install the openvpn from the package managers.

For CentOS - 7 minimal, the commands to use are.

    yum install -y epel-release
    yum install -y openvpn easy-rsa

easy-rsa is used to generate the certificates required for doing VPN.

If you are behind a proxy, first set teh env variable before running yum

    export {http,https,ftp,rsync,socks}_proxy='http://proxy.example.com:8080'
    export no_proxy='comma, separated, hosts, for, which, no, proxy, need, be, applied'


Configuration - Notes
---------------------

Required is to setup a VPN connection such that private network is accessable, and
also, that the user of vpn is able to ssh into any of the machines in the private 
network, with the machine ssh'd into showing the IP address of the user and not
the IP address of the VPN server. This basically means that we are not to 
MASQUERADE the connections, and we need to route VPN packets via some other route.


Configuration - Setup
---------------------

We start off by putting a server.conf in the VPN server container. 

    $ cp /usr/share/doc/openvpn-*/sample/sample-config-files/server.conf /etc/openvpn

This is a cample config file which we have to edit. 

Edits required are...

    dh dh1024.pem

should be changed to something higher

    dh dh2048.pem

this push route line should be added.

    push "route <private subnet> <subnet mask>"


uncomment these lines 

    user nobody
    group nobody

In some cases where there is crazy networking involved, it is better to convert
the udp to tcp. This leads to a poorer network (overhead). 

    proto tcp

Now your openvpn server.conf is ready. But you still need to generate the keys!

    cp -rf /usr/share/easy-rsa/2.0/* /etc/openvpn/easy-rsa

This copies a bootstrap easy-rsa key generation toolkit into the openvpn folder.
Do note that openvpn wants keys in /etc/openvpn/ and we are copying this to 
/etc/openvpn/easy-rsa/ so do ensure that you have copied the files after generation.

    cd /etc/openpvn/easy-rsa

Due to hardcoding of PWD param as `pwd`, you kinda need to be in this dir to generate
the certificates. So we cd there. 

Now change the content of vars file according to need. 

The current vars file contains

~~~bash
# These are the default values for fields
# which will be placed in the certificate.
# Don't leave any of these fields blank.
export KEY_COUNTRY="IN"
export KEY_PROVINCE="Nonexistant"
export KEY_CITY="Nonexistant"
export KEY_ORG="Nonexistant"
export KEY_EMAIL="nonexistant@nonexistant"
export KEY_OU="Nonexistant"

# X509 Subject Field
export KEY_NAME="server"

# PKCS11 Smart Card
# export PKCS11_MODULE_PATH="/usr/lib/changeme.so"
# export PKCS11_PIN=1234

# If you'd like to sign all keys with the same Common Name, uncomment the KEY_CN export below
# You will also need to make sure your OpenVPN server config has the duplicate-cn option set
export KEY_CN="nonexistant@nonexistant"
~~~

The vars file, if you notice is just a bunch of exports to define variables to be used for 
generating certificates.

	$ source vars

This would load it all in. And then, as the printed message says, run ./clean-all which will
clean out any existing keys (there should not be any).

	$ ./clean-all

Now you build a ca.crt, followed by a server.crt

    $ ./build-ca
    $ ./build-key-server server

Just accept all the defaults set, and remember to sign them and add them when the prompt comes.

Now we build a client.crt

    $ ./build-key client

Just accept all the defaults set, and remember to sign them and add them when the prompt comes.

Now we create a diffe-hellman pem file. This is a unique large key for openvpn and takes a bit
of a time to create. On headless servers with low natural entropy sources, consider installing
`haveged` or similar service.

    $ ./build-dh

Now all our keys are ready. But do recall that we want the server keys in the /etc/openvpn folder
so we copy them there now.

    $ cp dh2048.pem ca.crt server.crt server.key /etc/openvpn/


Start / Restart the openvpn service now.

    service openvpn start

    
/dev/net/tun in LXC
-------------------

LXC does not have a /dev/net/tun by default, you need to create it, and also
you need to allow cgroups access to it. 

    mkdir -p /dev/net
    mknod /dev/net/tun c 10 200
    chmod 666 /dev/net/tun

Now to allow it in the cgroups, we edit the config for the container and add this.

    #tun
    lxc.cgroup.devices.allow = c 10:200 rwm 

Restart the container and restart openvpn service.


IP forwarding
-------------

To enable IP forwarding, edit the /etc/sysctl.conf and change the line to

    net.ipv4.ip_forward = 1

This will set the ip_forward to be '1' on boot. To change it immediately,

    sysctl net.ipv4.ip_forward=1

Base Machine Config
-------------------

Now you would be able to VPN from some other container to this container. If you want
to connect to this from outside, in the base machine, add the following to your iptables

    # MASQUERADE for internal nodes
    iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o enp2s0 -j MASQUERADE

    # accept the following (after route)
    iptables -A fw-open -d 192.168.1.4 -p tcp --dport 1194 -j ACCEPT

    ### PREROUTE the following
    # route the following to
    iptables -t nat -A PREROUTING -i enp2s0 -p tcp --dport 1194 -j DNAT --to 192.168.1.4:1194

Also, as base machine is the default gateway, for containers, (all vpn replies go there)you need
to forward those packets back to the vpn container. 

    ip route add 10.8.0.0/16 via <vpn container local IP>


Client Config
-------------

It is recommended that you merge the client config with the client cert and key,
and to create a single file for easy access.

The current file configured for this setup is

    client

    dev tun

    proto tcp
    ;proto udp
    
    remote <vpn server IP> 1194

    resolv-retry infinite

    nobind
    
    #disable user and group for non linux clients
    user nobody
    group nogroup

    persist-key
    persist-tun

    ;ca ca.crt
    ;cert client.crt
    ;key client.key

    ns-cert-type server

    ;tls-auth ta.key 1

    comp-lzo

    verb 3

    ;mute 20

    <ca>
        CA Cert
    </ca>
    <cert> 
        Client Cert
    </cert>
    <key>
        Client Key
    </key>


Copy this keys to your client and connect to VPN.
