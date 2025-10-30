# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Accept build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY apps/corp-admin-frontend/package*.json ./
RUN npm install

COPY apps/corp-admin-frontend/ ./
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY apps/corp-admin-frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

