# Frontend Integration Guide

This document outlines how to properly configure the frontend application to connect to the UNDR API.

## Environment Variables

The frontend application needs to be configured with the correct API URL based on the environment:

### Local Development

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production (Vercel)

```
NEXT_PUBLIC_API_URL=https://undr-api-production.up.railway.app
```

To set these variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add `NEXT_PUBLIC_API_URL` with the value `https://undr-api-production.up.railway.app`
4. Deploy or redeploy your frontend application

## API Client Configuration

In your API client or fetch utilities, always use the environment variable:

```javascript
// Example API client setup
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchFromApi(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // Important for auth cookies
  });

  // Handle response
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export { fetchFromApi };
```

## Common CORS Issues

If you're experiencing CORS issues:

1. Ensure the frontend URL is properly added to the API's CORS configuration
2. Verify that you're using the correct API URL in all requests
3. Check that credentials are properly handled if you're using authentication
4. Confirm that your API is responding with the correct CORS headers

## Testing API Connection

You can test the API connection with a simple health check:

```javascript
fetch("https://undr-api-production.up.railway.app/")
  .then((response) => {
    if (response.ok) {
      console.log("API connection successful");
    } else {
      console.error("API connection failed");
    }
  })
  .catch((error) => {
    console.error("API connection error:", error);
  });
```

## Authentication Headers

For authenticated requests, include the JWT token in the Authorization header:

```javascript
fetch(`${API_URL}/auth/profile`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```
