# Easy Buy Corner API Reference

Base URL in local development:

```txt
http://localhost:5000
```

All API responses are JSON unless the endpoint explicitly returns CSV or uploaded/static files.

## Auth

User protected endpoints require:

```http
Authorization: Bearer <user_token>
```

Admin protected endpoints require:

```http
Authorization: Bearer <admin_token>
```

Standard error shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request",
    "fields": []
  }
}
```

## Public Endpoints

No token is required for these endpoints.

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check text response |
| `GET` | `/api/products` | List active products |
| `GET` | `/api/products/:slug` | Get one active product and related products |
| `GET` | `/api/categories` | List active categories |
| `GET` | `/api/hero-banners` | List active hero and side banners |
| `POST` | `/api/auth/otp/send` | Send OTP to mobile number |
| `POST` | `/api/auth/otp/verify` | Verify OTP and return user token |
| `POST` | `/api/contact` | Store contact form message |
| `POST` | `/api/newsletter` | Subscribe or re-subscribe an email |
| `POST` | `/api/admin/auth/login` | Admin login and token issue |

### `GET /api/products`

Query params:

| Name | Type | Notes |
|---|---|---|
| `category` | string | Product category id |
| `featured` | string | Use `true` to filter featured products |
| `search` | string | Case-insensitive product name search |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response:

```json
{
  "data": [
    {
      "_id": "product_id",
      "slug": "product-slug",
      "name": "Product name",
      "price": 1000,
      "stock": 12,
      "active": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### `GET /api/products/:slug`

Response:

```json
{
  "product": {
    "_id": "product_id",
    "slug": "product-slug",
    "name": "Product name"
  },
  "related": []
}
```

### `GET /api/categories`

Returns active categories sorted by `sortOrder`.

```json
[
  {
    "_id": "category_id",
    "name": "Electronics",
    "slug": "electronics",
    "active": true,
    "sortOrder": 1
  }
]
```

### `GET /api/hero-banners`

Returns active banners sorted by `sortOrder`, split by banner type.

```json
{
  "heroSlides": [
    {
      "_id": "banner_id",
      "type": "main",
      "image": "https://example.com/banner.jpg",
      "alt": "Banner alt text",
      "href": "/products",
      "sortOrder": 1,
      "active": true
    }
  ],
  "sideBanners": []
}
```

### `POST /api/auth/otp/send`

Rate limits:

| Scope | Limit |
|---|---|
| IP | 10 requests per hour |
| Mobile | 3 requests per hour |
| Cooldown | 60 seconds between OTPs for the same mobile |

Request:

```json
{
  "mobile": "01700000000"
}
```

Response:

```json
{
  "requestId": "otp_request_id",
  "expiresIn": 300
}
```

### `POST /api/auth/otp/verify`

Request:

```json
{
  "requestId": "otp_request_id",
  "code": "123456"
}
```

Response:

```json
{
  "token": "user_jwt",
  "user": {
    "id": "user_id",
    "mobile": "01700000000",
    "name": "Customer name",
    "email": "customer@example.com"
  }
}
```

### `POST /api/contact`

Rate limit: 3 submissions per IP per hour.

Request:

```json
{
  "name": "Customer name",
  "email": "customer@example.com",
  "mobile": "01700000000",
  "subject": "Order question",
  "message": "I need help with my order."
}
```

Response:

```json
{
  "id": "contact_message_id",
  "createdAt": "2026-05-31T00:00:00.000Z"
}
```

### `POST /api/newsletter`

This endpoint is idempotent. Existing emails are re-subscribed instead of causing duplicate key errors.

Request:

```json
{
  "email": "customer@example.com"
}
```

Response:

```json
{
  "status": "subscribed"
}
```

### `POST /api/admin/auth/login`

Rate limit: 5 attempts per IP per 15 minutes.

Request:

```json
{
  "email": "admin@easybuycorner.com",
  "password": "password"
}
```

Response:

```json
{
  "token": "admin_jwt",
  "admin": {
    "id": "admin_id",
    "email": "admin@easybuycorner.com",
    "name": "Admin",
    "role": "owner",
    "createdAt": "2026-05-31T00:00:00.000Z"
  }
}
```

## User Endpoints

Requires a user JWT unless noted otherwise.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/orders` | Create order and decrement stock atomically |
| `GET` | `/api/orders` | List current user's orders |
| `GET` | `/api/orders/:orderId` | Get current user's order by public order id |

### `GET /api/auth/me`

Response:

```json
{
  "id": "user_id",
  "mobile": "01700000000",
  "name": "Customer name",
  "email": "customer@example.com"
}
```

### `POST /api/orders`

Request:

```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "Customer",
    "lastName": "Name",
    "address": "House 1, Road 2",
    "city": "Dhaka",
    "state": "Dhaka",
    "zip": "1207"
  },
  "shippingZone": "inside"
}
```

`shippingZone` values:

| Value | Meaning |
|---|---|
| `inside` | Inside Dhaka |
| `outside` | Outside Dhaka |

Response:

```json
{
  "orderId": "EBC-123456",
  "status": "pending",
  "total": 1160,
  "createdAt": "2026-05-31T00:00:00.000Z"
}
```

### `GET /api/orders`

Returns the authenticated user's orders sorted newest first.

### `GET /api/orders/:orderId`

Returns one order for the authenticated user.

## Admin Endpoints

All endpoints below require an admin JWT.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/auth/me` | Get current admin |
| `GET` | `/api/admin/products` | List all products, including inactive |
| `POST` | `/api/admin/products` | Create product |
| `PUT` | `/api/admin/products/:id` | Partially update product |
| `DELETE` | `/api/admin/products/:id` | Soft delete product |
| `POST` | `/api/admin/upload` | Upload product/banner image |
| `GET` | `/api/admin/orders` | List orders |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status |
| `GET` | `/api/admin/users` | List users with order stats |
| `GET` | `/api/admin/banners` | List all banners |
| `POST` | `/api/admin/banners` | Create banner |
| `PUT` | `/api/admin/banners/:id` | Update banner |
| `DELETE` | `/api/admin/banners/:id` | Soft delete banner |
| `GET` | `/api/admin/dashboard/stats` | Dashboard reporting stats |
| `GET` | `/api/admin/contact` | List contact messages |
| `PATCH` | `/api/admin/contact/:id/read` | Mark contact message as read |
| `GET` | `/api/admin/newsletter` | List or export newsletter subscribers |

### `GET /api/admin/auth/me`

Response:

```json
{
  "id": "admin_id",
  "email": "admin@easybuycorner.com",
  "name": "Admin",
  "role": "owner",
  "createdAt": "2026-05-31T00:00:00.000Z"
}
```

### `GET /api/admin/products`

Query params:

| Name | Type | Notes |
|---|---|---|
| `search` | string | Case-insensitive product name search |
| `category` | string | Category id |
| `lowStock` | string | Use `true` for stock less than or equal to `LOW_STOCK_THRESHOLD` |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

### `POST /api/admin/products`

Request:

```json
{
  "name": "Product name",
  "slug": "product-slug",
  "description": "Short description",
  "longDescription": "Long description",
  "category": "category_id",
  "brand": "Brand",
  "price": 1000,
  "originalPrice": 1200,
  "stock": 10,
  "image": "https://example.com/image.jpg",
  "gallery": ["https://example.com/image-2.jpg"],
  "highlights": ["Fast delivery"],
  "rating": 4.5,
  "reviewCount": 10,
  "featured": true,
  "active": true
}
```

Required fields: `name`, `price`.

Notes:

| Case | Result |
|---|---|
| `slug` is omitted | Generated from `name` |
| Duplicate slug | `409 duplicate_slug` |

### `PUT /api/admin/products/:id`

Partial update. Accepts the same fields as product create, with every field optional.

### `DELETE /api/admin/products/:id`

Default behavior is soft delete:

```json
{
  "deleted": true,
  "hard": false,
  "id": "product_id",
  "active": false
}
```

Optional hard delete:

```http
DELETE /api/admin/products/:id?hard=true
```

Hard delete requires an admin with `owner` role.

### `POST /api/admin/upload`

Content type: `multipart/form-data`

Field:

| Name | Type | Notes |
|---|---|---|
| `image` | file | Required. JPEG, PNG, or WebP. Max 2 MB. |

Response:

```json
{
  "url": "http://localhost:5000/uploads/file-name.webp",
  "filename": "file-name.webp",
  "size": 12345
}
```

### `GET /api/admin/orders`

Query params:

| Name | Type | Notes |
|---|---|---|
| `status` | string | `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| `from` | string | Date lower bound |
| `to` | string | Date upper bound |
| `search` | string | Matches order id or user mobile |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

### `PATCH /api/admin/orders/:id/status`

Request:

```json
{
  "status": "confirmed"
}
```

Allowed status values:

```txt
pending, confirmed, shipped, delivered, cancelled
```

Transition rules:

| Current | Allowed next statuses |
|---|---|
| `pending` | `confirmed`, `shipped`, `cancelled` |
| `confirmed` | `shipped`, `delivered`, `cancelled` |
| `shipped` | `delivered`, `cancelled` |
| `delivered` | none |
| `cancelled` | none |

Cancelling an order restocks the ordered product quantities.

### `GET /api/admin/users`

Query params:

| Name | Type | Notes |
|---|---|---|
| `search` | string | Matches mobile, name, or email |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response includes each user's `orderCount` and `totalSpent`.

```json
{
  "data": [
    {
      "_id": "user_id",
      "mobile": "01700000000",
      "orderCount": 2,
      "totalSpent": 2500
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### Banner CMS

Banner fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | yes | `main` or `side` |
| `image` | string | yes | Image URL |
| `alt` | string | yes | Accessible alt text |
| `href` | string | no | Optional link |
| `sortOrder` | number | no | Default `0` |
| `active` | boolean | no | Default `true` |

#### `GET /api/admin/banners`

Returns all banners, including inactive banners.

#### `POST /api/admin/banners`

Request:

```json
{
  "type": "main",
  "image": "https://example.com/banner.jpg",
  "alt": "Summer sale",
  "href": "/products",
  "sortOrder": 1,
  "active": true
}
```

#### `PUT /api/admin/banners/:id`

Partial update. Accepts any banner field.

#### `DELETE /api/admin/banners/:id`

Soft delete. Sets `active` to `false`.

```json
{
  "deleted": true,
  "id": "banner_id",
  "active": false
}
```

### `GET /api/admin/dashboard/stats`

Query params:

| Name | Type | Notes |
|---|---|---|
| `from` | string | Optional. Defaults to 30 days before `to` |
| `to` | string | Optional. Defaults to now |

Response:

```json
{
  "revenue": 10000,
  "orderCount": 5,
  "avgOrderValue": 2000,
  "newUsers": 2,
  "topProducts": [
    {
      "productId": "product_id",
      "name": "Product name",
      "sold": 3,
      "revenue": 3000
    }
  ],
  "ordersByStatus": {
    "pending": 1,
    "confirmed": 1,
    "shipped": 1,
    "delivered": 1,
    "cancelled": 1
  },
  "dailyRevenue": [
    {
      "date": "2026-05-31",
      "revenue": 10000
    }
  ]
}
```

### Contact Messages

#### `GET /api/admin/contact`

Query params:

| Name | Type | Notes |
|---|---|---|
| `unread` | string | Use `true` to show unread messages only |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response:

```json
{
  "data": [
    {
      "_id": "contact_message_id",
      "name": "Customer name",
      "email": "customer@example.com",
      "mobile": "01700000000",
      "subject": "Order question",
      "message": "I need help with my order.",
      "readAt": null,
      "createdAt": "2026-05-31T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### `PATCH /api/admin/contact/:id/read`

Marks a message as read by setting `readAt` to the current time.

### Newsletter Subscribers

#### `GET /api/admin/newsletter`

Query params:

| Name | Type | Notes |
|---|---|---|
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

Response:

```json
{
  "data": [
    {
      "_id": "subscription_id",
      "email": "customer@example.com",
      "status": "subscribed",
      "subscribedAt": "2026-05-31T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### `GET /api/admin/newsletter?format=csv`

Returns CSV of subscribed users.

Headers:

```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="newsletter-subscribers.csv"
```

CSV columns:

```txt
email,status,subscribedAt,unsubscribedAt
```

## Static Files

Uploaded files are served from:

```txt
/uploads/<filename>
```

Example:

```txt
http://localhost:5000/uploads/banner.webp
```

## Endpoint Count

| Group | Count |
|---|---:|
| Public API endpoints | 9 |
| User endpoints | 4 |
| Admin endpoints | 17 |
| Static or health endpoints | 2 |

