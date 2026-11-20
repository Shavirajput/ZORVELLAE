# MongoDB Atlas Connectivity Troubleshooting

This runbook uses the repository's existing Mongoose connection and does not
weaken TLS verification. Never print or share `MONGO_URI`, its credentials, or
an unredacted connection error. Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` or
use `tlsAllowInvalidCertificates`; never allow all IPs (`0.0.0.0/0`) in Atlas.

## Current diagnostic status

Last checked on 2026-11-19:

- `backend/.env` exists and the backend loads it from `backend/server.js` with
  `override: false`. `MONGO_URI` is configured there; its value is not logged.
- The URI parses as `mongodb+srv`, credentials are present, and no database
  path or query options are configured. The application explicitly selects
  database `zorvellae` in `backend/config/db.js`.
- SRV resolution returned three records and TXT resolution returned one.
- TCP connections to all three SRV targets on their advertised port succeeded.
- Strict TLS handshakes failed for all three targets with
  `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` (TLS alert 80).
- Mongoose therefore failed during server selection, with nested
  `MongoNetworkError` errors caused by the TLS handshake. Authentication and
  database selection were not reached.

This establishes the failing stage, not the underlying cause. Atlas-side
network policy, cluster state, and intervening network/TLS inspection cannot be
observed from this workspace. Do not claim a fix until the application makes a
real connection and the health endpoint reports the selected database.

## Safe diagnostic sequence

1. **Check environment loading without showing values.** From the repository
   root, list only variable names:

   ```powershell
   Get-Content backend\.env |
     Where-Object { $_ -match '^\s*[A-Za-z_][A-Za-z0-9_]*\s*=' } |
     ForEach-Object { ($_ -split '=', 2)[0].Trim() } |
     Sort-Object -Unique
   ```

   Confirm `MONGO_URI` is present. `backend/server.js` loads that file before
   requiring the connection module; an externally supplied process variable
   takes precedence because dotenv uses `override: false`.

2. **Check the effective URI shape without printing it.** Verify that the
   scheme is `mongodb+srv:` (or `mongodb:` for an approved non-SRV deployment),
   the hostname is the expected Atlas cluster, and credentials are correctly
   percent-encoded. The API explicitly selects `zorvellae`; the URI does not
   need a database path. Do not paste the URI into tickets, logs, or chat.

3. **Check Atlas and DNS.** In Atlas, verify the cluster is running, the
   database user exists, and Network Access includes the current public egress
   IP with the narrowest suitable CIDR. Do not use `0.0.0.0/0`. Resolve the
   SRV and TXT records from the same host running the API:

   ```powershell
   Resolve-DnsName -Type SRV _mongodb._tcp.<atlas-cluster-host>
   Resolve-DnsName -Type TXT <atlas-cluster-host>
   ```

   Do not include credentials in the hostname or command.

4. **Separate TCP from TLS.** Test each SRV target on its advertised port
   (normally 27017), then test TLS with certificate verification enabled. A
   successful TCP connection alone does not establish that the MongoDB TLS
   handshake or authentication works. If TLS fails before authentication,
   investigate Atlas/network policy, cluster state, outbound filtering, and
   TLS inspection with the network or Atlas operator. Do not bypass
   certificate verification.

5. **Check the runtime.** Record `node --version`,
   `node -p "process.versions.openssl"`, and the installed Mongoose version.
   Review proxy/egress configuration and Node options by variable name only;
   never dump a full process environment. Do not add TLS options unless their
   necessity and security are verified.

6. **Start the API and check liveness/readiness separately.**

   ```powershell
   npm.cmd --prefix backend start
   Invoke-RestMethod http://127.0.0.1:5000/api/health
   ```

   `/api/health` is a liveness endpoint and intentionally returns HTTP 200
   while the API process is running. Read `database.connected` and
   `database.status`; `database.name` is populated only when Mongoose is
   connected. A disconnected health response is not a successful database
   check. The backend logs the connection stage and safe error identifiers,
   while omitting the URI, hostname, error message, and stack.

7. **Verify success only after a real connection.** Confirm the backend logs
   `MongoDB connected (database: zorvellae)` and health reports
   `connected: true` and `name: "zorvellae"`. Repeat read-only health checks
   over several minutes. Only then run any approved database-backed tests.

## Failure behavior

`backend/config/db.js` retries connection failures with exponential backoff
(5 seconds initially, capped at 30 seconds). The server starts even while the
database is unavailable. Database-dependent catalog, customer, order, and
admin APIs check connection state and return a safe HTTP 503 response rather
than success-shaped data. Public catalog 503 behavior and admin authorization
failure behavior are covered by database-independent tests.

The health endpoint remains HTTP 200 while reporting the actual Mongoose state;
use it for liveness, not readiness. No TLS bypass, local mock database, or
automatic data mutation is part of this troubleshooting process.

## Related implementation

- [db.js](../backend/config/db.js) — safe connection diagnostics and retry.
- [server.js](../backend/server.js) — dotenv loading and non-blocking startup.
- [health.routes.js](../backend/routes/health.routes.js) — process and DB state.
- [catalog.controller.js](../backend/controllers/catalog.controller.js) — safe
  unavailable response for public catalog APIs.
