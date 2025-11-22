FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Expose port 80
EXPOSE 80

# Set environment variable for Vite preview port
ENV PORT=80

# Start Vite preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80"]
