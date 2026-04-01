# Face Recognition Attendance MVP

Working prototype for attendance with:
- Next.js App Router + Route Handlers
- Firebase Auth + Firestore + Storage
- CompreFace integration (with mock mode)

## Implemented MVP Scope
- Admin user CRUD
- Enrollment upload (1-5 images per request, complete at >=3 images)
- Session create/list/update (draft/active/closed)
- Attendance recognition endpoint with duplicate prevention
- Attendance webcam page (`/attendance`)
- Admin screens:
  - `/admin/users`
  - `/admin/users/[id]`
  - `/admin/sessions`
  - `/admin/sessions/[id]`

## Local Setup
1. Install dependencies:
```bash
pnpm install
```

2. Copy env file and fill values:
```bash
cp .env.example .env.local
```

3. For quick UI development, keep mock mode:
```bash
USE_MOCK_FACE_ENGINE=true
USE_MOCK_DB=true
```

4. Run app:
```bash
pnpm dev
```

Open `http://localhost:3000`.

## Admin Access in Development
Admin routes require auth. For development, this MVP supports `x-dev-email` header.

UI pages include a “Dev admin email” input. Use an email present in `ADMIN_EMAILS`.
Default example: `admin@example.com`.

## CompreFace Notes
Set:
- `COMPREFACE_BASE_URL`
- `COMPREFACE_API_KEY`
- `COMPREFACE_RECOGNITION_SERVICE_ID`

Current service wrapper paths:
- `POST /subjects`
- `POST /faces`
- `POST /recognize`

under:
- `${COMPREFACE_BASE_URL}/api/v1/recognition/${COMPREFACE_RECOGNITION_SERVICE_ID}`

## Firestore Data Shape
- `users/{userId}`
- `users/{userId}/enrollmentImages/{imageId}`
- `sessions/{sessionId}`
- `sessions/{sessionId}/attendance/{userId}`

Duplicate prevention is enforced by using `userId` as attendance document ID inside a session.

## API Endpoints
- `GET/POST /api/users`
- `GET/PATCH /api/users/[id]`
- `POST /api/users/[id]/enroll`
- `GET/POST /api/sessions`
- `GET/PATCH /api/sessions/[id]`
- `GET /api/sessions/[id]/attendance`
- `POST /api/attendance/recognize`
- `GET /api/reports/session/[id]`
- `GET /api/auth/me`

## Security Files
- `firestore.rules`
- `storage.rules`

These are starter drafts and should be tightened with your real admin emails/claims before production.
