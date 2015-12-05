FROM node:5
MAINTAINER Nikos Kampitakis <kabitakis@gmail.com>

# Copy files to image
RUN mkdir /jira-issuer
COPY . /jira-issuer

# Install required modules
WORKDIR /jira-issuer
RUN npm install
RUN ./node_modules/.bin/browserify -t reactify public/*.js -o public/js/bundle.js

# Run node
ENV NODE_ENV local
CMD ["node", "app.js"]

EXPOSE 3000
