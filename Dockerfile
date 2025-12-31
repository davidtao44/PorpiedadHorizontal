# Etapa 1: Construcción (Build)
FROM node:22-alpine as build

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Copiamos el package.json de la carpeta app (donde está el código fuente real)
COPY app/package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código fuente de la carpeta app
COPY app/ .

# Construimos la aplicación para producción
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:latest

# Copiamos los archivos compilados desde la etapa de construcción
# Asegurándonos de copiar desde /app/dist (donde Vite deja el build por defecto)
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
