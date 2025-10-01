# Kryos Data Ingestion API

A comprehensive backend system for API key management and data ingestion, designed to help companies securely collect and manage data from other businesses through a Python SDK.

## Features

- **API Key Management**: Generate, validate, and manage API keys for client companies
- **Data Ingestion**: Receive and store user data, events, and custom data
- **File Upload**: Handle media files (images, videos) with validation
- **Authentication**: Secure API key-based authentication
- **Rate Limiting**: Built-in protection against abuse
- **Validation**: Comprehensive request validation
- **MongoDB Integration**: Efficient data storage and retrieval

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- TypeScript

### Installation

1. Clone the repository and navigate to the backend folder
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/kryos_db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All data ingestion endpoints require API key authentication. Include the API key in the Authorization header:

```
Authorization: Bearer {keyId}.{keySecret}
```

## API Endpoints

### Companies Management

#### Create Company
```http
POST /api/companies
Content-Type: application/json

{
  "name": "Tech Startup Inc",
  "email": "contact@techstartup.com",
  "description": "A innovative tech company",
  "website": "https://techstartup.com",
  "contactPerson": "John Doe",
  "phone": "+1-555-0123"
}
```

#### Get All Companies
```http
GET /api/companies?page=1&limit=10
```

#### Get Company by ID
```http
GET /api/companies/{companyId}
```

### API Key Management

#### Generate API Key
```http
POST /api/api-keys
Content-Type: application/json

{
  "companyId": "64abc123def456789012345",
  "name": "Production API Key",
  "description": "Main API key for production environment",
  "permissions": ["data:write", "files:upload"],
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64abc123def456789012346",
    "keyId": "a1b2c3d4e5f6g7h8",
    "apiKey": "a1b2c3d4e5f6g7h8.i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    "name": "Production API Key",
    "permissions": ["data:write", "files:upload"],
    "company": "Tech Startup Inc",
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "API key generated successfully. Please store it securely as it won't be shown again."
}
```

#### Validate API Key
```http
POST /api/api-keys/validate
Content-Type: application/json

{
  "apiKey": "a1b2c3d4e5f6g7h8.i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
}
```

### Data Ingestion

#### Submit User Data
```http
POST /api/data/users
Authorization: Bearer {apiKey}
Content-Type: multipart/form-data

{
  "externalId": "user_123",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-0124",
  "metadata": {
    "source": "mobile_app",
    "version": "1.2.0"
  }
}
```

**With Files:**
```http
POST /api/data/users
Authorization: Bearer {apiKey}
Content-Type: multipart/form-data

Form Data:
- externalId: user_123
- name: Jane Smith
- email: jane@example.com
- files: [profile_image.jpg, document.pdf]
```

#### Submit Data Entry
```http
POST /api/data/entries
Authorization: Bearer {apiKey}
Content-Type: multipart/form-data

{
  "externalId": "event_456",
  "dataType": "user_data",
  "data": {
    "action": "login",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "ip_address": "192.168.1.100"
  },
  "user": {
    "externalId": "user_123",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "tags": ["login", "authentication"]
}
```

#### Get User Data
```http
GET /api/data/users?page=1&limit=10
Authorization: Bearer {apiKey}
```

#### Get Data Entries
```http
GET /api/data/entries?page=1&limit=10&dataType=user_data&tags=login,auth
Authorization: Bearer {apiKey}
```

#### Get Files
```http
GET /api/data/files?page=1&limit=10&mimetype=image
Authorization: Bearer {apiKey}
```

#### Health Check
```http
GET /api/data/health
Authorization: Bearer {apiKey}
```

## Data Models

### User Data Structure
```json
{
  "externalId": "string (required)",
  "name": "string (required, max 100 chars)",
  "email": "string (required, valid email)",
  "phone": "string (optional, valid phone format)",
  "metadata": "object (optional)"
}
```

### Data Entry Structure
```json
{
  "externalId": "string (required)",
  "dataType": "user_data | event_data | custom_data (required)",
  "data": "object (required)",
  "user": {
    "externalId": "string (required)",
    "name": "string (required)",
    "email": "string (required)",
    "phone": "string (optional)",
    "metadata": "object (optional)"
  },
  "tags": ["string array (optional)"]
}
```

## File Upload

### Supported File Types
- Images: JPEG, PNG, GIF
- Videos: MP4, AVI, MOV

### File Size Limits
- Maximum file size: 10MB per file
- Maximum files per request: 10 files

### File Upload Example
```python
import requests

files = [
    ('files', ('image1.jpg', open('image1.jpg', 'rb'), 'image/jpeg')),
    ('files', ('video1.mp4', open('video1.mp4', 'rb'), 'video/mp4'))
]

data = {
    'externalId': 'user_123',
    'name': 'John Doe',
    'email': 'john@example.com'
}

headers = {
    'Authorization': 'Bearer your_api_key_here'
}

response = requests.post(
    'http://localhost:5000/api/data/users',
    files=files,
    data=data,
    headers=headers
)
```

## Error Responses

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 requests per window per IP
- **Headers**: Rate limit information is included in response headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Python SDK Integration

The backend is designed to work with a Python SDK that client companies can use to easily integrate data submission:

```python
from kryos_sdk import KryosClient

# Initialize client
client = KryosClient(
    api_key="your_api_key_here",
    base_url="http://localhost:5000/api"
)

# Submit user data
user_data = {
    "externalId": "user_123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "metadata": {"source": "mobile_app"}
}

response = client.submit_user_data(user_data)

# Submit data with files
files = ["path/to/image.jpg", "path/to/document.pdf"]
response = client.submit_user_data(user_data, files=files)

# Submit custom data entry
entry_data = {
    "externalId": "event_456",
    "dataType": "event_data",
    "data": {"action": "purchase", "amount": 99.99},
    "tags": ["purchase", "conversion"]
}

response = client.submit_data_entry(entry_data)
```

## Security Features

- **API Key Authentication**: Secure key-based authentication
- **Request Validation**: Comprehensive input validation
- **Rate Limiting**: Protection against abuse
- **File Type Validation**: Only allowed file types accepted
- **Size Limits**: File and request size limitations
- **CORS Configuration**: Configurable cross-origin requests
- **Helmet Security**: Security headers included
- **Input Sanitization**: SQL injection and XSS protection

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API route handlers
│   ├── utils/          # Utility functions
│   └── server.ts       # Main server file
├── uploads/            # File upload directory
├── package.json
└── tsconfig.json
```

### Available Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run lint`: Run ESLint

### Environment Variables
See `.env.example` for all available configuration options.

## Support

For questions or issues, please contact the development team or refer to the API documentation.