# -------------------------
# Stage 1: Build (Vite)
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cache-friendly)
COPY package.json package-lock.json ./
RUN npm ci

# Copy required project files
COPY index.html ./
COPY main.ts ./
COPY vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/

# Build the Vite app
RUN npm run build


# -------------------------
# Stage 2: Serve (NGINX)
# -------------------------
FROM nginx:stable-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Add custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
