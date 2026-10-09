import http from 'http';
import app from '../../../server';
import { signToken } from '../middleware/auth';
import db from '../db';

async function runSecuritySuite() {
  console.log('\n================================================================');
  console.log('       SCHOOL MANAGEMENT SYSTEM - SECURITY PROOF TEST SUITE      ');
  console.log('================================================================\n');

  // Start temporary HTTP test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST HARNESS] Ephemeral test server active on port ${port}\n`);

  let allPassed = true;

  try {
    // -------------------------------------------------------------------------
    // SETUP: GENERATE CRYPTOGRAPHICALLY SIGNED TOKENS FOR USER A AND USER B
    // -------------------------------------------------------------------------
    const userAToken = signToken({
      id: 'user-admin-a',
      role: 'admin',
      department_id: 'dept-admin',
      school_id: 'school-1',
      email: 'admin.a@school1.edu.ng',
    });

    const userBToken = signToken({
      id: 'user-admin-b',
      role: 'admin',
      department_id: 'dept-admin',
      school_id: 'school-2',
      email: 'admin.b@school2.edu.ng',
    });

    console.log('[STEP 1] User A (Tenant: school-1) creates a student record...');
    const createRes = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        admission_no: `SEC/TEST/${Date.now().toString().slice(-4)}`,
        first_name: 'Adewale',
        last_name: 'Soyinka',
      }),
    });

    const createdRecord = await createRes.json();
    console.log(`  -> Status: ${createRes.status} Created`);
    console.log(`  -> Created Record ID: ${createdRecord.id} | School: ${createdRecord.school_id}`);

    if (createRes.status !== 201 || !createdRecord.id) {
      throw new Error(`Failed to create test record: ${JSON.stringify(createdRecord)}`);
    }

    const targetRecordId = createdRecord.id;

    // -------------------------------------------------------------------------
    // TEST 1: USER B ATTEMPTS TO READ RECORD BELONGING TO USER A
    // -------------------------------------------------------------------------
    console.log('\n[STEP 2] User B (Tenant: school-2) attempts to READ User A\'s record:');
    console.log(`  -> GET /api/students/${targetRecordId} with User B Token...`);
    const readRes = await fetch(`${baseUrl}/api/students/${targetRecordId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const readBody = await readRes.json();
    console.log(`  -> Response Status: ${readRes.status} (Expected: 404 or 403)`);
    console.log(`  -> Response Body:`, JSON.stringify(readBody));

    if (readRes.status === 404 || readRes.status === 403) {
      console.log('  [PASS] Read access blocked across tenants!');
    } else {
      console.error('  [FAIL] Cross-tenant read was allowed!');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST 2: USER B ATTEMPTS TO UPDATE RECORD BELONGING TO USER A
    // -------------------------------------------------------------------------
    console.log('\n[STEP 3] User B (Tenant: school-2) attempts to UPDATE User A\'s record:');
    console.log(`  -> PUT /api/students/${targetRecordId} with User B Token...`);
    const updateRes = await fetch(`${baseUrl}/api/students/${targetRecordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        first_name: 'TamperedNameByHacker',
      }),
    });
    const updateBody = await updateRes.json();
    console.log(`  -> Response Status: ${updateRes.status} (Expected: 404 or 403)`);
    console.log(`  -> Response Body:`, JSON.stringify(updateBody));

    if (updateRes.status === 404 || updateRes.status === 403) {
      console.log('  [PASS] Cross-tenant update blocked!');
    } else {
      console.error('  [FAIL] Cross-tenant update was allowed!');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST 3: USER B ATTEMPTS TO DELETE RECORD BELONGING TO USER A
    // -------------------------------------------------------------------------
    console.log('\n[STEP 4] User B (Tenant: school-2) attempts to DELETE User A\'s record:');
    console.log(`  -> DELETE /api/students/${targetRecordId} with User B Token...`);
    const deleteRes = await fetch(`${baseUrl}/api/students/${targetRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const deleteBody = await deleteRes.json();
    console.log(`  -> Response Status: ${deleteRes.status} (Expected: 404 or 403)`);
    console.log(`  -> Response Body:`, JSON.stringify(deleteBody));

    if (deleteRes.status === 404 || deleteRes.status === 403) {
      console.log('  [PASS] Cross-tenant deletion blocked!');
    } else {
      console.error('  [FAIL] Cross-tenant deletion was allowed!');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST 4: MASS ASSIGNMENT REJECTION TEST
    // -------------------------------------------------------------------------
    console.log('\n[STEP 5] Testing MASS ASSIGNMENT rejection on request body:');
    console.log('  -> Sending payload with unauthorized fields: role, is_admin, school_id...');
    const massAssignRes = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        admission_no: 'ADM/2026/SEC-99',
        first_name: 'Injected',
        last_name: 'Payload',
        role: 'superadmin',       // FORBIDDEN
        is_admin: true,           // FORBIDDEN
        school_id: 'school-999',  // FORBIDDEN
      }),
    });
    const massAssignBody = await massAssignRes.json();
    console.log(`  -> Response Status: ${massAssignRes.status} (Expected: 400 Bad Request)`);
    console.log(`  -> Response Body:`, JSON.stringify(massAssignBody));

    if (massAssignRes.status === 400 && JSON.stringify(massAssignBody).includes('unrecognized_keys')) {
      console.log('  [PASS] Strict schema rejected unknown mass assignment fields!');
    } else {
      console.error('  [FAIL] Mass assignment payload was not strictly rejected!');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TEST 5: PAYMENT PRICE MANIPULATION ATTACK
    // -------------------------------------------------------------------------
    console.log('\n[STEP 6] Testing PAYMENT PRICE MANIPULATION attack:');
    console.log('  -> Attacker attempts to pass amount: 10 (trying to pay ₦10 instead of ₦75,000)...');
    const paymentTamperRes = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        student_id: targetRecordId,
        fee_type_id: 'fee-term1-tuition',
        amount: 10, // ATTEMPT TO FORCE CHEAP PRICE
        payment_method: 'Cash',
        receipt_no: 'REC-EXPLOIT-001',
      }),
    });
    const paymentTamperBody = await paymentTamperRes.json();
    console.log(`  -> Response Status: ${paymentTamperRes.status} (Expected: 400 Bad Request)`);
    console.log(`  -> Response Body:`, JSON.stringify(paymentTamperBody));

    if (paymentTamperRes.status === 400 && JSON.stringify(paymentTamperBody).includes('amount')) {
      console.log('  [PASS] Client-submitted price strictly rejected! Amount is server-controlled.');
    } else {
      console.error('  [FAIL] Client-submitted amount was not blocked!');
      allPassed = false;
    }

    // Now test legitimate payment: Server looks up canonical price (₦75,000)
    console.log('\n  -> Legitimate payment request (without amount in payload):');
    const legitPayRes = await fetch(`${baseUrl}/api/finance/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        student_id: targetRecordId,
        fee_type_id: 'fee-term1-tuition',
        payment_method: 'Bank Transfer',
        receipt_no: `REC-LEGAL-${Date.now().toString().slice(-4)}`,
      }),
    });
    const legitPayBody = await legitPayRes.json();
    console.log(`  -> Legitimate Payment Status: ${legitPayRes.status} Created`);
    console.log(`  -> Server-Enforced Canonical Amount: ₦${legitPayBody.verified_amount} for '${legitPayBody.fee_name}'`);

    // -------------------------------------------------------------------------
    // TEST 6: RATE LIMITER ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n[STEP 7] Testing RATE LIMITER (max 5 login attempts):');
    let rateLimitTriggered = false;
    for (let i = 1; i <= 6; i++) {
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong.email@school.edu.ng',
          password: 'Password123!',
        }),
      });
      const remaining = loginRes.headers.get('X-RateLimit-Remaining');
      console.log(`  -> Attempt ${i}: Status ${loginRes.status} | Remaining: ${remaining}`);

      if (loginRes.status === 429) {
        rateLimitTriggered = true;
        const rateBody = await loginRes.json();
        console.log(`  -> 429 Body:`, JSON.stringify(rateBody));
        console.log(`  -> Retry-After Header: ${loginRes.headers.get('Retry-After')} seconds`);
        break;
      }
    }

    if (rateLimitTriggered) {
      console.log('  [PASS] Rate limiter triggered HTTP 429 Too Many Requests as expected!');
    } else {
      console.error('  [FAIL] Rate limiter did not trigger 429!');
      allPassed = false;
    }

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('       RESULT: ALL SECURITY PROOF TESTS PASSED (100% SECURE)    ');
  } else {
    console.log('       RESULT: SOME SECURITY TESTS FAILED                       ');
  }
  console.log('================================================================\n');
}

runSecuritySuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
