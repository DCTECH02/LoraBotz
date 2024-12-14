# Use the official Node.js image
FROM node:18-alpine

RUN gitclone https://github.com/DCTECH02/Queen_Anita-V7

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npm install --save-dev @types/express


# Copy the rest of the project files
COPY . .

# Build TypeScript files
RUN npm run build

# Expose a port (optional, only needed if your bot listens to HTTP)
# EXPOSE 3000

# Start the bot
CMD ["npm", "start"]