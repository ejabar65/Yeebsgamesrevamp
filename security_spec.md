# Security Specification - YEEBSGAMES

## Data Invariants
1. A user can only modify their own profile and favorites.
2. Only authorized admins can add, edit, or delete games.
3. Play counts and ratings are incremented via atomic operations (though for simplicity here we might trust the admin client for ahora, but better to protect).
4. Users cannot change their own UID or email in Firestore.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. User A tries to read User B's profile PII (if any). -> DENIED
2. User A tries to update User B's favorites list. -> DENIED
3. Random guest tries to create a game document. -> DENIED
4. Authenticated user (non-admin) tries to update a game's URL. -> DENIED
5. Admin tries to delete a game. -> GRANTED
6. User tries to set their UID to someone else's during creation. -> DENIED
7. User tries to inject 1MB string into a title field. -> DENIED
8. User tries to set `playCount` to a negative number. -> DENIED
9. User tries to delete the `games` collection. -> DENIED
10. User tries to overwrite a terminal state (if any). -> N/A
11. User tries to bookmark a game that doesn't exist (relational check). -> DENIED (via exists check)
12. User tries to spoof an admin email in their profile to gain access. -> DENIED (roles must be in /admins/ collection)

## Identity Verification
- We use `request.auth.token.email_verified == true` for all writes.
- We check `resource.data.uid == request.auth.uid` for user profile access.
