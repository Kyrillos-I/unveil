require("dotenv").config();

const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
    })
  : null;

const createWaitlistTableSql = `
  CREATE TABLE IF NOT EXISTS waitlist_emails (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'landing-page',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function initializeDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL is not set. Waitlist submissions will fail until it is configured.");
    return;
  }

  await pool.query(createWaitlistTableSql);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.disable("x-powered-by");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (_request, response) => {
  if (!pool) {
    response.status(200).json({ ok: true, database: "not-configured" });
    return;
  }

  try {
    await pool.query("SELECT 1");
    response.status(200).json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Database health check failed.", error);
    response.status(500).json({ ok: false, database: "error" });
  }
});

app.post("/api/waitlist", async (request, response) => {
  const rawEmail = typeof request.body?.email === "string" ? request.body.email : "";
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    response.status(400).json({ error: "Email is required." });
    return;
  }

  if (!isValidEmail(email)) {
    response.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  if (!pool) {
    response.status(500).json({ error: "Server database is not configured." });
    return;
  }

  try {
    const query = `
      INSERT INTO waitlist_emails (email)
      VALUES ($1)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, created_at;
    `;
    const result = await pool.query(query, [email]);

    if (result.rowCount === 0) {
      response.status(200).json({
        ok: true,
        alreadyJoined: true,
        message: "That email is already on the list.",
      });
      return;
    }

    response.status(201).json({
      ok: true,
      alreadyJoined: false,
      message: "You are on the list.",
    });
  } catch (error) {
    console.error("Waitlist insert failed.", error);
    response.status(500).json({ error: "Unable to join the waitlist right now." });
  }
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(__dirname, "public", "index.html"));
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Unveil is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed.", error);
    process.exit(1);
  });
