#--- BUILD STAGE
FROM node:lts-alpine AS build

LABEL maintainer=""

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm install --force

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# build app for production with minification
RUN npm run build

#--- DEPLOYMENT STAGE
FROM nginx:alpine

##-- Copy app build into nginx
COPY --from=build /app/dist /usr/share/nginx/html

COPY default.conf /etc/nginx/conf.d/default.conf
COPY .htpasswd /etc/nginx/.htpasswd
