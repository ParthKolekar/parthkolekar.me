---
title: Configuring a USB dongle for OpenVZ
date: 2016-03-03 23:15 UTC
tags:
  - sysadmin
  - setup
  - OpenVZ
  - usb_modeswitch 
featured: true
---

In order to setup a USB forwarding to a OpenVZ container,
you would need to ensure that you have the following packages
installed

    usb_modeswitch
    usb_modeswitch-data

Some device drives connect by default in USB Mass Storage mode.
This allows them to load a basic setup like rom from where you can
install the telecom provider's software. The software then does 
a mode switch on the hardware by sending it a command on the usb
bus.

This changes the usb from Mass Storeage mode to a USB modem.

- `usb_modeswitch` software allows you to do the same from linux. 
- `usb_modeswitch-data` contains a list of vendor and products for which
this settings are hard coded. 

Run a `lsusb` command.

    Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

Among this, the important fields are marked by the ID. Those are the
vendor ID and product ID respectively. In the above case, the vendor
ID is *0x1d6b* and product ID is *0x0002* 

Now run a modeswitch command to the USB device.

    usb_modeswitch -c /etc/usb_modeswitch.d/1d6b\:0002 -v 0x1d6b -p 0x0002

*Note: This are values corresponding to a USB hub. Actual values will be different*

This loads the configuration from pre-defined modeswitch files and 
issues a command to execute it in the way as defined by the modeswitch.
When a device is switched, its product ID may change to a different value. 
The vendor ID will remain unchanged. This can be seen in the output of lsusb.

This should load a `/dev/ttyUSB0`.

To forward a devnode in OpenVZ, you have to run the following command.

    vzctl set CTID --devnodes ttyUSB0:rw

USB is still a bit of voodoo magic with pre-defined special commands made to
give some pre-defined output.

In order to forward the bus, so that the device comes properly in container
when you run lsusb, you have to forward in addition, the usb bus devnode as 
well.

In the above lsusb sample, the Bus and Device are specified and are *003* and *001*
which means that the bus is /dev/bus/003/001

We now forward to the container. For doing that we need to know the major ID and the
minor ID of the device.

    $ ls -l /dev/bus/usb/003/001
    crw-rw-r-- 1 root root 189, 256 Feb 26 15:13 /dev/bus/usb/003/001

The major and minor id are printed here, and in this case they are *189* and *256*.

*Note: This are values corresponding to a USB hub. Actual values will be different*

    vzctl set CTID --devices c:189:256:rw --save

This grants the ability to run `mknod` for this device. For lsusb to work properly, 
you have to make an identical /dev/bus/usb structure in the guest as in the host.

    mkdir -p /dev/bus/usb/003
    mknod /dev/bus/usb/003/001 c 189 256

Now your `lsusb` should reflect the real data for the forwarded USB device as well.
