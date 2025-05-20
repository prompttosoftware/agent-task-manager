import app from './app';
import { Server } from 'http';

// Determine the port to listen on
const rawPort = process.env.PORT;
const parsedPort = rawPort ? parseInt(rawPort, 10) : 3000;

// Validate the parsed port or use the default
const port = (isNaN(parsedPort) || parsedPort < 0 || parsedPort > 65535) ? 3000 : parsedPort;

// Start the server
const server: Server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Handle server errors during startup
server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
        throw error; // Re-throw errors that are not from listen
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // Handle specific listen errors
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1); // Exit the process with an error code
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1); // Exit the process with an error code
            break;
        default:
            throw error; // Re-throw any other error
    }
});
