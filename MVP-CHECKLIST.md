# Face Recognition System MVP Checklist

## 1) Setup + Infra
- [ ] Configure `.env.local` for Firebase + CompreFace
- [ ] Start CompreFace locally (Docker) and create API key/service
- [ ] Verify Firestore, Auth, and Storage are enabled in Firebase

## 2) Core Backend Foundation
- [ ] Add `lib/firebase-client.ts` and `lib/firebase-admin.ts`
- [ ] Add minimal auth helper (`admin` check only)
- [ ] Add shared API response/error shape
- [ ] Add input validation for users, sessions, enroll, recognize

## 3) Face Engine Wrapper
- [ ] Build `services/compreface.ts` with:
  - [ ] ensure subject
  - [ ] upload subject image
  - [ ] recognize image
- [ ] Add `USE_MOCK_FACE_ENGINE=true` fallback for fast development

## 4) User Management (Admin)
- [ ] `POST /api/users`
- [ ] `GET /api/users`
- [ ] `GET /api/users/[id]`
- [ ] `PATCH /api/users/[id]`
- [ ] Admin UI: `/admin/users`, `/admin/users/[id]`

## 5) Enrollment Flow (Admin)
- [ ] `POST /api/users/[id]/enroll` (multipart, 1–5 images)
- [ ] Upload images to Firebase Storage
- [ ] Send images to CompreFace subject
- [ ] Store metadata in Firestore
- [ ] Mark user `complete` only when image count >= 3

## 6) Session Management (Admin)
- [ ] `POST /api/sessions`
- [ ] `GET /api/sessions`
- [ ] `PATCH /api/sessions/[id]` (active/closed)
- [ ] Admin UI: `/admin/sessions`

## 7) Attendance Recognition (Main MVP)
- [ ] Build `/attendance` webcam capture UI
- [ ] `POST /api/attendance/recognize`
- [ ] Validate active session
- [ ] Run recognition + threshold check
- [ ] Map subject -> user
- [ ] Prevent duplicate by writing attendance doc as `sessions/{sessionId}/attendance/{userId}`
- [ ] Return clear states: success / already marked / low confidence / no match / session closed

## 8) Basic Admin View
- [ ] `GET /api/sessions/[id]/attendance`
- [ ] Admin UI: `/admin/sessions/[id]` to view marked attendees and count

## 9) Minimum Security
- [ ] Ensure all admin write routes enforce admin auth
- [ ] Keep CompreFace + Firebase Admin secrets server-side only
- [ ] Add basic Firestore/Storage rules draft

## 10) Done Criteria
- [ ] Full loop works: create user -> enroll (3+) -> create session -> mark attendance -> duplicate blocked -> admin can view results

## Explicitly Skip For Now
- [ ] CSV export
- [ ] Advanced reports page
- [ ] Liveness/anti-spoofing
- [ ] Geofencing/offline/mobile
- [ ] Audit logs/background jobs
- [ ] Deep test suite (only quick manual QA for MVP)
