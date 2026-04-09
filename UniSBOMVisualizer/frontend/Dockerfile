# Stage 1: Build TS/Frontend
FROM node:25.9.0-alpine AS builder

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy only required source files
COPY login.html ./
COPY datatable.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY data/ ./data/
COPY ezsecops-logo.png ./
COPY main.ts ./

# Build
COPY . .
RUN npm run build

# Stage 2: NGINX
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets only
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
