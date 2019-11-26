Browser based simulator for ev3dev-lang-python
===

This simulator was created to allow students to experiment with Python
EV3DEV, even without an actual EV3 available.

Installation
---

The simulator is meant to be served through a webserver.
Download all files and put them in a directory on your server and that should be it.
Due to CORS protection on web browsers, it will not work when served from a "file://" URL.

If you have Python3 installed on your computer, you can try changing to the ev3devSim directory and running...

`python -m http.server 1337`

This should get the site running on http://localhost:1337 (...try http://127.0.0.1/1337 if that doesn't work).
Do not close the window with the Python command running.

Credits
---
Created by A Posteriori. Check out our other EV3DEV project; ev3fast.

This simulator would not have been possible without the great people behind:

EV3DEV https://ev3dev.org
Skulpt https://skulpt.org
Ace https://ace.c9.io

License
---
GNU General Public License v3.0

Ace is included here for convenience and can be found in the directory
ace-src-min.  Please refer to the Ace website for license information.

Skulpt is included here for convenience. Please refer to the Skulpt website
for license information.
