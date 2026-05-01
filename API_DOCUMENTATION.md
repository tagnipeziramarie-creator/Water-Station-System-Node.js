# Water Station API - Complete Documentation

## Quick Links
- [Installation & Setup](README.md)
- [Aiven MySQL Setup](AIVEN_SETUP.md)
- [GitHub & Deployment](GITHUB_SETUP.md)

## API Endpoints

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "09123456789",
  "address": "123 Main St",
  "barangay": "Barangay 1"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "userId": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "jwt-token-here"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": {
    "userId": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "jwt-token-here"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logout successful"
}
```

### Order Endpoints

#### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "product": "PROD-001",
  "quantity": 5,
  "delivery_address": "456 Customer Ave, Barangay 2",
  "total_price": 750.00
}

Response: 201 Created
{
  "message": "Order created successfully",
  "order": {
    "orderId": "uuid",
    "customer_id": "user-uuid",
    "order_date": "2026-04-28T10:00:00Z",
    "order_status": "pending",
    "product": "PROD-001",
    "quantity": 5,
    "delivery_address": "456 Customer Ave, Barangay 2",
    "total_price": 750.00,
    "payment": "pending"
  }
}
```

#### Get All Orders
```http
GET /orders
Authorization: Bearer <token>

Response: 200 OK
{
  "orders": [
    {
      "orderId": "uuid",
      "customer_id": "user-uuid",
      "order_date": "2026-04-28T10:00:00Z",
      "order_status": "pending",
      ...
    }
  ]
}
```

#### Get Order by ID
```http
GET /orders/:orderId
Authorization: Bearer <token>

Response: 200 OK
{
  "order": {
    "orderId": "uuid",
    ...
  }
}
```

### Payment Endpoints

#### Get Payment Status
```http
GET /payments/:orderId/status
Authorization: Bearer <token>

Response: 200 OK
{
  "payment": {
    "id": 1,
    "order_id": "order-uuid",
    "payment_method": "card",
    "payment_status": "pending",
    "amount": 750.00,
    "paymongo_checkout_id": "checkout-id"
  }
}
```

#### Create Checkout
```http
POST /payments/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-uuid",
  "amount": 750.00,
  "description": "Water Order #12345"
}

Response: 200 OK
{
  "message": "Checkout session created",
  "checkoutId": "checkout-session-id",
  "checkoutUrl": "https://checkout.paymongo.com/session/...",
  "payment": {
    "id": 1,
    "order_id": "order-uuid",
    "payment_status": "pending",
    "amount": 750.00
  }
}
```

#### PayMongo Success
```http
GET /payments/paymongo/success?checkout_id=<checkout_id>

Response: 200 OK
{
  "message": "Payment successful",
  "payment": {
    "id": 1,
    "order_id": "order-uuid",
    "payment_status": "completed",
    "paid_at": "2026-04-28T10:15:00Z"
  }
}
```

#### PayMongo Webhook (Public)
```http
POST /payments/webhooks/paymongo
Content-Type: application/json

[PayMongo webhook payload]

Response: 200 OK
{
  "success": true
}
```

### Delivery Endpoints

#### Get Delivery Dashboard
```http
GET /delivery/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "deliveries": [
    {
      "id": 1,
      "order_id": "order-uuid",
      "delivery_personnel_id": "user-uuid",
      "delivery_status": "pending",
      "scheduled_date": "2026-04-29T09:00:00Z",
      "delivery_address": "456 Customer Ave"
    }
  ]
}
```

#### Get Delivery History
```http
GET /delivery/history
Authorization: Bearer <token>

Response: 200 OK
{
  "deliveries": [
    {
      "id": 1,
      "order_id": "order-uuid",
      "delivery_status": "delivered",
      "delivered_date": "2026-04-28T15:30:00Z"
    }
  ]
}
```

#### Update Delivery Status
```http
PATCH /delivery/update/:deliveryId
Authorization: Bearer <token>
Content-Type: application/json

{
  "delivery_status": "in_transit"
}

Response: 200 OK
{
  "message": "Delivery status updated",
  "delivery": {
    "id": 1,
    "delivery_status": "in_transit"
  }
}
```

#### Mark Payment Received
```http
PATCH /delivery/payment/:deliveryId
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_amount": 750.00
}

Response: 200 OK
{
  "message": "Payment marked as received",
  "delivery": {
    "id": 1,
    "payment_received": true,
    "payment_amount": 750.00
  }
}
```

#### Assign Personnel (Admin Only)
```http
PATCH /delivery/assign/:deliveryId
Authorization: Bearer <token>
Content-Type: application/json

{
  "delivery_personnel_id": "user-uuid"
}

Response: 200 OK
{
  "message": "Personnel assigned",
  "delivery": {
    "id": 1,
    "delivery_personnel_id": "user-uuid"
  }
}
```

### Admin Endpoints

#### Get Dashboard
```http
GET /admin/dashboard
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "dashboard": {
    "totalOrders": 42,
    "totalRevenue": 25000.00,
    "pendingDeliveries": 5,
    "recentOrders": [...],
    "lowStockItems": [...]
  }
}
```

#### Get Reports
```http
GET /admin/reports?type=sales&startDate=2026-04-01&endDate=2026-04-30
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "report": "Sales Report",
  "data": [
    {
      "date": "2026-04-01",
      "totalSales": 5000.00,
      "orderCount": 10
    }
  ]
}
```

### Global Search

#### Search
```http
GET /global-search?query=water
Authorization: Bearer <token> (optional)

Response: 200 OK
{
  "results": {
    "orders": [
      {
        "orderId": "uuid",
        "product": "Pure Water"
      }
    ],
    "users": []
  }
}
```

## Request/Response Headers

### Required Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Response Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Authentication

### JWT Token Format
```
Header.Payload.Signature

Payload contains:
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "role": "customer|delivery|admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Using Token
Include in every authenticated request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Data Models

### User
- `userId` (string, PK)
- `name` (string)
- `email` (string, unique)
- `password` (string, hashed)
- `phone` (string)
- `role` (enum: customer, delivery, admin)
- `address` (text)
- `barangay` (string)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Order
- `orderId` (string, PK)
- `user_id` (string, FK)
- `customer_id` (string, FK)
- `order_date` (date)
- `order_status` (enum: pending, confirmed, delivered, cancelled)
- `total_amount` (decimal)
- `delivery_address` (text)
- `product` (string)
- `quantity` (integer)
- `payment` (enum: pending, paid, failed)
- `total_price` (decimal)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Payment
- `id` (integer, PK)
- `order_id` (string, FK)
- `payment_method` (enum: credit_card, debit_card, gcash, bank_transfer)
- `payment_status` (enum: pending, processing, completed, failed, refunded)
- `amount` (decimal)
- `paymongo_checkout_id` (string)
- `paymongo_payment_id` (string)
- `receipt_url` (text)
- `paid_at` (datetime)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Delivery
- `id` (integer, PK)
- `order_id` (string, FK)
- `delivery_personnel_id` (string, FK)
- `delivery_status` (enum: pending, in_transit, delivered, failed, rescheduled)
- `scheduled_date` (date)
- `delivered_date` (date)
- `delivery_address` (text)
- `delivery_notes` (text)
- `payment_received` (boolean)
- `payment_amount` (decimal)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Error Handling

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### Common Errors
```
400 Bad Request
{
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}

401 Unauthorized
{
  "error": "No token provided"
}

403 Forbidden
{
  "error": "Insufficient permissions"
}

404 Not Found
{
  "error": "Order not found"
}

500 Internal Server Error
{
  "error": "Internal Server Error"
}
```

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Testing Endpoints

### Health Check
```http
GET /health

Response: 200 OK
{
  "status": "OK",
  "timestamp": "2026-04-28T10:00:00Z"
}
```

## Development Tips

### Testing with cURL
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Get Orders
curl -X GET http://localhost:3000/orders \
  -H "Authorization: Bearer <token>"
```

### Testing with Postman
1. Import API collection
2. Set `{{token}}` variable from login response
3. Use in Authorization header: `Bearer {{token}}`

## Versioning

Current API Version: v1
- Future versions will use `/v2`, `/v3` etc.
- Backward compatibility maintained when possible

## Support & Documentation

- Express.js: https://expressjs.com
- Sequelize ORM: https://sequelize.org
- PayMongo: https://paymongo.com/docs
- Aiven: https://docs.aiven.io

---

Last Updated: 2026-04-28
