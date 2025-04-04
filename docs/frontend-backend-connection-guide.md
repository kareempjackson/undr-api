# Frontend-Backend Connection Guide

## Overview

This document provides a comprehensive guide for connecting the UNDR frontend and backend components. It outlines the key integration points, implementation details, and recommended testing approach for each feature area.

## Current Implementation Status

### Backend (✅ Mostly Complete)

The backend API includes implementations for:

- Authentication system (Magic Link)
- Wallet and payment processing
- Escrow system with milestones
- Dispute resolution
- Notification system
- Creator/Fan-specific features

### Frontend (⚠️ Partial Implementation)

The frontend includes:

- Page structures and components
- UI flows and form layouts
- Mock data representations
- Basic API service structure

### Integration Gaps (❌ Needs Implementation)

- Actual API calls from frontend to backend instead of mock data
- WebSocket connection for real-time notifications
- Error handling for network issues
- Proper token management and session handling

## Connection Strategy

The connection between frontend and backend will be implemented feature by feature, with testing at each stage:

1. **Core Authentication**
2. **Wallet & Basic Payments**
3. **Creator Profiles & Payment Links**
4. **Escrow System**
5. **Dispute Resolution**
6. **Real-time Notifications**
7. **Analytics & Reporting**

## Implementation Details

### 1. API Service Layer

The foundation of the frontend-backend connection is the API service layer. We'll extend the existing `api.ts` with dedicated modules for each feature area:

```typescript
// services/api.ts (base configuration)
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

Create specialized service modules for each feature area:

```typescript
// services/authApi.ts
import api from "./api";

export const authApi = {
  login: (email: string) => api.post("/auth/login", { email }),
  verifyMagicLink: (token: string) => api.post("/auth/verify", { token }),
  getCurrentUser: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// services/walletApi.ts
import api from "./api";

export const walletApi = {
  getBalance: () => api.get("/payments/wallet/balance"),
  getTransactions: (params = {}) =>
    api.get("/payments/wallet/transactions", { params }),
  topUp: (amount: number, paymentMethodId: string) =>
    api.post("/fans/deposit", { amount, paymentMethodId }),
  withdraw: (amount: number, destination: string) =>
    api.post("/payments/wallet/withdraw", { amount, destination }),
};

// Additional service modules for escrow, disputes, etc.
```

### 2. Authentication Integration

Replace mock authentication in `AuthContext.tsx` with real API calls:

```typescript
// contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../services/authApi";

// ...existing context setup...

const login = async (email: string): Promise<boolean> => {
  try {
    setLoading(true);

    // For development mode only
    if (devModeEnabled && isDevelopment) {
      setUser(DEV_USERS[currentDevRole]);
      setLoading(false);
      return true;
    }

    // Real API call
    await authApi.login(email);
    setLoading(false);
    return true;
  } catch (error) {
    setError(error.response?.data?.message || "Failed to send login link");
    setLoading(false);
    return false;
  }
};

const verifyMagicLink = async (token: string): Promise<boolean> => {
  try {
    setLoading(true);

    // For development mode only
    if (devModeEnabled && isDevelopment) {
      setUser(DEV_USERS[currentDevRole]);
      localStorage.setItem("token", "dev-token");
      setLoading(false);
      return true;
    }

    // Real API call
    const response = await authApi.verifyMagicLink(token);

    // Store the JWT token
    localStorage.setItem("token", response.data.token);

    // Get user data
    const { data: userData } = await authApi.getCurrentUser();
    setUser(normalizeUserData(userData));

    setLoading(false);
    return true;
  } catch (error) {
    setError(error.response?.data?.message || "Invalid or expired link");
    setLoading(false);
    return false;
  }
};

// ...other methods using real API calls...
```

### 3. Creator Payment Flow

Replace mock payment data with real API calls:

```typescript
// components/payments/PayCreatorForm.tsx
import { useState } from "react";
import { fanApi } from "../../services/fanApi";
import { useAuth } from "../../contexts/AuthContext";

// ...component setup...

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user || amount < 1 || user.wallet.balance < amount) {
    // Handle validation errors
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    // Real API call
    await fanApi.payByAlias(creatorAlias, amount, description);

    // Update user data to reflect new balance
    await updateUserData();

    // Reset form and trigger success callback
    setAmount(10);
    setDescription("");
    onSuccess?.(amount);
  } catch (error) {
    setError(error.response?.data?.message || "Payment failed");
    onError?.(error.response?.data?.message || "Payment failed");
  } finally {
    setIsLoading(false);
  }
};

// ...rest of component...
```

### 4. Escrow Management

Replace mock escrow data with real API calls:

```typescript
// pages/creator/escrow.tsx
import { useState, useEffect } from "react";
import { escrowApi } from "../../services/escrowApi";

// ...component setup...

useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push("/auth/login?redirect=/creator/escrow");
    return;
  }

  // Fetch real escrow data
  const fetchEscrows = async () => {
    setIsLoading(true);
    try {
      const response = await escrowApi.getEscrows();
      setEscrowTransactions(response.data.escrows);
    } catch (error) {
      console.error("Failed to fetch escrow data:", error);
      showToast("Failed to load escrow data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  fetchEscrows();
}, [isAuthenticated, loading, router, showToast]);

const handleDeliveryConfirm = async (transaction) => {
  setSelectedTransaction(transaction);
  setDeliveryNote("");
  setShowDeliveryModal(true);
};

const submitDeliveryConfirmation = async () => {
  if (!selectedTransaction) return;

  setIsLoading(true);
  try {
    // Real API call
    await escrowApi.submitProof(
      selectedTransaction.id,
      selectedTransaction.currentMilestoneId,
      { description: deliveryNote }
    );

    // Refresh escrow list
    const response = await escrowApi.getEscrows();
    setEscrowTransactions(response.data.escrows);

    setShowDeliveryModal(false);
    setSelectedTransaction(null);
    showToast("Delivery confirmation sent successfully!", "success");
  } catch (error) {
    showToast(
      error.response?.data?.message || "Failed to submit proof",
      "error"
    );
  } finally {
    setIsLoading(false);
  }
};

// ...rest of component...
```

### 5. Real-time Notifications

Implement WebSocket connection for real-time notifications:

```typescript
// services/notificationService.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectToNotifications = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log("Connected to notification server");
    socket.emit("subscribe_notifications");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from notification server");
  });

  return socket;
};

export const disconnectFromNotifications = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getNotificationSocket = (): Socket | null => socket;
```

Use in a notification context:

```typescript
// contexts/NotificationContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  connectToNotifications,
  disconnectFromNotifications,
} from "../services/notificationService";
import { notificationApi } from "../services/notificationApi";

// Context setup...

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("token");
      if (token) {
        const socket = connectToNotifications(token);

        socket.on("notification", (newNotification) => {
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        });

        socket.on("unread_count", (count) => {
          setUnreadCount(count);
        });

        // Initial fetch of notifications
        fetchNotifications();
      }
    }

    return () => {
      disconnectFromNotifications();
    };
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      setNotifications(response.data.notifications);

      const unreadResponse = await notificationApi.getUnreadCount();
      setUnreadCount(unreadResponse.data.count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Rest of context methods...

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        // Other context values...
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
```

## Integration Testing

As you implement each integration point, create corresponding tests as outlined in the [Frontend-Backend Integration Testing Guide](./frontend-backend-integration-testing-guide.md).

### Testing Example for Authentication

```javascript
// cypress/e2e/auth.cy.js
describe("Authentication Flow", () => {
  it("should request a magic link and verify token", () => {
    // Visit login page
    cy.visit("/auth/login");

    // Enter email
    cy.findByLabelText(/email/i).type("test@example.com");

    // Submit login form
    cy.findByRole("button", { name: /send magic link/i }).click();

    // Verify success message
    cy.findByText(/check your email/i).should("be.visible");

    // Mock magic link verification (in real test, get from API or DB)
    const fakeToken = "test-token-123";

    // Visit verification URL
    cy.visit(`/auth/verify?token=${fakeToken}`);

    // Should redirect to dashboard after verification
    cy.url().should("include", "/dashboard");

    // User should be logged in
    cy.findByText(/Welcome back/i).should("be.visible");
  });
});
```

## Deployment Considerations

1. **Environment Configuration**

   - Ensure frontend has correct API URL for each environment
   - Configure CORS settings on backend to allow frontend domains

2. **Error Monitoring**

   - Implement error tracking with a service like Sentry
   - Log all API failures for debugging

3. **Performance Monitoring**
   - Track API response times
   - Monitor WebSocket connections

## Conclusion

By following this guide, you'll systematically replace mock data with real API calls throughout the frontend application. The step-by-step approach ensures that each integration point is properly tested before moving to the next feature.

Start with the authentication flow, then implement wallet and payment functionality, followed by escrow management, dispute resolution, and finally real-time notifications.

As you connect each component, create corresponding tests to ensure functionality remains consistent and regressions don't occur when implementing new features.
