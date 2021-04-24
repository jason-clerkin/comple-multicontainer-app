FROM node:alpine as builder 
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
# build production version of our front-end assets
# output of that wil be a folder in the /app directory called build
# that's where all our production assests gets placed
RUN npm run build 

# then we want to copy that (build) folder over to that
# nginx phase of our build
FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

