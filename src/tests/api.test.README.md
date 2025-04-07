# UNDR API Testing Suite

This directory contains the API end-to-end tests for the UNDR application backend. The tests use Jest and Supertest to validate API endpoints against a running instance of the application.

## Test Coverage

The API tests cover the following core features:

1. **Authentication API** (`auth.api.spec.ts`)

   - User registration
   - Login
   - Current user retrieval
   - Password reset
   - Email verification
   - Password change
   - Logout

2. **Users API** (`users.api.spec.ts`)

   - User profile retrieval
   - User listing (admin)
   - Profile updates
   - User search
   - Status and role updates (admin)
   - Avatar uploads

3. **Payments API** (`payments.api.spec.ts`)

   - Creating payments
   - Retrieving payment details
   - Payment history listing
   - Filtering payments
   - Canceling pending payments
   - Admin payment management

4. **Escrow API** (`escrow.api.spec.ts`)
   - Creating escrow agreements
   - Retrieving escrow details
   - Escrow listing and filtering
   - Status updates
   - Milestone management
   - Document uploads
   - Admin escrow management

## Running Tests

### Prerequisites

- Node.js (v16+)
- npm or yarn
- A running PostgreSQL instance for tests

### Environment Setup

1. Create a `.env.test` file in the project root with test database configuration:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=undr_test
JWT_SECRET=test_secret
```

2. Install dependencies:

```bash
npm install
```

### Running All API Tests

To run all API tests:

```bash
npm run test:api
```

### Running Specific Test Files

To run a specific test file:

```bash
npm run test:api -- auth.api.spec.ts
```

## Test Structure

Each test suite follows this structure:

1. **Setup**: Create a test application module and necessary test data
2. **Before/After Hooks**: Initialize and clean up the test environment
3. **Test Cases**: Individual tests for specific API operations
4. **Clean Up**: Remove test data after tests complete

## Test Practices

The tests follow these practices:

1. **Isolation**: Each test runs in isolation and does not depend on other tests
2. **Realistic Data**: Uses realistic data structures similar to production
3. **Complete Coverage**: Tests happy paths, error cases, and edge conditions
4. **Authentication**: Tests proper authentication and authorization for endpoints
5. **Database Validation**: Verifies database state changes after operations

## Adding New Tests

When adding new tests:

1. Create a new file in the `tests/api` directory following the naming pattern `feature-name.api.spec.ts`
2. Import necessary modules and setup test application
3. Define test data and repository access
4. Write test cases for each endpoint and operation
5. Ensure proper cleanup after tests

## Test Data Management

For consistent testing:

1. **Unique Data**: Use timestamps in email addresses and other identifiers to avoid conflicts
2. **Cleanup**: Delete all test data in the `afterAll` hooks
3. **Realistic Relationships**: Properly establish entity relationships in test data

## Troubleshooting

If tests are failing:

1. Verify that the test database exists and is accessible
2. Check that entity types match expected database schema
3. Ensure JWT secret is properly configured
4. Confirm that all required environment variables are set
5. Check that API endpoints match those in the tests
