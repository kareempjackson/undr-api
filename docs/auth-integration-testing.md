# Authentication Integration & Testing Guide

This document provides details on the integration between the frontend authentication system and the backend API, along with comprehensive testing approaches.

## Authentication Flow

The UNDR platform uses a Magic Link authentication system, which follows this flow:

1. User enters their email on the login page
2. Backend sends a magic link to the user's email
3. User clicks the link, which contains a token
4. Frontend verifies the token with the backend
5. Backend returns a JWT token upon successful verification
6. Frontend stores the JWT token and uses it for subsequent API calls

## API Endpoints

| Endpoint                             | Method | Description                 | Parameters      | Response                                        |
| ------------------------------------ | ------ | --------------------------- | --------------- | ----------------------------------------------- |
| `/auth/login`                        | POST   | Request a magic link        | `email`         | `{ success: true, message: 'Magic link sent' }` |
| `/auth/verify`                       | POST   | Verify magic link token     | `token`         | `{ token: 'jwt-token', expiresIn: 3600 }`       |
| `/auth/me`                           | GET    | Get current user data       | -               | User object with wallet data                    |
| `/auth/logout`                       | POST   | Logout the current user     | -               | `{ success: true }`                             |
| `/auth/check-alias-available/:alias` | GET    | Check if alias is available | `:alias` (path) | `{ available: true/false }`                     |

## Frontend Implementation

### API Service

The authentication API service (`authApi.ts`) provides methods for interacting with the backend authentication endpoints:

```typescript
// services/authApi.ts
import api from "./api";

export const authApi = {
  requestMagicLink: (email: string) => api.post("/auth/login", { email }),

  verifyMagicLink: (token: string) => api.post("/auth/verify", { token }),

  getCurrentUser: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),

  checkAliasAvailability: (alias: string) =>
    api.get(`/auth/check-alias-available/${alias}`),
};
```

### Authentication Context

The `AuthContext` component manages authentication state and provides authentication methods to the application:

```typescript
// contexts/AuthContext.tsx
import { createContext, useState, useEffect } from "react";
import authApi from "../services/authApi";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User login with magic link
  const login = async (email) => {
    try {
      setLoading(true);
      await authApi.requestMagicLink(email);
      setLoading(false);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send login link");
      setLoading(false);
      return false;
    }
  };

  // Verify magic link token
  const verifyMagicLink = async (token) => {
    try {
      setLoading(true);
      const response = await authApi.verifyMagicLink(token);
      localStorage.setItem("token", response.data.token);
      const userData = await authApi.getCurrentUser();
      setUser(userData.data);
      setLoading(false);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || "Invalid link");
      setLoading(false);
      return false;
    }
  };

  // Additional methods for logout and user data updates
  // ...
}
```

## Testing Strategy

We implement multiple levels of testing to ensure the authentication system works correctly.

### Unit Tests

Unit tests focus on individual components and services:

```typescript
// __tests__/services/authApi.test.ts
describe("Auth API Service", () => {
  it("should request a magic link", async () => {
    const email = "test@example.com";
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    const result = await authApi.requestMagicLink(email);

    expect(api.post).toHaveBeenCalledWith("/auth/login", { email });
    expect(result.data.success).toBe(true);
  });

  // Additional tests for other API methods
});
```

### End-to-End Tests

E2E tests verify complete user flows:

```javascript
// cypress/e2e/auth.cy.js
describe("Authentication Flows", () => {
  it("should request a magic link", () => {
    cy.visit("/auth/login");
    cy.findByLabelText(/email/i).type("test@example.com");
    cy.get("form").submit();

    // Check API call and success message
    cy.wait("@POST_auth_login");
    cy.contains(/check your email/i).should("be.visible");
  });

  it("should verify magic link token and redirect to dashboard", () => {
    cy.visit("/auth/verify?token=test-token-123");
    cy.wait("@POST_auth_verify");
    cy.wait("@GET_auth_me");

    cy.url().should("include", "/dashboard");
  });

  // Additional tests for logout and protected routes
});
```

## Running the Tests

### Unit Tests

Run unit tests with Jest:

```bash
# Run all tests
npm test

# Run auth-specific tests
npm test -- -t "Auth API Service"

# Run with coverage
npm test -- --coverage
```

### End-to-End Tests

Run E2E tests with Cypress:

```bash
# Open Cypress test runner
npm run cypress

# Run tests headlessly
npm run test:e2e

# Run specific test file
npm run test:e2e -- --spec "cypress/e2e/auth.cy.js"
```

## Development Mode

For development, the auth system supports a dev mode that bypasses actual API calls:

1. Set `devModeEnabled` to `true` in localStorage
2. Choose a user role (`FAN`, `CREATOR`, `AGENCY`, `ADMIN`)
3. Authentication will use mock user data instead of real API calls

This mode is automatically enabled in development environments unless explicitly disabled.

## Best Practices

1. Always verify authentication state before showing protected content
2. Handle authentication errors with clear user messages
3. Implement automatic token refresh for expired JWTs
4. Use secure storage for tokens (httpOnly cookies when possible)
5. Test both successful and error scenarios

## Next Steps

- Implement refresh token handling for extended sessions
- Add multi-factor authentication support
- Improve error handling and user feedback
- Set up proper CSRF protection
