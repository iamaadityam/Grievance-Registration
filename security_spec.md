# CivicPulse AI Security Specification (TDD)

## 1. Zero-Trust Data Invariants
To prevent data poisoning, denial of wallet, and privilege escalation, the following invariants are strictly enforced:
- **Grievance ID Hardening**: Document IDs for grievances must match standard alpha-numeric format (`^[a-zA-Z0-9_\-]+$`) and must not exceed 128 characters.
- **Strict Fields Check**: The creation of a Grievance requires all core keys (`name`, `contact`, `description`, `department`, `urgency`, `cleanLocation`, `summary`, `latitude`, `longitude`, `status`, `createdAt`, `trafficCount`, `reportersList`). Additional fields must conform strictly to expected schema definitions and size limits.
- **Unauthenticated Citizen Limitation**: Non-logged-in users can *only* create valid grievances, or *consolidate* existing active ones. During duplicate consolidation, the client is strictly constrained to changing ONLY `trafficCount` (which must increment exactly by 1) and `reportersList` (which must append exactly 1 new reporter object, and not exceed 200 in total).
- **Terminal State Lock**: Once a grievance's status is set to `Resolved`, it cannot be changed or reverted by a citizen. Any other updates to protected fields (such as `status`, `department`, `assignedBody`, etc.) require admin-level authentication.
- **String Size Bounds**: To prevent Denial of Wallet memory/storage consumption attacks, all string inputs are bounded (e.g., `description <= 5000` chars, `name <= 128` chars).

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 attack payloads are designed to challenge and bypass the Security Rules. Each must be explicitly denied:

### Payload 1: The Administrative Escalator (Identity Spoofing)
- **Objective**: An unauthenticated user attempts to create a grievance while marking themselves as "Resolved" or setting an elevated security status directly.
- **Malicious Payload**:
  ```json
  {
    "name": "Attacker",
    "contact": "9999999999",
    "description": "Trash pile",
    "department": "Garbage Report",
    "urgency": "High",
    "cleanLocation": "Delhi",
    "summary": "Garbage",
    "latitude": 28.6,
    "longitude": 77.2,
    "status": "Resolved",
    "createdAt": "2026-07-08T10:00:00.000Z",
    "trafficCount": 1,
    "reportersList": [{"name": "Attacker", "contact": "9999999999", "reportedAt": "2026-07-08T10:00:00.000Z", "description": "Trash pile"}],
    "isAdmin": true
  }
  ```
- **Rule Protection**: `isValidGrievance()` restricts properties. It forbids arbitrary keys like `isAdmin` through exact key containment and strict type checks. Unauthenticated updates cannot change the `status` to `Resolved` or modify fields other than `trafficCount` and `reportersList`.

### Payload 2: The Bulk Ghost Injection (Resource Poisoning)
- **Objective**: Bypass string boundaries to inject 5MB of random characters into `description`.
- **Malicious Payload**:
  ```json
  {
    "name": "Attacker",
    "contact": "9999999999",
    "description": "[A 5MB string of repeat 'A' characters...]",
    "department": "Garbage Report",
    "urgency": "High",
    "cleanLocation": "Delhi",
    "summary": "Garbage",
    "latitude": 28.6,
    "longitude": 77.2,
    "status": "Open",
    "createdAt": "2026-07-08T10:00:00.000Z",
    "trafficCount": 1,
    "reportersList": []
  }
  ```
- **Rule Protection**: `data.description.size() <= 5000` checks the length of the string at rule evaluation time and immediately rejects payloads exceeding the limit.

### Payload 3: The Arbitrary Field Injection (The "Ghost Field" Attack)
- **Objective**: Add a non-existent property (e.g., `verifiedByAI: true`) to the ticket database to bypass filters.
- **Malicious Payload**:
  ```json
  {
    "name": "Citizen",
    "contact": "9876543210",
    "description": "Pothole issue",
    "department": "Potholes",
    "urgency": "Medium",
    "cleanLocation": "Delhi",
    "summary": "Pothole",
    "latitude": 28.6,
    "longitude": 77.2,
    "status": "Open",
    "createdAt": "2026-07-08T10:00:00.000Z",
    "trafficCount": 1,
    "reportersList": [],
    "verifiedByAI": true
  }
  ```
- **Rule Protection**: Strictly lists optional allowable properties. Any unrecognized key (such as `verifiedByAI`) fails the whitelist evaluation.

### Payload 4: ID Path Variable Poisoning (ID characters injection)
- **Objective**: Access / Write to a grievance document with an extremely long or dangerous ID pattern (e.g., directory traversal or injection).
- **ID tested**: `grievances/../../etc/passwd` or a 1KB random ID.
- **Rule Protection**: `isValidId(grievanceId)` checks ID format against `^[a-zA-Z0-9_\-]+$` and limits length to 128 characters.

### Payload 5: The Duplicate Consolidation Hijack (Arbitrary state overwrite)
- **Objective**: An unauthenticated citizen attempts to hijack a duplicate consolidate update, altering the `assignedBody` or `department` instead of just appending a reporter.
- **Malicious Update Payload**:
  ```json
  {
    "department": "Water Logging",
    "trafficCount": 2,
    "reportersList": [{"name": "New Citizen", "contact": "9812345678", "reportedAt": "...", "description": "..."}]
  }
  ```
- **Rule Protection**: `affectedKeys().hasOnly(['trafficCount', 'reportersList'])` detects any attempt to alter fields like `department` and rejects the request.

### Payload 6: The Increment Bypass (Arbitrary traffic count bump)
- **Objective**: Increase the traffic count of a ticket by 10,000 to artificially inflate priority.
- **Malicious Update Payload**:
  ```json
  {
    "trafficCount": 10005,
    "reportersList": [{"name": "A", "contact": "B", "reportedAt": "...", "description": "..."}]
  }
  ```
- **Rule Protection**: `incoming().trafficCount == existing().trafficCount + 1` ensures only sequential increments are allowed for unauthenticated updates.

### Payload 7: Terminal State Bypass (Re-opening a closed ticket)
- **Objective**: Force a resolved complaint back to "Open" status.
- **Malicious Update Payload**:
  ```json
  {
    "status": "Open"
  }
  ```
- **Rule Protection**: Update logic blocks changing status if the existing status is already `Resolved`, except for authenticated staff.

### Payload 8: Image Verification Status Spoofing
- **Objective**: Manually set `imageVerificationStatus` to `'verified'` while providing no real image, or uploading trash.
- **Malicious Payload**:
  ```json
  {
    "name": "Spammer",
    "contact": "9812345678",
    "description": "Clean up immediately",
    "department": "Garbage Report",
    "urgency": "Low",
    "cleanLocation": "Delhi",
    "summary": "Trash",
    "latitude": 28.6,
    "longitude": 77.2,
    "status": "Open",
    "createdAt": "2026-07-08T10:00:00.000Z",
    "trafficCount": 1,
    "reportersList": [],
    "imageVerificationStatus": "verified"
  }
  ```
- **Rule Protection**: Checked during structural validation; unauthenticated clients cannot overwrite this field on updates, and during create, it must conform strictly to `imageVerificationStatus` type limits.

### Payload 9: Unauthorized Ticket Deletion
- **Objective**: A random citizen attempts to delete a high-priority grievance.
- **Rule Protection**: `allow delete: if isSignedIn();` blocks all unauthenticated delete operations.

### Payload 10: Infinite Reporter List Overflow
- **Objective**: Inject a 500-element list to overflow the database.
- **Malicious Payload**:
  ```json
  {
    "reportersList": [ /* 500 reporter items */ ]
  }
  ```
- **Rule Protection**: `incoming().reportersList.size() <= 200` restricts total list length.

### Payload 11: Spoofed Coordinates Injection (Extreme Bounds)
- **Objective**: Set latitude/longitude to extreme boundaries or invalid values like 999.0 to crash coordinates calculation.
- **Malicious Payload**:
  ```json
  {
    "latitude": 999.0,
    "longitude": -1000.0
  }
  ```
- **Rule Protection**: Handled by coordinate range validations in rules, ensuring lat-lng values conform to valid double values (e.g. `lat >= -90` and `lat <= 90`).

### Payload 12: Anonymous Write Access on System Guardrail Fields
- **Objective**: Overwrite the `guardrailRelevanceScore` or `guardrailFlaggedReason` to pretend a junk report is approved.
- **Rule Protection**: `affectedKeys().hasOnly(['trafficCount', 'reportersList'])` prevents changing any guardrail or AI evaluation fields on update.

---

## 3. Test Suite Specification (`firestore.rules.test.ts`)

A mock test suite in TypeScript for verifying these behaviors:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules Tests", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "voltaic-photon-tnn32",
      firestore: {
        rules: require("fs").readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("should fail to create a grievance with a missing required key (Pillar 2)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const incompletePayload = {
      name: "John Doe",
      contact: "9876543210"
      // Missing all other fields!
    };
    await assertFails(setDoc(doc(db, "grievances", "ticket_123"), incompletePayload));
  });

  it("should succeed to create a valid grievance as unauthenticated (Intake Path)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const validPayload = {
      name: "John Doe",
      contact: "9876543210",
      description: "Severe water logging",
      department: "Water Logging",
      urgency: "High",
      cleanLocation: "Connaught Place, Delhi",
      summary: "Water clog",
      latitude: 28.61,
      longitude: 77.23,
      status: "Open",
      createdAt: "2026-07-08T10:00:00.000Z",
      trafficCount: 1,
      reportersList: [{ name: "John Doe", contact: "9876543210", reportedAt: "2026-07-08T10:00:00.000Z", description: "Severe water logging" }]
    };
    await assertSucceeds(setDoc(doc(db, "grievances", "ticket_123"), validPayload));
  });

  it("should fail update if citizen attempts to alter status, department, or admin fields (Pillar 4)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    
    // Seed initial doc
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const adminDb = adminContext.firestore();
      await setDoc(doc(adminDb, "grievances", "ticket_123"), {
        name: "John", contact: "9876543210", description: "Trash", department: "Garbage Report",
        urgency: "Medium", cleanLocation: "Delhi", summary: "Trash", latitude: 28.6, longitude: 77.2,
        status: "Open", createdAt: "2026-07-08T10:00:00.000Z", trafficCount: 1, reportersList: []
      });
    });

    // Malicious Update Attempt
    await assertFails(updateDoc(doc(db, "grievances", "ticket_123"), {
      status: "Resolved",
      trafficCount: 2
    }));
  });

  it("should fail update if citizen increments trafficCount by more than 1 (Pillar 5)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const adminDb = adminContext.firestore();
      await setDoc(doc(adminDb, "grievances", "ticket_123"), {
        name: "John", contact: "9876543210", description: "Trash", department: "Garbage Report",
        urgency: "Medium", cleanLocation: "Delhi", summary: "Trash", latitude: 28.6, longitude: 77.2,
        status: "Open", createdAt: "2026-07-08T10:00:00.000Z", trafficCount: 1, reportersList: []
      });
    });

    await assertFails(updateDoc(doc(db, "grievances", "ticket_123"), {
      trafficCount: 10, // Invalid increment!
      reportersList: [{ name: "Mary", contact: "9999999999", reportedAt: "...", description: "Trash" }]
    }));
  });

  it("should succeed duplicate consolidation if parameters are exact increments (Pillar 4)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    
    await testEnv.withSecurityRulesDisabled(async (adminContext) => {
      const adminDb = adminContext.firestore();
      await setDoc(doc(adminDb, "grievances", "ticket_123"), {
        name: "John", contact: "9876543210", description: "Trash", department: "Garbage Report",
        urgency: "Medium", cleanLocation: "Delhi", summary: "Trash", latitude: 28.6, longitude: 77.2,
        status: "Open", createdAt: "2026-07-08T10:00:00.000Z", trafficCount: 1, reportersList: []
      });
    });

    await assertSucceeds(updateDoc(doc(db, "grievances", "ticket_123"), {
      trafficCount: 2,
      reportersList: [{ name: "Mary", contact: "9999999999", reportedAt: "2026-07-08T10:10:00.000Z", description: "Trash" }]
    }));
  });

  it("should block unauthenticated deletions entirely (Pillar 6)", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(deleteDoc(doc(db, "grievances", "ticket_123")));
  });
});
```
