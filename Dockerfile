# syntax=docker/dockerfile:1

# ---------- Etapa 1: compilar la aplicación Angular (Node no llega a la imagen final) ----------
FROM node:22-alpine AS build
WORKDIR /app

# Primero solo los archivos de dependencias: esta capa se reutiliza mientras no cambien
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build -- --configuration production

# ---------- Etapa 2: servir los archivos estáticos con nginx ----------
# Imagen oficial de nginx que se ejecuta sin root (escucha en el puerto 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Nombre del proyecto en angular.json (define la carpeta dist/<nombre>/browser)
ARG APP_NAME=fronet-petadot

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/${APP_NAME}/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
