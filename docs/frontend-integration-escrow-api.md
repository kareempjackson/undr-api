# Escrow System Frontend Integration Guide

This document provides a comprehensive guide for frontend developers to integrate with the escrow system API.

## Overview

The escrow system enables secure transactions between buyers and sellers by holding funds in a trusted account until delivery conditions are met. The system supports:

- Creating escrow agreements
- Funding escrows
- Submitting proof of delivery
- Reviewing proofs
- Managing milestones
- Completing or canceling escrows

## Authentication

All API endpoints require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Create Escrow

Creates a new escrow agreement between a buyer and seller.

**Endpoint:** `POST /security/escrows`

**Request Body:**

```json
{
  "title": "Project Title",
  "description": "Detailed description of the project",
  "totalAmount": 1000,
  "sellerId": "uuid-of-seller",
  "expirationDays": 30,
  "milestones": [
    {
      "amount": 500,
      "description": "Phase 1 completion",
      "sequence": 1
    },
    {
      "amount": 500,
      "description": "Final delivery",
      "sequence": 2
    }
  ],
  "terms": {
    "cancelationPolicy": "Funds will be returned if canceled within 48 hours",
    "deliveryExpectations": "Delivery expected within 14 days"
  },
  "documents": ["url-to-document1", "url-to-document2"]
}
```

**Response:** Returns the created escrow object with status `PENDING`.

### 2. Fund Escrow

Transfers funds from the buyer's wallet to the escrow account.

**Endpoint:** `POST /security/escrows/:id/fund`

**URL Parameters:**

- `id`: The ID of the escrow to fund

**Response:** Returns the updated escrow object with status `FUNDED`.

### 3. Submit Delivery Proof

Allows the seller to submit proof that they have delivered the product or service.

**Endpoint:** `POST /security/escrows/:id/proof`

**URL Parameters:**

- `id`: The ID of the escrow

**Request Body:**

```json
{
  "type": "IMAGE", // Can be IMAGE, DOCUMENT, VIDEO, LINK, or TEXT
  "description": "Photo of the completed product",
  "files": ["url-to-file1", "url-to-file2"],
  "metadata": {
    "dimensions": "10x12",
    "color": "blue",
    "additionalNotes": "Please check the quality of the finish"
  }
}
```

**Response:** Returns the created delivery proof object with status `PENDING`.

### 4. Get Escrow Proofs

Retrieves all proofs associated with an escrow.

**Endpoint:** `GET /security/escrows/:id/proofs`

**URL Parameters:**

- `id`: The ID of the escrow

**Response:** Returns an array of delivery proof objects.

### 5. Review Delivery Proof

Allows the buyer to accept or reject a submitted proof.

**Endpoint:** `PATCH /security/escrows/proofs/:proofId`

**URL Parameters:**

- `proofId`: The ID of the proof to review

**Request Body:**

```json
{
  "decision": "accept", // or "reject"
  "rejectionReason": "Product does not match the specifications" // Required if decision is "reject"
}
```

**Response:** Returns the updated proof object with status `ACCEPTED` or `REJECTED`.

### 6. Complete Escrow

Finalizes the escrow and releases funds to the seller.

**Endpoint:** `POST /security/escrows/:id/complete`

**URL Parameters:**

- `id`: The ID of the escrow to complete

**Response:** Returns the updated escrow object with status `COMPLETED`.

### 7. Cancel Escrow

Cancels the escrow and returns funds to the buyer.

**Endpoint:** `POST /security/escrows/:id/cancel`

**URL Parameters:**

- `id`: The ID of the escrow to cancel

**Response:** Returns the updated escrow object with status `CANCELLED`.

### 8. Get User Escrows

Retrieves all escrows associated with the authenticated user.

**Endpoint:** `GET /security/escrows`

**Query Parameters:**

- `status`: Filter by escrow status (optional)
- `limit`: Maximum number of escrows to return (optional, default: 10)
- `offset`: Number of escrows to skip (optional, default: 0)

**Response:**

```json
{
  "escrows": [
    {
      "id": "escrow-uuid",
      "title": "Project Title",
      "totalAmount": 1000,
      "status": "FUNDED",
      "buyerId": "buyer-uuid",
      "sellerId": "seller-uuid",
      "createdAt": "2023-07-01T12:00:00Z",
      "expiresAt": "2023-08-01T12:00:00Z"
    }
  ],
  "total": 15
}
```

### 9. Get Escrow Details

Retrieves details for a specific escrow.

**Endpoint:** `GET /security/escrows/:id`

**URL Parameters:**

- `id`: The ID of the escrow

**Response:** Returns the detailed escrow object, including milestones and related data.

## Status Codes and Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User does not have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses will include a JSON body with:

```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Error code or type"
}
```

## Transaction Flow Examples

### Complete Transaction Flow (Happy Path)

1. Buyer creates an escrow (`POST /security/escrows`)
2. Buyer funds the escrow (`POST /security/escrows/:id/fund`)
3. Seller submits delivery proof (`POST /security/escrows/:id/proof`)
4. Buyer reviews and accepts the proof (`PATCH /security/escrows/proofs/:proofId`)
5. Escrow is automatically completed and funds are released to the seller

### Dispute Flow

1. Buyer creates an escrow (`POST /security/escrows`)
2. Buyer funds the escrow (`POST /security/escrows/:id/fund`)
3. Seller submits delivery proof (`POST /security/escrows/:id/proof`)
4. Buyer reviews and rejects the proof with a reason (`PATCH /security/escrows/proofs/:proofId`)
5. Seller submits new proof addressing the issues
6. Buyer accepts the new proof
7. Escrow is completed

## Frontend Implementation Tips

1. **Real-time updates**: Consider using WebSockets or polling to get real-time updates on escrow status changes.

2. **Form validation**: Implement client-side validation matching the server's requirements to provide immediate feedback.

3. **File uploads**: For proof submission, implement secure file upload to your storage service before sending the URLs to the API.

4. **User roles**: Implement different UI views based on whether the user is a buyer or seller in the escrow.

5. **Error handling**: Provide user-friendly error messages based on the API's error responses.

6. **Loading states**: Show appropriate loading indicators during API calls to improve user experience.

7. **Confirmation dialogs**: Use confirmation dialogs for critical actions like funding, completing, or canceling escrows.

## Testing the API

To test the API endpoints, you can use the provided Swagger documentation at `/api` when the server is running locally. This interactive documentation allows you to try out API calls directly from your browser.

Alternatively, you can use tools like Postman or curl to make requests to the API endpoints.

## Example: Creating and funding an escrow with React

```javascript
// Example using React and Axios
import axios from "axios";

const API_BASE_URL = "http://localhost:3001";
const token = localStorage.getItem("token");

const createEscrow = async (escrowData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/security/escrows`,
      escrowData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating escrow:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const fundEscrow = async (escrowId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/security/escrows/${escrowId}/fund`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error funding escrow:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Example usage
const handleCreateAndFundEscrow = async () => {
  const escrowData = {
    title: "Website Development Project",
    description: "Create a responsive website with modern design",
    totalAmount: 2000,
    sellerId: "seller-uuid",
    expirationDays: 30,
    milestones: [
      {
        amount: 1000,
        description: "Frontend development",
        sequence: 1,
      },
      {
        amount: 1000,
        description: "Backend integration",
        sequence: 2,
      },
    ],
  };

  try {
    // Step 1: Create the escrow
    const newEscrow = await createEscrow(escrowData);
    console.log("Escrow created:", newEscrow);

    // Step 2: Fund the escrow
    const fundedEscrow = await fundEscrow(newEscrow.id);
    console.log("Escrow funded:", fundedEscrow);

    // Update UI or redirect user
  } catch (error) {
    // Handle error in UI
  }
};
```
