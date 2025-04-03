#!/bin/bash

# Install dependencies for client
cd client
npm install

# Build the client
npm run build

# Go back to the root directory
cd ..

# Build complete
echo "Build completed successfully"