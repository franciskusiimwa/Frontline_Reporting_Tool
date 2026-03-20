# API Endpoints Documentation

**Complete guide to all API endpoints.** Each endpoint is explained with examples.

## Quick Reference

| Method | Endpoint | Purpose | Required Auth |
|--------|----------|---------|----------------|
| POST | `/api/auth/register` | Create new user | None (admin only in practice) |
| GET | `/api/dashboard` | Get dashboard stats | Admin |
| PATCH | `/api/draft` | Save form as draft | Field staff |
| GET | `/api/submissions` | List all submissions | Admin |
| GET | `/api/submissions/[id]` | Get one submission | Owner or Admin |
| PATCH | `/api/submissions/[id]/approve` | Approve submission | Admin |
| PATCH | `/api/submissions/[id]/revise` | Revision requests disabled (returns 403) | Admin |
| POST | `/api/submissions/[id]/summarize` | Get AI summary | Admin |
| GET | `/api/submissions/[id]/export` | Export single submission | Admin |
| POST | `/api/submit` | Final form submission | Field staff |
| GET | `/api/export/csv` | Export all data to CSV | Admin |
| GET | `/api/users` | List all users | Admin |
| POST | `/api/users` | Create new user | Admin |
| PATCH | `/api/users/[id]` | Update user | Admin |
| POST | `/api/users/[id]` | Reset user password | Admin |
| DELETE | `/api/users/[id]` | Delete user | Admin |
| GET | `/api/weeks` | Get current week | Authenticated |
| GET | `/api/health` | Runtime + DB health check | None |

---

## Detailed Endpoints

### 1. Authentication & Registration

#### `POST /api/auth/register`

Create a new user account.

**Who can use**: Admin only

**Request**:
```json
{
  "email": "john@school.ug",
  "password": "SecurePassword123",
  "full_name": "John Musoke",
  "region": "Central",
  "role": "field_staff"
}
```

**Response (Success - 201)**:
```json
{
  "data": {
    "user_id": "uuid-123",
    "email": "john@school.ug"
  },
  "error": null
}
```

**Response (Error - 400)**:
```json
{
  "data": null,
  "error": "Email already exists"
}
```

**Error Codes**:
- `400` - Missing fields or invalid format
- `409` - Email already registered
- `500` - Server error

**What happens behind the scenes**:
1. Creates auth.users entry (handled by Supabase)
2. Creates profiles entry with role
3. User can now log in

---

### 2. Draft Saving

#### `PATCH /api/draft`

Save form in progress (doesn't finalize).

**Who can use**: Logged-in field staff

**Request**:
```json
{
  "submission_id": "uuid-500",
  "data": {
    "step1": {
      "field_name": "John Musoke",
      "region": "Central"
    },
    "step2": {
      "snapshot": "Growing"
    },
    "step3": {
      "scholar_retention": {
        "last_week": 150,
        "this_week": 155,
        "retention_rate": 103.3
      }
    }
  }
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "submission_id": "uuid-500"
  },
  "error": null
}
```

**Notes**:
- `submission_id` can be omitted (creates new draft)
- Status remains `draft` (not submitted yet)
- User can save multiple times
- Each save overwrites previous data

**Code location**: `app/api/draft/route.ts`

---

### 3. Final Submission

#### `POST /api/submit`

Finalize form submission (marks as submitted).

**Who can use**: Logged-in field staff

**Request**:
```json
{
  "submission_id": "uuid-500"
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "submission_id": "uuid-500"
  },
  "error": null
}
```

**What happens**:
1. Validates all form data with strict schema
2. Checks user is form owner
3. Changes status: `draft` → `submitted`
4. Records timestamp (submitted_at)
5. Creates audit_log entry
6. Cannot edit after this

**Error Codes**:
- `400` - Validation failed (missing required fields)
- `401` - Not authenticated
- `403` - Not the form owner
- `404` - Submission not found

**Code location**: `app/api/submit/route.ts`

---

### 4. Get Submissions List

#### `GET /api/submissions`

Fetch all submissions (admin only).

**Who can use**: Admin only

**Query Parameters**:
- `week_label` (optional): Filter by week
- `status` (optional): Filter by status (draft, submitted, approved)
- `region` (optional): Filter by region

**Examples**:
```
GET /api/submissions
GET /api/submissions?week_label=Term%202,%20Week%205
GET /api/submissions?status=approved
GET /api/submissions?region=Central
```

**Response (Success - 200)**:
```json
{
  "data": [
    {
      "id": "uuid-500",
      "submitted_by": "uuid-user-123",
      "full_name": "John Musoke",
      "region": "Central",
      "week_label": "Term 2, Week 5",
      "status": "submitted",
      "submitted_at": "2026-03-21T10:30:00Z",
      "data": { "step1": {...}, "step2": {...} }
    },
    {
      "id": "uuid-501",
      "submitted_by": "uuid-user-456",
      "full_name": "Sarah Opiyo",
      "region": "North",
      "week_label": "Term 2, Week 5",
      "status": "draft",
      "submitted_at": null,
      "data": {...}
    }
  ],
  "error": null
}
```

**Code location**: `app/api/submissions/route.ts`

---

### 5. Get Single Submission

#### `GET /api/submissions/[id]`

Get detailed view of one submission.

**Who can use**: 
- Field staff (only their own)
- Admin (anyone)

**URL Example**:
```
GET /api/submissions/uuid-500
```

**Response (Success - 200)**:
```json
{
  "data": {
    "id": "uuid-500",
    "submitted_by": "uuid-user-123",
    "full_name": "John Musoke",
    "region": "Central",
    "week_label": "Term 2, Week 5",
    "status": "submitted",
    "submitted_at": "2026-03-21T10:30:00Z",
    "data": {
      "step1": { "field_name": "John", "region": "Central" },
      "step2": { "snapshot": "Growing" },
      ...
    },
    "audit_history": [
      {
        "action": "created",
        "actor_name": "John Musoke",
        "created_at": "2026-03-20T09:00:00Z",
        "note": null
      },
      {
        "action": "submitted",
        "actor_name": "John Musoke",
        "created_at": "2026-03-21T10:30:00Z",
        "note": null
      }
    ]
  },
  "error": null
}
```

**Code location**: `app/api/submissions/[id]/route.ts`

---

### 6. Approve Submission

#### `POST /api/submissions/[id]/approve`

Admin approves a submitted form.

**Who can use**: Admin only

**URL Example**:
```
POST /api/submissions/uuid-500/approve
```

**Request**:
```json
{
  "note": "Looks good, well done!"
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "submission_id": "uuid-500",
    "new_status": "approved"
  },
  "error": null
}
```

**What happens**:
1. Checks user is admin
2. Finds the submission
3. Changes status: `submitted` → `approved`
4. Logs action in audit_log
5. Field staff gets notification (in future)

**Code location**: `app/api/submissions/[id]/approve/route.ts`

---

### 7. Request Revision

#### `POST /api/submissions/[id]/revise`

Admin asks field staff to make changes.

**Who can use**: Admin only

**URL Example**:
```
POST /api/submissions/uuid-500/revise
```

**Request**:
```json
{
  "note": "Please clarify the metrics for step 3"
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "submission_id": "uuid-500",
    "new_status": "revision_requested"
  },
  "error": null
}
```

**What happens**:
1. Changes status: `submitted` → `revision_requested`
2. Saves admin's note in audit_log
3. Field staff sees this form in "Needs Revision" section
4. Field staff can edit and resubmit

**Code location**: `app/api/submissions/[id]/revise/route.ts`

---

### 8. Get Dashboard Stats

#### `GET /api/dashboard`

Get summary numbers for admin dashboard.

**Who can use**: Admin only

**Request**:
```
GET /api/dashboard
```

**Response (Success - 200)**:
```json
{
  "data": {
    "total_submissions": 156,
    "approved_count": 120,
    "pending_count": 25,
    "revision_requested_count": 11,
    "regions": {
      "Central": 50,
      "North": 55,
      "East": 51
    },
    "current_week": "Term 2, Week 5",
    "total_scholars": 15240,
    "avg_retention_rate": 98.5
  },
  "error": null
}
```

**Code location**: `app/api/dashboard/route.ts`

---

### 9. Export to CSV

#### `POST /api/export/csv`

Download all submissions as Excel/CSV file.

**Who can use**: Admin only

**Request**:
```json
{
  "week_label": "Term 2, Week 5",
  "status": "approved"
}
```

**Response**: (File download)

The browser automatically downloads a file named `submissions.csv`

**File content example**:
```csv
field_name,region,week_label,status,submitted_at,scholar_count,retention_rate
John Musoke,Central,Term 2 Week 5,approved,2026-03-21,155,103.3
Sarah Opiyo,North,Term 2 Week 5,approved,2026-03-21,142,98.7
```

**Opens in**:
- Excel
- Google Sheets
- Any text editor

**Code location**: `app/api/export/csv/route.ts`

---

### 10. Export Single Submission

#### `POST /api/submissions/[id]/export`

Download one submission as PDF/DOC.

**Who can use**: Admin only (or form owner)

**URL Example**:
```
POST /api/submissions/uuid-500/export
```

**Request**:
```json
{
  "format": "pdf"  // or "docx"
}
```

**Response**: (File download)

Browser downloads `submission-uuid-500.pdf` or `.docx`

**Code location**: `app/api/submissions/[id]/export/route.ts`

---

### 11. Summarize with AI

#### `POST /api/submissions/[id]/summarize`

Generate AI summary of submission (optional, needs API key).

**Who can use**: Admin only

**URL Example**:
```
POST /api/submissions/uuid-500/summarize
```

**Request**: (No body needed)

**Response (Success - 200)**:
```json
{
  "data": {
    "summary": "John's field has shown strong performance with 155 scholars maintained, exceeding retention targets. Key challenges in mentorship engagement were addressed through focused support, resulting in 100% passbook completion. Priority initiatives on track. Two risks identified: transportation challenges and mentor availability, with mitigation strategies documented.",
    "key_points": [
      "155 scholars retained (103.3% growth)",
      "100% passbook completion",
      "2 risks identified with mitigations"
    ]
  },
  "error": null
}
```

**Requires**:
- `ANTHROPIC_API_KEY` in environment
- Claude API access

**Code location**: `app/api/submissions/[id]/summarize/route.ts`

---

### 12. Get Current Week

#### `GET /api/weeks`

Get current week configuration.

**Who can use**: Any authenticated user

**Request**:
```
GET /api/weeks
```

**Response (Success - 200)**:
```json
{
  "data": {
    "current_week": {
      "id": "uuid-100",
      "label": "Term 2, Week 5",
      "term": "Term 2",
      "week_number": 5,
      "is_current": true
    },
    "all_weeks": [
      {
        "id": "uuid-100",
        "label": "Term 2, Week 1",
        "term": "Term 2",
        "week_number": 1,
        "is_current": false
      },
      ...
    ]
  },
  "error": null
}
```

**Used for**:
- Showing which week to submit for
- Dropdown in forms
- Dashboard filtering

**Code location**: `app/api/weeks/route.ts`

---

### 13. Manage Users

#### `GET /api/users`

List all users (admin only).

**Who can use**: Admin only

**Request**:
```
GET /api/users
```

**Response (Success - 200)**:
```json
{
  "data": [
    {
      "id": "uuid-123",
      "email": "john@school.ug",
      "full_name": "John Musoke",
      "region": "Central",
      "role": "field_staff",
      "created_at": "2026-02-15T08:00:00Z"
    },
    {
      "id": "uuid-456",
      "email": "admin@school.ug",
      "full_name": "Sarah Admin",
      "region": "Head Qtr",
      "role": "admin",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

**Code location**: `app/api/users/route.ts`

---

#### `POST /api/users`

Create new user (admin only).

**Who can use**: Admin only

**Request**:
```json
{
  "email": "newuser@school.ug",
  "password": "SecurePass123",
  "full_name": "New Staff",
  "region": "South",
  "role": "field_staff"
}
```

**Response (Success - 201)**:
```json
{
  "data": {
    "user_id": "uuid-789",
    "email": "newuser@school.ug"
  },
  "error": null
}
```

---

#### `PUT /api/users/[id]`

Update user details (admin only).

**Who can use**: Admin only

**URL Example**:
```
PUT /api/users/uuid-123
```

**Request** (only fields to update):
```json
{
  "full_name": "John Updated",
  "region": "North",
  "role": "admin"
}
```

**Response (Success - 200)**:
```json
{
  "data": {
    "user_id": "uuid-123",
    "updated_fields": ["full_name", "region", "role"]
  },
  "error": null
}
```

**Code location**: `app/api/users/[id]/route.ts`

---

## Error Response Format

All errors follow this pattern:

```json
{
  "data": null,
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data retrieved/saved |
| 201 | Created | New user created |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Not admin/owner |
| 404 | Not Found | Submission doesn't exist |
| 500 | Server Error | Database error |

---

## Testing Endpoints

### Using cURL

```bash
# Get submissions list
curl -X GET http://localhost:3000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create draft
curl -X POST http://localhost:3000/api/draft \
  -H "Content-Type: application/json" \
  -d '{"data": {"step1": {...}}}'
```

### Using Postman

1. Install Postman (https://www.postman.com/downloads/)
2. Create new request
3. Set method (GET/POST)
4. Set URL
5. Add body (JSON)
6. Send

### Using Browser Console

```javascript
// Get submissions (if admin)
const response = await fetch('/api/submissions')
const data = await response.json()
console.log(data)

// Save draft
const response = await fetch('/api/draft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { step1: {...} }
  })
})
```

---

## Rate Limiting

Not currently enforced but recommended limits:
- **Save draft**: Max 100 per hour
- **Submit form**: Max 1 per minute (prevent spam)
- **Export**: Max 10 per hour

---

## Next Steps

- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for database info
- See [ARCHITECTURE.md](ARCHITECTURE.md) for how data flows
- See [TESTING.md](TESTING.md) for how to test APIs

---

Last Updated: 2026-03-20
