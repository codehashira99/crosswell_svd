# Use Node 20 Debian LTS
FROM node:20-bullseye

# Set working directory inside container
WORKDIR /app

# Install minimal system libraries needed for canvas prebuilt
RUN apt-get update && \
    apt-get install -y libcairo2-dev libpango1.0-dev libgif-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install npm dependencies and rebuild canvas for Node 20
RUN npm install --build-from-source

# Copy the rest of the project
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
