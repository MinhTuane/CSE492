FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build-time env for Vite (must exist at build time, not runtime)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_FACEBOOK_APP_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_FACEBOOK_APP_ID=${VITE_FACEBOOK_APP_ID}

# Build the React app
RUN npm run build

# Stage 2: Serve the app using Nginx
FROM nginx:alpine
# Copy custom Nginx configuration if you have one, or just use the default
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
