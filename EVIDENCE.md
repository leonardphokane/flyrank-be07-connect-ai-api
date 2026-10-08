# Evidence — FlyRank Capstone

## Test Runs
```bash
npm test


✅ All 10 tests passed (triage + queue worker).

## API Demo
**Request**:

```bash
json
{ "text": "Customer cannot log in to dashboard" }

```

**Response**:

```bash
json
{
  "category": "bug",
  "urgency": "high",
  "confidence": 0.92,
  "reason": "Login failure indicates a critical bug."
}

```

## Reliability Proofs
- Idempotency key verified in publish logs.

- Retry‑After respected on simulated 429.

- Webhook signature validation rejects forged payloads.

- Crash recovery tested with durable worker restart.

## Screenshots

- **Test Run Output**  
  Captured during the latest `npm test` execution, showing all suites green.

- **All Tests Passing**  
  ![All Tests Passing](screenshots/all-tests-green.png)


