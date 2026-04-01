Below is a **build plan you can paste directly into a coding agent**. It assumes:

* **Frontend/App:** Next.js App Router
* **API layer:** Next.js Route Handlers in `app/api`
* **Face engine:** CompreFace
* **Database:** Firebase Firestore
* **File storage:** Firebase Storage
* **Auth:** Firebase Auth
* **Goal:** working prototype for face-recognition attendance with admin enrollment, session creation, recognition, duplicate prevention, and basic reporting

This stack is a good fit because Next.js App Router supports custom backend endpoints through Route Handlers in the `app` directory, CompreFace exposes a REST API for face recognition and subject management, and Firestore is designed for client/server development with Security Rules for access control. ([Next.js][1])

---

# master implementation plan for codex

## 1) project objective

Build a **working prototype** of a face-recognition attendance system with these capabilities:

1. Admin login
2. Admin creates users
3. Admin enrolls each user with 3–5 face images
4. Admin creates attendance sessions
5. User opens attendance page and marks attendance using webcam
6. System recognizes face using CompreFace
7. System writes attendance to Firestore
8. System prevents duplicate attendance for the same session
9. Admin sees attendance dashboard and exports data later
10. System stores only required metadata in Firestore and files in Firebase Storage

CompreFace’s subject model is appropriate here because one subject can represent one person and multiple images can be uploaded to that subject for recognition later. ([GitHub][2])

---

## 2) non-goals for prototype v1

Do **not** implement these in v1 unless time remains:

* advanced anti-spoofing / liveness
* multi-tenant org support
* geofencing
* offline attendance
* mobile app
* production analytics
* full audit/compliance suite
* background job queues
* realtime kiosk hardware integration

The prototype should focus on proving the full loop: **enroll → recognize → mark attendance → view results**.

---

## 3) high-level architecture

```txt
browser
  ├─ admin ui
  └─ attendance ui
        ↓
next.js app router
  ├─ server components/pages
  └─ route handlers (/app/api/*)
        ↓
services layer
  ├─ firebase admin / firestore
  ├─ firebase storage
  └─ compreface api client
        ↓
external systems
  ├─ firestore
  ├─ firebase auth
  ├─ firebase storage
  └─ compreface docker service
```

Use Next.js Route Handlers, since they are the App Router-native way to implement backend endpoints using Web Request/Response APIs. ([Next.js][1])

---

## 4) technical decisions

### 4.1 framework

Use **Next.js latest stable with App Router and TypeScript**. Next.js documents App Router project structure and Route Handlers clearly, which matches this full-stack setup. ([Next.js][3])

### 4.2 face engine

Use **CompreFace** as a self-hosted REST API service. The project officially supports Docker Compose deployment and provides REST APIs for recognition and subject/image management. ([GitHub][4])

### 4.3 database

Use **Firestore** for users, sessions, attendance records, and derived summary metadata. Firestore is a scalable NoSQL database intended for client/server apps. ([Firebase][5])

### 4.4 security

Use **Firebase Auth + Firestore Security Rules** for client-side access control, and use **server-side admin credentials** only inside secure Route Handlers or server utilities. Firebase’s docs explicitly position Auth + Security Rules as the core access model for Firestore-backed apps. ([Firebase][6])

### 4.5 image storage

Use **Firebase Storage** for enrollment images and optional attendance snapshots. Firestore should only store metadata and URLs, not binary images.

---

## 5) user roles

### admin

Can:

* log in
* create/update users
* upload enrollment images
* create attendance sessions
* view session attendance
* reopen/close a session
* manually adjust attendance if needed
* view basic reports

### attendee

Can:

* open attendance page
* use webcam
* submit a live frame for recognition
* see whether attendance was marked or already exists

---

## 6) functional requirements

### 6.1 user management

* create a user
* update a user
* deactivate a user
* store name, employee/student code, department/class
* assign one CompreFace subject per user

### 6.2 enrollment

* upload 3–5 images per user
* call CompreFace subject/image enrollment endpoints
* store uploaded image URLs in Storage
* store enrollment status in Firestore

### 6.3 attendance session

* create a session with title, date, start time, end time, active status
* one user can only be marked once per session
* attendance page must reject closed sessions

### 6.4 recognition

* capture webcam frame
* send to server route
* route calls CompreFace
* if confidence >= threshold, resolve user
* if recognized and active, mark attendance
* if already marked, return existing result
* if below threshold, reject

### 6.5 reporting

* session-wise attendance list
* user-wise attendance history
* summary counts: total, present, absent-not-marked
* basic CSV-ready JSON endpoint

---

## 7) non-functional requirements

* clean TypeScript throughout
* modular service layer
* all secrets on server only
* no direct browser calls to CompreFace
* error handling with typed responses
* validation on all write APIs
* minimal but clean UI
* easy local setup with `.env.local`
* easy deployment path later

---

## 8) repository structure

Use this folder structure:

```txt
/app
  /(public)
    /attendance
      page.tsx
  /(admin)
    /admin
      /users
        page.tsx
      /users/[id]
        page.tsx
      /sessions
        page.tsx
      /sessions/[id]
        page.tsx
      /reports
        page.tsx
  /api
    /auth
      /me
        route.ts
    /users
      route.ts
    /users/[id]
      route.ts
    /users/[id]/enroll
      route.ts
    /sessions
      route.ts
    /sessions/[id]
      route.ts
    /sessions/[id]/attendance
      route.ts
    /attendance/recognize
      route.ts
    /reports/session/[id]
      route.ts

/components
  CameraCapture.tsx
  UserForm.tsx
  SessionForm.tsx
  AttendanceResult.tsx
  AdminShell.tsx
  DataTable.tsx

/lib
  firebase-client.ts
  firebase-admin.ts
  auth.ts
  validators.ts
  utils.ts

/services
  compreface.ts
  users.ts
  sessions.ts
  attendance.ts
  storage.ts

/types
  api.ts
  models.ts

/middleware.ts
```

This aligns with Next.js App Router’s documented folder/file conventions. ([Next.js][7])

---

## 9) environment variables

Create `.env.local` with placeholders like:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_PROJECT_ID=

COMPREFACE_BASE_URL=http://localhost:8000
COMPREFACE_API_KEY=
COMPREFACE_RECOGNITION_SERVICE_ID=
COMPREFACE_SIMILARITY_THRESHOLD=0.95

ADMIN_EMAILS=admin@example.com
```

Notes:

* browser-safe Firebase config can be public
* admin SDK secrets must remain server-only
* CompreFace API key must remain server-only

---

## 10) firestore data model

Use a document model optimized for session queries.

### 10.1 `users/{userId}`

```json
{
  "name": "string",
  "code": "string",
  "department": "string",
  "status": "active | inactive",
  "comprefaceSubject": "string",
  "enrollmentStatus": "pending | partial | complete | failed",
  "enrollmentImageCount": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "uid"
}
```

### 10.2 `users/{userId}/enrollmentImages/{imageId}`

```json
{
  "storagePath": "string",
  "downloadURL": "string",
  "uploadedAt": "timestamp",
  "uploadedBy": "uid"
}
```

### 10.3 `sessions/{sessionId}`

```json
{
  "title": "string",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "status": "draft | active | closed",
  "department": "string | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "uid"
}
```

### 10.4 `sessions/{sessionId}/attendance/{userId}`

```json
{
  "userId": "string",
  "userName": "string",
  "userCode": "string",
  "department": "string",
  "markedAt": "timestamp",
  "method": "face",
  "confidence": 0.97,
  "snapshotUrl": "string | null",
  "recognizedSubject": "string"
}
```

This structure makes duplicate prevention simple because the attendance document ID can equal `userId`, so the same user cannot create two records in the same session without an explicit overwrite.

### 10.5 optional denormalized helper collection

`attendanceLogs/{logId}` for user-centric historical queries if needed later, but skip initially unless reports feel slow.

Firestore supports document-based writes and security-rule-based access control; keep writes focused and predictable. ([Firebase][8])

---

## 11) compreface integration model

### 11.1 concept

* one CompreFace **subject** = one system user
* upload 3–5 images to the same subject
* use recognition endpoint during attendance
* backend receives candidate matches and chooses whether to accept

CompreFace’s docs explicitly describe subjects as the common way to assign several images to one person for later recognition. ([GitHub][2])

### 11.2 service wrapper

Create `services/compreface.ts` with methods:

* `createOrEnsureSubject(subject: string)`
* `uploadImageToSubject(subject: string, file: Buffer | BlobLike)`
* `recognizeFace(file: Buffer | BlobLike)`
* `listSubjects()`
* `deleteSubject(subject: string)` optional
* `deleteFaceImage(faceId: string)` optional later

All CompreFace calls must happen server-side.

### 11.3 threshold strategy

Start with:

* accept at `>= 0.95`
* retry between `0.90` and `0.95`
* reject below `0.90`

Make threshold configurable through env var.

---

## 12) auth and authorization plan

### 12.1 auth

Use Firebase Auth email/password or Google sign-in.

### 12.2 admin authorization

Admin check should happen in two layers:

* UI layer: hide admin routes from non-admin users
* API layer: re-check admin identity before all admin writes

### 12.3 attendance route access

Public or authenticated, depending on your desired prototype:

* simplest prototype: attendance page can be public but session ID protected
* safer prototype: require attendee sign-in too

### 12.4 security rules

Use Firestore Security Rules for client-side reads/writes and keep sensitive writes routed through server APIs. Firebase documents Security Rules as the main guardrail for Firestore. ([Firebase][9])

---

## 13) API contracts

All routes should return JSON in this shape:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

### 13.1 `POST /api/users`

Creates a user.

Request:

```json
{
  "name": "string",
  "code": "string",
  "department": "string"
}
```

### 13.2 `GET /api/users`

Lists users with pagination.

### 13.3 `GET /api/users/[id]`

Gets one user.

### 13.4 `PATCH /api/users/[id]`

Updates user fields.

### 13.5 `POST /api/users/[id]/enroll`

Multipart upload of 1..5 images.
Server should:

1. validate admin
2. upload image(s) to Firebase Storage
3. ensure CompreFace subject exists
4. upload each image to subject
5. save image metadata in Firestore
6. update user enrollment status

### 13.6 `POST /api/sessions`

Create session.

### 13.7 `GET /api/sessions`

List sessions.

### 13.8 `PATCH /api/sessions/[id]`

Update session status or fields.

### 13.9 `POST /api/attendance/recognize`

Attendance submission.
Request:

* multipart file or base64 image
* `sessionId`

Server should:

1. validate session is active
2. call CompreFace recognition
3. get best candidate
4. verify threshold
5. map `recognizedSubject` to internal user
6. verify user active
7. create attendance doc if not already present
8. return result

### 13.10 `GET /api/sessions/[id]/attendance`

Return all marked attendance for a session.

### 13.11 `GET /api/reports/session/[id]`

Return summary + detailed rows.

---

## 14) pages and UX plan

### 14.1 `/attendance`

Purpose:

* select or receive active session
* open webcam
* capture image
* submit to backend
* show result

States:

* camera loading
* ready
* capturing
* checking
* success
* already marked
* no match
* low confidence
* session closed
* error

### 14.2 `/admin/users`

Purpose:

* list users
* create user
* open user detail

### 14.3 `/admin/users/[id]`

Purpose:

* show user details
* upload enrollment images
* show enrollment status
* show image count

### 14.4 `/admin/sessions`

Purpose:

* list sessions
* create session
* activate/close session

### 14.5 `/admin/sessions/[id]`

Purpose:

* show marked attendance
* show count summary
* manual refresh
* future export button placeholder

### 14.6 `/admin/reports`

Purpose:

* aggregate recent sessions
* filter by date/department
* simple summary cards

---

## 15) step-by-step development sequence

## phase 0 — bootstrap

1. Create Next.js app with TypeScript and App Router.
2. Install Firebase SDKs, Firebase Admin SDK, validation library, form library if desired.
3. Create base layout and route groups.
4. Set up ESLint/Prettier if needed.
5. Add environment loader and startup docs.

Definition of done:

* app runs locally
* TypeScript passes
* route structure exists

Next.js App Router project structure and Route Handlers are documented in official docs. ([Next.js][3])

---

## phase 1 — local infra

1. Run CompreFace locally with Docker Compose.
2. Verify web UI opens.
3. Create recognition service and API key manually in CompreFace UI.
4. Create Firebase project.
5. Enable Firestore, Auth, and Storage.
6. Add local `.env.local`.
7. Create service account credentials for server-side Firebase Admin.

CompreFace’s official project states it is delivered with Docker Compose and exposes REST APIs. Firestore and Security Rules setup are handled in Firebase console/docs. ([GitHub][4])

Definition of done:

* CompreFace reachable locally
* Firebase project configured
* env vars load correctly

---

## phase 2 — shared backend foundations

1. Implement `lib/firebase-client.ts`
2. Implement `lib/firebase-admin.ts`
3. Implement auth helpers in `lib/auth.ts`
4. Implement reusable response helpers
5. Implement schema validation in `lib/validators.ts`
6. Implement basic error classes

Definition of done:

* can read/write Firestore from server
* can access logged-in user
* validation works for sample payloads

---

## phase 3 — CompreFace service wrapper

1. Build `services/compreface.ts`
2. Add typed functions for:

   * health/test ping if possible
   * ensure subject exists
   * upload image to subject
   * recognize image
3. Normalize API response into internal typed format

Internal normalized types:

```ts
type FaceMatch = {
  subject: string;
  similarity: number;
  box?: { x: number; y: number; width: number; height: number };
};

type RecognizeResult = {
  matches: FaceMatch[];
  bestMatch: FaceMatch | null;
};
```

Definition of done:

* local script can upload one image to one subject
* local script can recognize a test image
* responses are logged and normalized

CompreFace’s REST API and subject model are documented in the official repo. ([GitHub][2])

---

## phase 4 — user CRUD

1. Implement `POST /api/users`
2. Implement `GET /api/users`
3. Implement `GET /api/users/[id]`
4. Implement `PATCH /api/users/[id]`
5. Build `/admin/users`
6. Build `/admin/users/[id]`

Rules:

* `code` must be unique
* `comprefaceSubject` should default to same as `code` or deterministic slug
* status defaults to active

Definition of done:

* admin can create and edit users
* user docs appear in Firestore
* list/detail UI works

---

## phase 5 — enrollment flow

1. Build multipart upload endpoint `POST /api/users/[id]/enroll`
2. For each uploaded image:

   * validate file type and size
   * upload to Firebase Storage
   * ensure CompreFace subject exists
   * upload image to CompreFace subject
   * create Firestore image metadata doc
3. Update user doc:

   * `enrollmentStatus`
   * `enrollmentImageCount`
   * `updatedAt`
4. Show enrollment history on user detail page

Prototype rule:

* minimum 3 images required before user is considered `complete`

Definition of done:

* admin can upload multiple face images
* user enrollment status changes correctly
* CompreFace contains subject and images

CompreFace supports multiple images per subject for later recognition. ([GitHub][2])

---

## phase 6 — session management

1. Implement `POST /api/sessions`
2. Implement `GET /api/sessions`
3. Implement `PATCH /api/sessions/[id]`
4. Build `/admin/sessions`
5. Build session create form
6. Add activate/close toggles

Rules:

* only one active session per department if you want simplified attendance
* or allow many active sessions and pass explicit `sessionId` to attendance page

Definition of done:

* admin can create session
* session status changes
* active session visible in UI

---

## phase 7 — attendance recognition flow

1. Build webcam component on `/attendance`
2. Capture still image from browser
3. Send multipart form to `POST /api/attendance/recognize`
4. In route:

   * validate input
   * validate session exists and is active
   * call `recognizeFace`
   * choose best match
   * compare confidence threshold
   * resolve `subject -> user`
   * verify user active and enrolled
   * check whether attendance doc already exists
   * if absent, create `sessions/{sessionId}/attendance/{userId}`
   * optionally save snapshot to Storage
5. Return one of:

   * success
   * already marked
   * low confidence
   * no face found
   * no recognized user
   * inactive user
   * session closed

Definition of done:

* real webcam can mark attendance
* duplicate attendance is prevented
* clear result shown in UI

---

## phase 8 — attendance listing and reports

1. Implement `GET /api/sessions/[id]/attendance`
2. Implement `GET /api/reports/session/[id]`
3. Build `/admin/sessions/[id]`
4. Build `/admin/reports`

Report payload should include:

* session info
* total marked
* row list
* confidence per row
* pending absentees if filtered against eligible users

Definition of done:

* admin can see who was marked
* summary counts render correctly

---

## phase 9 — security hardening

1. Add route-level auth checks everywhere
2. Add Firestore Security Rules
3. Lock Storage rules so only admins/server can write enrollment images
4. Sanitize error responses
5. Add rate limit or basic per-IP cooldown on attendance endpoint
6. Validate MIME types and max sizes on uploads
7. Reject attendance image uploads with more than one face if CompreFace response supports that signal

Firebase’s official guidance is to use Auth plus Security Rules to secure Firestore. ([Firebase][6])

Definition of done:

* non-admin users cannot hit admin writes
* client cannot write arbitrary attendance docs
* Storage is not public-write

---

## phase 10 — quality and polish

1. Improve loading states and toasts
2. Add empty states
3. Add retry option on low-confidence responses
4. Add image preview before submit
5. Add enrollment tips in UI:

   * front face
   * slight left/right
   * good light
6. Add simple health page for CompreFace/Firebase connectivity

Definition of done:

* prototype feels usable
* obvious failure modes handled

---

## 16) Firestore Security Rules starter plan

Implement a minimal version where:

* authenticated admins can read/write `users`, `sessions`
* normal authenticated users can read their own user doc if needed
* direct client writes to attendance are disallowed if attendance is intended to be server-only
* Storage writes limited to admins

Firebase documents Security Rules as the mechanism to validate auth and data access conditions. ([Firebase][10])

Suggested approach:

* keep attendance writes server-side via Firebase Admin SDK
* use client rules mainly for read protection
* avoid exposing direct browser write paths until needed

---

## 17) data validation rules

For all APIs, validate:

### user

* `name`: 2–100 chars
* `code`: alphanumeric + `-` `_`
* `department`: optional but constrained
* `status`: enum

### session

* `title`: required
* `date`: `YYYY-MM-DD`
* `startTime`, `endTime`: `HH:mm`
* `status`: enum

### enrollment files

* only image MIME types
* max file size, e.g. 5 MB each
* max 5 images per request

### attendance recognition

* `sessionId`: required
* one image required
* max file size
* reject unsupported MIME types

---

## 18) error handling conventions

Use stable machine-readable error codes such as:

* `UNAUTHORIZED`
* `FORBIDDEN`
* `VALIDATION_ERROR`
* `NOT_FOUND`
* `SESSION_CLOSED`
* `USER_INACTIVE`
* `NO_FACE_DETECTED`
* `NO_MATCH`
* `LOW_CONFIDENCE`
* `ALREADY_MARKED`
* `INTEGRATION_ERROR`
* `INTERNAL_ERROR`

UI should map these to friendly messages.

---

## 19) test plan

### 19.1 unit tests

Test:

* validators
* subject name generator
* best-match selector
* attendance duplicate detection logic
* threshold policy function

### 19.2 integration tests

Test:

* create user route
* create session route
* enroll route with mocked CompreFace
* recognize route with mocked match/no-match cases

### 19.3 manual QA scenarios

1. admin creates user
2. admin uploads 3 images
3. admin creates active session
4. attendee marks attendance successfully
5. attendee retries and gets “already marked”
6. low-quality image gets rejected
7. inactive user is not allowed
8. closed session rejects attendance
9. non-admin cannot create user/session

---

## 20) mock-first development recommendation

To move faster, start with a mock CompreFace adapter:

```ts
if (process.env.USE_MOCK_FACE_ENGINE === "true") {
  return {
    bestMatch: { subject: "EMP001", similarity: 0.97 }
  };
}
```

Then swap to real CompreFace once the UI and attendance flow work.

This reduces integration friction and lets the coding agent finish the product faster.

---

## 21) MVP acceptance criteria

Prototype is complete when all of these are true:

1. app runs locally
2. admin can sign in
3. admin can create a user
4. admin can enroll at least 3 images for that user
5. admin can create an attendance session
6. attendee can open attendance page and mark attendance with webcam
7. attendance is stored in Firestore
8. duplicate attendance for same session is blocked
9. admin can view attendance records for a session
10. sensitive service credentials remain server-side only

---

## 22) future enhancements after prototype

Only after MVP works, add:

* liveness checks
* QR/session join flow
* kiosk mode
* CSV export
* better analytics
* subject sync/reconciliation tools
* bulk enrollment import
* multi-session live dashboard
* face re-enrollment and delete flows
* audit logs

---

## 23) implementation order for the coding agent

Tell the coding agent to follow this strict order:

1. scaffold Next.js app structure
2. add Firebase client/admin setup
3. add auth helpers
4. add CompreFace service wrapper
5. implement user CRUD routes and pages
6. implement enrollment route and UI
7. implement session CRUD routes and pages
8. implement attendance recognition route and page
9. implement attendance listing/report pages
10. add security rules and polish
11. add tests and docs

This order avoids the biggest risk: building UI before proving backend recognition.

---

## 24) instructions to the coding agent

Paste this section along with the plan:

```md
Build a working prototype of a face-recognition attendance system using:
- Next.js App Router + TypeScript
- Next.js Route Handlers under app/api
- Firebase Auth
- Firestore
- Firebase Storage
- CompreFace as the face-recognition engine

Requirements:
- Create clean, modular, production-style code
- Keep all secrets server-side
- Do not call CompreFace directly from the browser
- Use Firestore for metadata and Storage for image files
- Use one CompreFace subject per user
- Enrollment requires 3–5 images
- Attendance recognition must prevent duplicate marking per session
- Build admin pages for users, enrollment, sessions, and reports
- Build public or authenticated attendance page with webcam capture
- Use strict validation and typed API responses
- Add basic error handling and loading states
- Prefer simple working UX over overengineering
- Include README with local setup instructions
- Include Firestore rules draft and env example file
- Make mock face engine support available via env flag for development

Deliverables:
- working local app
- local CompreFace integration
- Firestore data model implementation
- admin flow
- attendance recognition flow
- reports flow
- setup documentation
```

---

## 25) final note for implementation style

The coding agent should optimize for:

* **working prototype first**
* **clear boundaries between UI, API, and service layer**
* **mockability**
* **safe server-side integrations**
* **minimal but correct Firestore model**

This is the right approach for the stack because Next.js Route Handlers are the native way to implement backend endpoints in App Router, CompreFace is already exposed as a REST service, and Firebase expects Auth + Security Rules for safe data access. ([Next.js][1])

If you want, I can convert this into a **clean AGENTS.md / codex-ready markdown spec** next.

[1]: https://nextjs.org/docs/app/getting-started/route-handlers?utm_source=chatgpt.com "Getting Started: Route Handlers"
[2]: https://github.com/exadel-inc/CompreFace/blob/master/docs/Rest-API-description.md?utm_source=chatgpt.com "CompreFace/docs/Rest-API-description.md at master"
[3]: https://nextjs.org/docs/app?utm_source=chatgpt.com "Next.js Docs: App Router"
[4]: https://github.com/exadel-inc/CompreFace?utm_source=chatgpt.com "exadel-inc/CompreFace: Leading free and open-source ..."
[5]: https://firebase.google.com/docs/firestore?utm_source=chatgpt.com "Firestore | Firebase - Google"
[6]: https://firebase.google.com/docs/firestore/security/overview?utm_source=chatgpt.com "Secure data in Cloud Firestore - Firebase"
[7]: https://nextjs.org/docs/app/getting-started/project-structure?utm_source=chatgpt.com "Getting Started: Project Structure"
[8]: https://firebase.google.com/docs/firestore/manage-data/add-data?utm_source=chatgpt.com "Add data to Cloud Firestore - Firebase - Google"
[9]: https://firebase.google.com/docs/firestore/security/get-started?utm_source=chatgpt.com "Get started with Cloud Firestore Security Rules - Firebase"
[10]: https://firebase.google.com/docs/firestore/security/rules-conditions?utm_source=chatgpt.com "Writing conditions for Cloud Firestore Security Rules - Firebase"
