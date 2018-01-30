# Set the base image to Ubuntu
FROM ubuntu

# File Author / Maintainer
MAINTAINER Metaxis

# Update the repository sources list
RUN apt-get update

# Install nodjs
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
# RUN curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
# RUN bash nodesource_setup.sh
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y git

# Set work diractory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./ ./

# get libraries
RUN npm install

# After install, run some command
CMD ["npm", "start"]
