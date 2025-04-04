# Frontend-Backend Integration Testing Guide

## Overview

This document provides a comprehensive guide for implementing end-to-end testing of the integration between the UNDR frontend and backend. The testing infrastructure will ensure that:

1. API endpoints are correctly integrated with frontend components
2. User workflows function as expected from UI to database and back
3. Real-time features like notifications work properly
4. Error handling is robust across the application

## Testing Infrastructure

The UNDR testing infrastructure consists of multiple layers:

### Backend Testing (Existing)

- **Unit Tests**: Test individual services and controllers
- **End-to-End API Tests**: Test API flows with supertest
- **WebSocket Tests**: Test notification delivery via WebSockets

### Frontend Testing (To Be Implemented)

- **Component Tests**: Test individual React components
- **Integration Tests**: Test interactions between components and contexts

### End-to-End Testing (To Be Implemented)

- **Cross-Stack Tests**: Test complete user flows from UI to database and back

## Testing Tools

### 1. Cypress

Cypress will be our primary tool for end-to-end testing:

- Provides a browser environment for realistic testing
- Can access both the DOM and network layer
- Supports waiting and retry logic for asynchronous operations
- Can interact with real or stubbed API endpoints

#### Installation

```bash
# From the frontend directory
npm install --save-dev cypress @testing-library/cypress
```

#### Configuration

Create a `cypress.config.js` in the frontend directory:

```javascript
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    apiUrl: "http://localhost:3001",
  },
});
```

### 2. Jest + React Testing Library

For component and integration testing:

```bash
# From the frontend directory
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

#### Configuration

Create a `jest.config.js` in the frontend directory:

```javascript
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};
```

And a `jest.setup.js` file:

```javascript
import "@testing-library/jest-dom";
```

### 3. Mock Service Worker (MSW)

For API mocking in both Jest and Cypress tests:

```bash
# From the frontend directory
npm install --save-dev msw
```

## Test Specifications

### 1. Authentication Flows

#### End-to-End Tests

- **Magic Link Login**

  - Request magic link
  - Verify link sent to email (mock or real)
  - Verify token handling after link activation
  - Redirect to appropriate page

- **Session Management**
  - Verify token storage
  - Test token expiration handling
  - Test protected route access

#### Component Tests

- **Login Form**
  - Validate input field behavior
  - Test form submission
  - Verify error handling

### 2. Wallet & Payments

#### End-to-End Tests

- **Wallet Operations**

  - Check balance retrieval
  - Top-up with Stripe
  - Verify balance updates after transactions

- **Payment Flows**
  - Payment to creator
  - Verify transaction record creation
  - Check creator balance update

#### Component Tests

- **Wallet Display**

  - Verify formatting and rendering
  - Test refresh functionality

- **Payment Forms**
  - Validate input fields
  - Test amount limits
  - Verify error messages

### 3. Escrow System

#### End-to-End Tests

- **Escrow Creation**

  - Fill out escrow creation form
  - Verify escrow record in database
  - Check buyer and seller notifications

- **Escrow Lifecycle**
  - Fund escrow
  - Submit proof of delivery
  - Review proof
  - Complete or dispute escrow
  - Verify fund movement

#### Component Tests

- **Escrow Form**

  - Test milestone adding/removing
  - Verify validation rules

- **Escrow Status Display**
  - Test different status renderings
  - Verify action buttons based on role

### 4. Dispute Resolution

#### End-to-End Tests

- **Dispute Creation**

  - Initiate dispute from escrow
  - Verify dispute record creation
  - Check notifications to both parties

- **Dispute Process**
  - Submit evidence
  - Exchange messages
  - Propose resolution
  - Accept resolution
  - Verify fund distribution

#### Component Tests

- **Dispute Forms**
  - Test evidence uploading
  - Verify message composition
  - Test resolution proposal UI

### 5. Notifications

#### End-to-End Tests

- **Real-time Notifications**

  - Create notification trigger
  - Verify WebSocket delivery
  - Check UI notification display

- **Notification Management**
  - Mark as read
  - Verify unread count updates
  - Test notification preferences

#### Component Tests

- **Notification Components**
  - Test notification rendering
  - Verify interaction handlers
  - Test count badge updates

### 6. Creator Features

#### End-to-End Tests

- **Dashboard**

  - Verify data loading
  - Test earnings calculations
  - Check analytics display

- **Content Management**
  - Create payment links
  - Generate QR codes
  - Test link functionality

#### Component Tests

- **Creator UI Components**
  - Test charts and graphs
  - Verify settings forms

### 7. Fan Features

#### End-to-End Tests

- **Creator Discovery**

  - Browse creators
  - Filter and search

- **Fan Transactions**
  - Make payments
  - View transaction history
  - Manage subscriptions

## Test Implementation Examples

### Cypress End-to-End Test Example

```javascript
// cypress/e2e/payment.cy.js
describe("Creator Payment Flow", () => {
  beforeEach(() => {
    // Set up test user with wallet balance
    cy.setupTestUser({ role: "FAN", walletBalance: 100 });
    cy.login();
  });

  it("should successfully pay a creator", () => {
    // Visit a creator's payment page
    cy.visit("/pay/@testcreator");

    // Enter payment amount
    cy.findByLabelText(/amount/i).type("25");

    // Add a description
    cy.findByLabelText(/description/i).type("Test payment");

    // Submit the payment
    cy.findByRole("button", { name: /pay/i }).click();

    // Verify success message
    cy.findByText(/payment successful/i).should("be.visible");

    // Verify wallet balance was updated
    cy.visit("/dashboard");
    cy.findByText(/\$75\.00/i).should("be.visible");

    // Verify transaction appears in history
    cy.findByRole("button", { name: /history/i }).click();
    cy.findByText(/test payment/i).should("be.visible");
    cy.findByText(/\$25\.00/i).should("be.visible");
  });

  it("should handle insufficient funds", () => {
    // Set up user with low balance
    cy.setupTestUser({ role: "FAN", walletBalance: 5 });
    cy.login();

    // Visit a creator's payment page
    cy.visit("/pay/@testcreator");

    // Enter payment amount higher than balance
    cy.findByLabelText(/amount/i).type("25");

    // Submit the payment
    cy.findByRole("button", { name: /pay/i }).click();

    // Verify error message
    cy.findByText(/insufficient funds/i).should("be.visible");

    // Verify top-up modal appears
    cy.findByRole("dialog").within(() => {
      cy.findByText(/add funds/i).should("be.visible");
    });
  });
});
```

### Jest Component Test Example

```javascript
// __tests__/components/payments/PayCreatorForm.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import PayCreatorForm from "../../../components/payments/PayCreatorForm";
import { AuthProvider } from "../../../contexts/AuthContext";

// Mock the API responses
const server = setupServer(
  rest.post("http://localhost:3001/fans/pay-by-alias", (req, res, ctx) => {
    const { amount } = req.body;

    if (amount > 50) {
      return res(
        ctx.status(400),
        ctx.json({ message: "Amount exceeds maximum allowed" })
      );
    }

    return res(ctx.status(200), ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock the auth context
jest.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "test-user-id",
      wallet: { balance: 100 },
    },
    updateUserData: jest.fn(() => Promise.resolve({ success: true })),
  }),
}));

describe("PayCreatorForm", () => {
  it("renders the form correctly", () => {
    render(<PayCreatorForm creatorAlias='testcreator' />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay/i })).toBeInTheDocument();
  });

  it("submits payment successfully", async () => {
    const onSuccess = jest.fn();
    render(<PayCreatorForm creatorAlias='testcreator' onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/amount/i), "25");
    await userEvent.type(screen.getByLabelText(/description/i), "Test payment");

    await userEvent.click(screen.getByRole("button", { name: /pay/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(25);
    });
  });

  it("shows error when payment fails", async () => {
    const onError = jest.fn();
    render(<PayCreatorForm creatorAlias='testcreator' onError={onError} />);

    await userEvent.type(screen.getByLabelText(/amount/i), "75");
    await userEvent.click(screen.getByRole("button", { name: /pay/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Amount exceeds maximum allowed");
      expect(
        screen.getByText(/amount exceeds maximum allowed/i)
      ).toBeInTheDocument();
    });
  });
});
```

## Implementation Plan

### 1. Setup Testing Infrastructure (Week 1)

- Install and configure Cypress
- Set up Jest for component testing
- Configure MSW for API mocking
- Create test utilities and helpers

### 2. Authentication Testing (Week 2)

- Implement login flow tests
- Test token handling and session management
- Verify protected routes

### 3. Core Feature Testing (Weeks 3-6)

- Implement wallet and payment tests
- Create escrow flow tests
- Build dispute resolution tests
- Test notification delivery and management

### 4. Specialized Feature Testing (Weeks 7-8)

- Implement creator-specific tests
- Create fan-specific tests
- Test admin functionality

### 5. CI Integration (Week 9)

- Set up GitHub Actions workflows
- Configure test reporting
- Implement coverage tracking

### 6. Documentation & Maintenance (Week 10)

- Complete test documentation
- Create test data maintenance plan
- Train team on testing framework

## Test Environment Setup

### Test Database

Create a separate test database with:

- Test users with different roles
- Predefined wallet balances
- Sample escrow agreements
- Example disputes in various states

### Environment Configuration

Create a `.env.test` file:

```
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Test User Credentials
TEST_FAN_EMAIL=fan@test.com
TEST_FAN_PASSWORD=test123
TEST_CREATOR_EMAIL=creator@test.com
TEST_CREATOR_PASSWORD=test123
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=test123

# Stripe Test Keys
NEXT_PUBLIC_STRIPE_KEY=pk_test_your_test_key
```

## Best Practices

1. **Deterministic Tests**

   - Always reset state between tests
   - Use unique identifiers for test data
   - Avoid dependencies between tests

2. **Performance**

   - Group related tests to minimize setup/teardown
   - Use API shortcuts when possible instead of UI flows
   - Mock expensive operations when appropriate

3. **Maintainability**

   - Use custom commands for common operations
   - Avoid brittle selectors (prefer accessibility roles)
   - Keep tests focused on one behavior each

4. **Readability**
   - Use descriptive test names
   - Structure tests as arrange-act-assert
   - Comment complex test logic

## Conclusion

This comprehensive testing approach will ensure that the UNDR platform's frontend and backend work seamlessly together. By testing each integration point and user flow, we can deliver a reliable and consistent user experience.

As you connect the frontend and backend components, run the corresponding tests to verify functionality. This practice will catch integration issues early and provide confidence in the stability of new features.
