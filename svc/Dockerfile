# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Make the r6-dissect executable
RUN chmod +x r6-dissect

# Print permissions
RUN ls -la

# Start the application when the container launches
CMD [ "node", "index.js" ]
