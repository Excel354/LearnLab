# LearnLab Firestore Security Specification

## 1. Data Invariants
1. **User Profile Ownership**: A user profile document `/users/{userId}` can only be read or modified by the authenticated owner whose `request.auth.uid == userId`.
2. **Subcollection Relational Isolation**: Notes, Quizzes, Mistakes, Tasks, and Countdowns under `/users/{userId}/...` can only be read, listed, created, updated, or deleted if `request.auth.uid == userId`.
3. **Data Integrity & Schema Bounds**:
   - String fields must not exceed strict volumetric limits (`size() <= maxLength`).
   - Timestamps must be validated against `request.time`.
   - Immutable keys (`userId`, `id`, `createdAt`) cannot be altered during updates.
4. **No Blanket Reads**: Every collection read or list query enforces that the requester matches `userId`.
5. **No Client Query Trust**: The security rules enforce authorization on `resource.data` and document paths, not relying on client parameters.

## 2. The Dirty Dozen Threat Payloads
1. **Unauthenticated Read**: Attempting to read `/users/user_abc123` without authentication. -> *Expected: PERMISSION_DENIED*
2. **Cross-User Profile Spoofing**: User `attacker_123` attempting to write `/users/victim_456`. -> *Expected: PERMISSION_DENIED*
3. **Ghost Field Poisoning**: Inserting unexpected fields like `isAdmin: true` or `bypassed: true` into `/users/{userId}`. -> *Expected: PERMISSION_DENIED*
4. **Denial-of-Wallet Payload**: Attempting to save a 2MB note title or 100,000 element array. -> *Expected: PERMISSION_DENIED*
5. **Subcollection Hijack**: User `user_1` attempting to read `/users/user_2/notes/{noteId}`. -> *Expected: PERMISSION_DENIED*
6. **Immutable Field Tampering**: Updating a note and altering `userId` or `id`. -> *Expected: PERMISSION_DENIED*
7. **Cross-User Task Deletion**: User `user_1` sending delete operation to `/users/user_2/tasks/{taskId}`. -> *Expected: PERMISSION_DENIED*
8. **Forged Timestamp Attack**: Submitting client-manufactured past/future timestamps rather than server timestamp. -> *Expected: PERMISSION_DENIED*
9. **Unverified Email Bypass**: When unverified account attempts privileged write operations. -> *Expected: PERMISSION_DENIED*
10. **Path Variable ID Injection**: Using special non-alphanumeric or excessively long path keys. -> *Expected: PERMISSION_DENIED*
11. **Malicious Quiz Result Falsification**: Submitting quiz result to another student's `/users/{userId}/quizHistory`. -> *Expected: PERMISSION_DENIED*
12. **Mistake Bank Corruption**: Writing mistake items with missing required fields or invalid types. -> *Expected: PERMISSION_DENIED*
