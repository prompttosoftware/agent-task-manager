#!/bin/bash

# Build the project
npm run build

# Start the server in the background
node dist/server.js &
SERVER_PID=$!

# Wait for the server to start
for i in $(seq 1 10); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "Server is up and running!"
    break
  fi
  echo "Server not ready yet. Waiting..."
  sleep 1
done

# Check if the server started successfully
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
  echo "Test failed: Server did not start within the timeout."
  kill $SERVER_PID
  exit 1
fi

# Run tests (replace with your actual test commands)
echo "Running tests..."
# Example test: Check if the root endpoint returns "Hello, world!"
if ! curl -s http://localhost:3000 | grep -q "Hello, world!"; then
  echo "Test failed: Root endpoint did not return expected message."
  kill $SERVER_PID
  exit 1
fi

echo "All tests passed!"
kill $SERVER_PID
exit 0
