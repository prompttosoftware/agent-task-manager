import { Request, Response, NextFunction } from 'express';
import { Buffer } from 'buffer'; // Node.js Buffer for Base64 decoding

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      errorMessages: ["Authorization header missing."]
    });
  }

  const authHeaderParts = authHeader.split(' ');

  // Check if the header is in the expected "Basic <credentials>" format
  if (authHeaderParts.length !== 2 || authHeaderParts[0].toLowerCase() !== 'basic') {
    return res.status(401).json({
      errorMessages: ["Authentication failed."]
    });
  }

  const base64Credentials = authHeaderParts[1];
  let decodedCredentials;

  try {
    // Decode the Base64 string
    decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  } catch (error) {
    // Handle potential decoding errors
    return res.status(401).json({
      errorMessages: ["Authentication failed."]
    });
  }

  const credentialsParts = decodedCredentials.split(':');

  // Ensure the decoded string is in the "username:password" format
  if (credentialsParts.length !== 2) {
    return res.status(401).json({
      errorMessages: ["Authentication failed."]
    });
  }

  const providedUsername = credentialsParts[0];
  const providedPassword = credentialsParts[1];

  // Get expected credentials from environment variables
  const expectedUsername = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;

  // Check if environment variables are set. If not, authentication cannot proceed.
  // This indicates a server misconfiguration, but we report it as an authentication failure to the client.
  if (!expectedUsername || !expectedPassword) {
    console.error("Server misconfiguration: AUTH_USERNAME or AUTH_PASSWORD environment variable not set.");
    return res.status(401).json({
      errorMessages: ["Authentication failed."]
    });
  }

  // Compare provided credentials with expected credentials
  if (providedUsername === expectedUsername && providedPassword === expectedPassword) {
    // Authentication successful, proceed to the next middleware or route handler
    return next();
  } else {
    // Authentication failed (invalid username or password)
    return res.status(401).json({
      errorMessages: ["Authentication failed."]
    });
  }
}
