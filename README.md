**Getting Started with EEB_App**

*Prerequisites*

    - Node.js (version 14 or higher recommended)
    - npm (comes with Node.js)
    - Expo Go on your mobile phone


*Installation Steps*

*Clone the repository*

    git clone https://github.com/Sithkiller3000/EEB_App.git
    cd EEB_App


*Install dependencies*

    npm install


*Run the application*

    npm start


*Connect your mobile phone*

scan the QR in the Terminal with your mobile phone camera


**Installation Guide for the Raspberry Pi and WebSocket**


1) Raspberry Pi Imager runterladen
2) Modell wählen -> Raspberry Pi 4, OS wählen -> Raspberry Pi OS (64 Bit), SD Karte -> SD Karte des Raspberry Pis wählen und dann weiter
3) im Pop-Up Einstellungen bearbeiten klicken
4) Reiter Allgemein: 
    
Haken bei hostname: raspberrypi4 eintragen
Haken bei Benutzername du Passwort festlegen, Benutzername und Passwort eintragen
Haken bei Wifi einrichten, SSID: Wifi-Name eintragen, Passwort: Wifi-Passwort     eintragen
5) Reiter Dienste:
    
Haken bei SSH aktivieren
Radiobutton bei Passwort zur Authentifizierung verwenden klicken
6) Speichern
7) In beiden Pop-Ups auf Ja
8) SD-Karte wieder in Raspi einlegen
9) Maus, Tastaur und Bildschirm an Raspi anschließen
10) Internet aktivieren (obere Menüleiste, zweiter Button neben der Uhrzeit)
11) Über Internet-Symbol hovern und IP-Adresse merken -> bei Frontend in WeightWebSocket.js ändern
12) in Shell vom bevorzugten Computer: ssh [Benutzername]@[IP-Raspi]
13) sudo raspi-config 
14) 3 Interface Options → I4 I2C, I2C aktivieren
15) sudo apt-get install python3-pip
sudo apt install python3-dev python3-rpi.gpio i2c-tools
16) mkdir project-name
17) cd project-name
18) python -m venv --system-site-packages env
19) source env/bin/activate
20) pip3 install RPi.GPIO
21) pip3 install adafruit-circuitpython-ads1x15
22) pip3 install adafruit-circuitpython-busdevice
23) pip3 install websockets
24) cd ~
git clone https://github.com/tatobari/hx711py.git
cd hx711py
cp hx711.py ~/project-name/
cd ~
cd project-name
ls und prüfen, dass hx711.py dort liegt
25) VSC öffnen, unten links auf "Open a Remote Window" klicken, "Connect to host", dann [Benutzername]@[IP-Raspi] eingeben, config bearbeiten, nochmal connect to host, auf IP klicken und verbinden
26) New file, Backend.py, in Unterordner Project-Name speichern
27) Inhalt aus der Backend.py Datei aus GitHub reinkopieren, strg+S drücken
28) python3 Backend.py
29) in andere Konsole Frontend starten