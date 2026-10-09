# SkillSwap Member 2 Backend

This project provides the authentication and user profile backend for the SkillSwap platform. It is intentionally independent from the frontend and other team members' modules so it can be integrated later.

## Tech stack

- Node.js
- Express.js
- MongoDB with Mongoose
- bcryptjs
- JWT
- express-validator
- Helmet
- express-rate-limit
- CORS
- Jest + Supertest

## Project structure

```text
skillswap-member2-backend/
src/
  config/
    db.js
  models/
    User.js
  controllers/
    authController.js
    userController.js
  routes/
    authRoutes.js
    userRoutes.js
  middleware/
    authMiddleware.js
    errorMiddleware.js
  validators/
    authValidators.js
    userValidators.js
  app.js
  server.js
tests/
  auth.test.js
  users.test.js
.env.example
.gitignore
package.json
README.md
```

## Setup

1. Copy `.env.example` to `.env`.
2. Set a MongoDB connection string in `MONGODB_URI`.
3. Set a strong random value in `JWT_SECRET`.
4. Install dependencies:

```bash
npm install
```

5. Start the server:

```bash
npm start
```

## MongoDB configuration

If you do not already have a database URI, create a free MongoDB Atlas cluster and copy the connection string.

Example:

```env
MONGODB_URI=mongodb+srv://yourUsername:yourPassword@cluster0.mongodb.net/skillswap-member2?retryWrites=true&w=majority
```

Use the actual username and password from your Atlas user. Do not commit the real `.env` file to Git.

## Frontend CORS configuration

Set `FRONTEND_ORIGIN` to the exact origin used by the frontend project, including protocol and port.

Example values:

```env
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_ORIGIN=https://your-frontend-domain.com
```

The frontend developer on another laptop should update this value to their local URL (for example `http://192.168.1.12:3000`) or the deployed production URL. Do not use wildcard origins with credentials.

## Authentication

Use the Authorization header with a Bearer token:

```http
Authorization: Bearer <jwt>
```

The JWT payload contains the authenticated user ID and is signed using `JWT_SECRET`. The token expiration is defined by `JWT_EXPIRES_IN`.

Future backend modules should use the same `protect` middleware to require a valid JWT before processing requests. Example:

```js
const { protect } = require('../middleware/authMiddleware');
router.get('/some-protected-route', protect, controllerFn);
```

Inside the controller, use `req.user` or `req.userId` to identify the logged-in user. Do not trust a client-supplied user ID.

## User model and profile fields

The user profile supports these fields:

- `name`: string
- `email`: normalized unique email address
- `bio`: optional string
- `teachingSkills`: array of strings such as `['JavaScript', 'React']`
- `learningSkills`: array of strings such as `['Python', 'UI/UX']`
- `availability`: array of strings such as `['Monday 6:00-8:00 PM', 'Wednesday 5:00-7:00 PM']`
- `profileImageUrl`: optional valid URL string
- `credits`: number, default `5`
- `role`: server-controlled value, default `user`

Protected fields such as `credits`, `role`, `email`, `passwordHash`, and verification status cannot be changed through the profile update route.

## API endpoints

### Auth routes

#### Register

`POST /api/auth/register`

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123!",
  "confirmPassword": "StrongPass123!"
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "66c123...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "credits": 5,
      "role": "user",
      "createdAt": "2026-10-09T00:00:00.000Z"
    }
  }
}
```

#### Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "jane@example.com",
  "password": "StrongPass123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ...",
    "user": {
      "_id": "66c123...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "credits": 5,
      "role": "user"
    }
  }
}
```

#### Get current user

`GET /api/auth/me`

Headers:

```http
Authorization: Bearer <jwt>
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "66c123...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "credits": 5,
      "role": "user"
    }
  }
}
```

### User routes

#### Get current user profile

`GET /api/users`

Headers:

```http
Authorization: Bearer <jwt>
```

#### Get public profile by ID

`GET /api/users/:id`

Response includes the same safe profile object without password data.

#### Update profile

`PUT /api/users`

Headers:

```http
Authorization: Bearer <jwt>
```

Request body example:

```json
{
  "name": "Jane Smith",
  "bio": "I teach JavaScript and learn UX design.",
  "teachingSkills": ["JavaScript", "Node.js"],
  "learningSkills": ["Python", "Product Design"],
  "availability": ["Monday 6-8 PM", "Thursday 7-9 PM"],
  "profileImageUrl": "https://example.com/avatar.jpg"
}
```

Protected fields are rejected by the server.

## Error handling

The API uses consistent JSON responses:

```json
{
  "success": false,
  "message": "Helpful error message"
}
```

HTTP status codes are used as follows:

- `200` for successful GET/PUT requests
- `201` for successful registration
- `400` for validation or malformed request issues
- `401` for unauthenticated or invalid JWT
- `404` for missing resources
- `409` for duplicate email registration
- `500` for unexpected server errors

## Testing

Run the Jest tests with:

```bash
npm test
```

The test environment uses an in-memory MongoDB instance so the backend can be tested without a local MongoDB daemon.

## Future integration notes

This backend exposes stable user identification using MongoDB ObjectIds stored as `_id`. Each request is tied to the authenticated user via JWT. Future modules can protect their endpoints by using the shared `protect` middleware and then access the current user through `req.user` or `req.userId`.

Member 3 and Member 4 modules should integrate by calling the protected endpoints and reading the JWT from the request headers. This backend does not implement their features.
