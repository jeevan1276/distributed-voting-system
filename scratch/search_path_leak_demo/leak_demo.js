// leak_demo.js
//
// Demonstrates: with a connection pool, a `search_path` set by one
// request can "leak" into the next request if that next request
// forgets to set its own search_path (e.g. a missed error branch,
// a refactor, a new dev unaware of the convention).
//
// Setup:
//   npm install pg
//   psql -U postgres -d voting_system -f setup_leak_demo.sql
//   node leak_demo.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YOUR_PASSWORD@localhost:5432/voting_system',
  max: 1, // <-- forces both requests to reuse the SAME physical connection,
          //     which is what makes the leak deterministic and visible.
          //     With max > 1 the leak is still possible, just probabilistic
          //     (only happens when the pool happens to hand you a "dirty" connection).
});

async function simulateRequest(label, tenantSchema, shouldSetSearchPath) {
  const client = await pool.connect();
  try {
    if (shouldSetSearchPath) {
      await client.query(`SET search_path TO ${tenantSchema}`);
      console.log(`[${label}] set search_path to "${tenantSchema}"`);
    } else {
      console.log(`[${label}] did NOT set search_path (simulating a buggy code path)`);
    }

    const result = await client.query('SELECT * FROM users');
    console.log(`[${label}] query result:`, result.rows);
  } finally {
    // client.release() returns the connection to the pool AS-IS.
    // Its search_path is whatever it was last set to — nothing resets it here.
    client.release();
  }
}

(async () => {
  console.log('--- Request 1: Tenant A logs in and views their users ---');
  await simulateRequest('Request 1 / Tenant A', 'tenant_a', true);

  console.log('\n--- Request 2: Tenant B logs in ---');
  await simulateRequest('Request 2 / Tenant B', 'tenant_b', false);

  await pool.end();
})();
