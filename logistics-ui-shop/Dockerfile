# Stage 1: Build Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/logistics-ui-shop /usr/share/nginx/html

# Nginx Config with CORS ENABLED for Module Federation
RUN echo 'server { \
    listen 80; \
    add_header Access-Control-Allow-Origin *; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
