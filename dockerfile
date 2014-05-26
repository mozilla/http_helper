from ubuntu:12.04

ENV DEBIAN_FRONTEND noninteractive

# Add repos for base packages
RUN echo "deb http://archive.ubuntu.com/ubuntu/ precise main" >> /etc/apt/sources.list
RUN echo "deb-src http://archive.ubuntu.com/ubuntu/ precise main" >> /etc/apt/sources.list
RUN echo "deb http://archive.ubuntu.com/ubuntu/ precise-updates main" >> /etc/apt/sources.list
RUN echo "deb-src http://archive.ubuntu.com/ubuntu/ precise-updates main" >> /etc/apt/sources.list
RUN echo "deb http://archive.ubuntu.com/ubuntu/ precise universe" >> /etc/apt/sources.list
RUN echo "deb-src http://archive.ubuntu.com/ubuntu/ precise universe" >> /etc/apt/sources.list

# Add repo for nodejs
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv C7917B12
RUN echo 'deb http://ppa.launchpad.net/chris-lea/node.js/ubuntu precise main' | tee /etc/apt/sources.list.d/chrislea.list

# Update and install all of the things
RUN apt-get update
RUN apt-get install -y nodejs openjdk-7-jre-headless

# Clone our app
RUN git clone https://github.com/mozilla/http_helper.git

# Run npm install on our app
cd ~/http_helper && npm install

# Settings for starting up
EXPOSE 80

CMD /usr/bin/node ~/http_helper/bin/server.js
