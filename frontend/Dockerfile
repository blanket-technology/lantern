# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty means "same origin"; set at build time if the API lives on another domain
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
# The official image renders /etc/nginx/templates/*.template with envsubst on start
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV API_UPSTREAM=http://backend:8000
ENV PORT=80
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_FILTER=^(API_UPSTREAM|PORT|NGINX_LOCAL_RESOLVERS)$
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
