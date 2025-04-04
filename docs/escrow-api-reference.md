# Escrow API Reference

This document provides a comprehensive reference for the Escrow API endpoints.

## Authentication

All API requests require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Create Escrow

Creates a new escrow agreement between a buyer and seller.

**URL**: `/security/escrows`

**Method**: `POST`

**Auth required**: Yes (Buyer)

**Request Body**:

```json
{
  "title": "Project Title",
  "description": "Project Description",
  "totalAmount": 100,
  "sellerId": "UUID-of-seller",
  "expirationDays": 30,
  "milestones": [
    {
      "amount": 100,
      "description": "Complete project",
      "sequence": 1
    }
  ],
  "terms": {
    "customField": "Custom terms"
  },
  "documents": ["document-url1", "document-url2"]
}
```

**Response**: `201 Created`

```json
{
  "id": "UUID",
  "title": "Project Title",
  "description": "Project Description",
  "totalAmount": "100.00",
  "buyerId": "UUID-of-buyer",
  "sellerId": "UUID-of-seller",
  "status": "PENDING",
  "expiresAt": "2025-04-21T12:00:00.000Z",
  "scheduleReleaseAt": "2025-03-25T12:00:00.000Z",
  "createdAt": "2025-03-22T12:00:00.000Z",
  "updatedAt": "2025-03-22T12:00:00.000Z",
  "milestones": [
    {
      "id": "UUID",
      "escrowId": "UUID",
      "amount": "100.00",
      "description": "Complete project",
      "status": "PENDING",
      "sequence": 1,
      "createdAt": "2025-03-22T12:00:00.000Z",
      "updatedAt": "2025-03-22T12:00:00.000Z"
    }
  ]
}
```

### Fund Escrow

Funds an escrow by transferring money from the buyer's wallet to the escrow.

**URL**: `/security/escrows/:id/fund`

**Method**: `POST`

**Auth required**: Yes (Buyer)

**URL Parameters**:

- `id`: Escrow ID

**Request Body**: Empty object `{}`

**Response**: `200 OK`

```json
{
  "id": "UUID",
  "status": "FUNDED",
  "paymentId": "UUID-of-payment",
  "updatedAt": "2025-03-22T12:01:00.000Z"
}
```

### Submit Delivery Proof

Allows the seller to submit proof of delivery/completion.

**URL**: `/security/escrows/:id/proof`

**Method**: `POST`

**Auth required**: Yes (Seller)

**URL Parameters**:

- `id`: Escrow ID

**Request Body**:

```json
{
  "type": "TEXT",
  "description": "Project completed as requested",
  "files": ["file-url1", "file-url2"],
  "metadata": {
    "custom": "data"
  }
}
```

**Response**: `201 Created`

```json
{
  "id": "UUID",
  "escrowId": "UUID",
  "submittedById": "UUID-of-seller",
  "type": "TEXT",
  "description": "Project completed as requested",
  "files": ["file-url1", "file-url2"],
  "status": "PENDING",
  "metadata": {
    "custom": "data"
  },
  "createdAt": "2025-03-22T12:02:00.000Z",
  "updatedAt": "2025-03-22T12:02:00.000Z"
}
```

### Review Delivery Proof

Allows the buyer to review and accept/reject a delivery proof.

**URL**: `/security/escrows/proof/:proofId/review`

**Method**: `POST`

**Auth required**: Yes (Buyer)

**URL Parameters**:

- `proofId`: Delivery Proof ID

**Request Body**:

```json
{
  "approved": true,
  "rejectionReason": "Only required if approved is false"
}
```

**Response**: `200 OK`

```json
{
  "id": "UUID",
  "escrowId": "UUID",
  "status": "ACCEPTED",
  "reviewedById": "UUID-of-buyer",
  "reviewedAt": "2025-03-22T12:03:00.000Z",
  "updatedAt": "2025-03-22T12:03:00.000Z"
}
```

### Complete Escrow

Manually completes an escrow and releases funds to the seller.

**URL**: `/security/escrows/:id/complete`

**Method**: `POST`

**Auth required**: Yes (Buyer)

**URL Parameters**:

- `id`: Escrow ID

**Request Body**: Empty object `{}`

**Response**: `200 OK`

```json
{
  "id": "UUID",
  "status": "COMPLETED",
  "completedAt": "2025-03-22T12:04:00.000Z",
  "updatedAt": "2025-03-22T12:04:00.000Z"
}
```

### Cancel Escrow

Cancels an escrow and refunds the buyer if already funded.

**URL**: `/security/escrows/:id/cancel`

**Method**: `POST`

**Auth required**: Yes (Buyer or Seller)

**URL Parameters**:

- `id`: Escrow ID

**Request Body**: Empty object `{}`

**Response**: `200 OK`

```json
{
  "id": "UUID",
  "status": "CANCELLED",
  "updatedAt": "2025-03-22T12:05:00.000Z"
}
```

### Get Escrows

Retrieves a list of escrows for the authenticated user.

**URL**: `/security/escrows`

**Method**: `GET`

**Auth required**: Yes

**Query Parameters**:

- `status`: Filter by status (optional)
- `limit`: Maximum number of results (optional)
- `offset`: Pagination offset (optional)

**Response**: `200 OK`

```json
{
  "escrows": [
    {
      "id": "UUID",
      "title": "Project Title",
      "totalAmount": "100.00",
      "status": "FUNDED",
      "buyerId": "UUID",
      "sellerId": "UUID",
      "createdAt": "2025-03-22T12:00:00.000Z",
      "updatedAt": "2025-03-22T12:01:00.000Z",
      "milestones": [
        {
          "id": "UUID",
          "amount": "100.00",
          "description": "Complete project",
          "status": "PENDING",
          "sequence": 1
        }
      ]
    }
  ],
  "total": 1
}
```

### Get Escrow by ID

Retrieves a specific escrow by ID.

**URL**: `/security/escrows/:id`

**Method**: `GET`

**Auth required**: Yes (Buyer or Seller of the escrow)

**URL Parameters**:

- `id`: Escrow ID

**Response**: `200 OK`

```json
{
  "id": "UUID",
  "title": "Project Title",
  "description": "Project Description",
  "totalAmount": "100.00",
  "buyerId": "UUID",
  "sellerId": "UUID",
  "status": "FUNDED",
  "expiresAt": "2025-04-21T12:00:00.000Z",
  "scheduleReleaseAt": "2025-03-25T12:00:00.000Z",
  "createdAt": "2025-03-22T12:00:00.000Z",
  "updatedAt": "2025-03-22T12:01:00.000Z",
  "milestones": [
    {
      "id": "UUID",
      "amount": "100.00",
      "description": "Complete project",
      "status": "PENDING",
      "sequence": 1
    }
  ]
}
```

### Get Escrow Proofs

Retrieves all delivery proofs for an escrow.

**URL**: `/security/escrows/:id/proofs`

**Method**: `GET`

**Auth required**: Yes (Buyer or Seller of the escrow)

**URL Parameters**:

- `id`: Escrow ID

**Response**: `200 OK`

```json
[
  {
    "id": "UUID",
    "escrowId": "UUID",
    "submittedById": "UUID",
    "type": "TEXT",
    "description": "Project completed as requested",
    "files": ["file-url1", "file-url2"],
    "status": "ACCEPTED",
    "reviewedById": "UUID",
    "reviewedAt": "2025-03-22T12:03:00.000Z",
    "createdAt": "2025-03-22T12:02:00.000Z",
    "updatedAt": "2025-03-22T12:03:00.000Z"
  }
]
```

### Update Milestone Status

Updates the status of a specific milestone.

**URL**: `/security/escrows/:escrowId/milestones/:milestoneId`

**Method**: `PATCH`

**Auth required**: Yes (Buyer for completion, Buyer or Seller for disputes)

**URL Parameters**:

- `escrowId`: Escrow ID
- `milestoneId`: Milestone ID

**Request Body**:

```json
{
  "status": "COMPLETED"
}
```

**Response**: `200 OK`

```json
{
  "id": "UUID",
  "escrowId": "UUID",
  "amount": "100.00",
  "description": "Complete project",
  "status": "COMPLETED",
  "sequence": 1,
  "completedAt": "2025-03-22T12:06:00.000Z",
  "updatedAt": "2025-03-22T12:06:00.000Z"
}
```

## Dispute Resolution API

### Create Dispute

**URL**: `/security/disputes`  
**Method**: `POST`  
**Auth Required**: Yes (JWT Token)

**Request Body**:

```json
{
  "escrowId": "uuid",
  "reason": "string",
  "details": {
    // Optional additional details about the dispute
  }
}
```

**Response**:

```json
{
  "id": "uuid",
  "escrowId": "uuid",
  "createdById": "uuid",
  "reason": "string",
  "status": "EVIDENCE_SUBMISSION",
  "details": {},
  "evidenceDeadline": "2023-07-20T00:00:00.000Z",
  "createdAt": "2023-07-15T00:00:00.000Z",
  "updatedAt": "2023-07-15T00:00:00.000Z"
}
```

### Submit Dispute Evidence

**URL**: `/security/disputes/:disputeId/evidence`  
**Method**: `POST`  
**Auth Required**: Yes (JWT Token)

**Request Body**:

```json
{
  "type": "TEXT | IMAGE | DOCUMENT | VIDEO | OTHER",
  "description": "string",
  "files": [
    // Optional array of file references
  ]
}
```

**Response**:

```json
{
  "id": "uuid",
  "disputeId": "uuid",
  "submittedById": "uuid",
  "type": "TEXT",
  "description": "string",
  "files": [],
  "createdAt": "2023-07-15T00:00:00.000Z",
  "updatedAt": "2023-07-15T00:00:00.000Z"
}
```

### Send Dispute Message

**URL**: `/security/disputes/:disputeId/messages`  
**Method**: `POST`  
**Auth Required**: Yes (JWT Token)

**Request Body**:

```json
{
  "message": "string",
  "metadata": {
    // Optional additional data
  }
}
```

**Response**:

```json
{
  "id": "uuid",
  "disputeId": "uuid",
  "senderId": "uuid",
  "message": "string",
  "isSystemMessage": false,
  "metadata": {},
  "createdAt": "2023-07-15T00:00:00.000Z",
  "updatedAt": "2023-07-15T00:00:00.000Z"
}
```

### Propose Dispute Resolution

**URL**: `/security/disputes/:disputeId/propose-resolution`  
**Method**: `POST`  
**Auth Required**: Yes (JWT Token)

**Request Body**:

```json
{
  "resolution": "BUYER_REFUND | SELLER_RECEIVE | SPLIT | CUSTOM",
  "buyerAmount": 60, // Optional, required for SPLIT or CUSTOM
  "sellerAmount": 40, // Optional, required for SPLIT or CUSTOM
  "details": {
    // Optional additional details about the proposal
  }
}
```

**Response**: Dispute object

### Accept Resolution

**URL**: `/security/disputes/:disputeId/accept-resolution`  
**Method**: `POST`  
**Auth Required**: Yes (JWT Token)

**Response**: Dispute object with updated status

### Admin Resolve Dispute

**URL**: `/security/disputes/:disputeId/admin-resolve`  
**Method**: `POST`  
**Auth Required**: Yes (JWT Token) + Admin rights

**Request Body**:

```json
{
  "resolution": "BUYER_REFUND | SELLER_RECEIVE | SPLIT | CUSTOM",
  "buyerAmount": 60, // Optional, required for SPLIT or CUSTOM
  "sellerAmount": 40, // Optional, required for SPLIT or CUSTOM
  "notes": "string" // Optional administrative notes
}
```

**Response**: Dispute object with updated status

### Get Dispute Details

**URL**: `/security/disputes/:disputeId`  
**Method**: `GET`  
**Auth Required**: Yes (JWT Token)

**Response**:

```json
{
  "dispute": {
    // Dispute details
  },
  "evidence": [
    // Array of evidence submissions
  ],
  "messages": [
    // Array of dispute messages
  ],
  "escrow": {
    // Related escrow details
  }
}
```

### Get User Disputes

**URL**: `/security/disputes`  
**Method**: `GET`  
**Auth Required**: Yes (JWT Token)

**Query Parameters**:

- `status`: (Optional) Filter by dispute status

**Response**: Array of dispute objects

### Get Dispute Evidence

**URL**: `/security/disputes/:disputeId/evidence`  
**Method**: `GET`  
**Auth Required**: Yes (JWT Token)

**Response**: Array of evidence objects

### Get Dispute Messages

**URL**: `/security/disputes/:disputeId/messages`  
**Method**: `GET`  
**Auth Required**: Yes (JWT Token)

**Response**: Array of message objects

## Error Responses

The API uses the following error codes:

- `400 Bad Request` - The request is malformed or contains invalid parameters
- `401 Unauthorized` - Authentication failed or token is invalid
- `403 Forbidden` - The authenticated user doesn't have permission to perform the action
- `404 Not Found` - The requested resource doesn't exist
- `500 Internal Server Error` - An unexpected error occurred

Error Response Format:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```
