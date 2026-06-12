import { Client, Databases, Users, Query } from 'node-appwrite';
import bcrypt from 'bcryptjs';

const DATABASE_ID        = 'aksharvan';
const COLLECTION_PROFILES = 'profiles';

/** Rate-limit store: phone → { count, firstAt } in memory per cold start.
 *  For production, replace with an Appwrite document or Redis. The in-memory
 *  store works for prototype scale (single warm instance per function). */
const attemptMap = new Map();
const LIMIT_COUNT  = 5;
const LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in ms

function isRateLimited(phone) {
  const now  = Date.now();
  const entry = attemptMap.get(phone);
  if (!entry) return false;
  if (now - entry.firstAt > LIMIT_WINDOW) {
    attemptMap.delete(phone);
    return false;
  }
  return entry.count >= LIMIT_COUNT;
}

function recordAttempt(phone) {
  const now  = Date.now();
  const entry = attemptMap.get(phone);
  if (!entry || Date.now() - entry.firstAt > LIMIT_WINDOW) {
    attemptMap.set(phone, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(phone) {
  attemptMap.delete(phone);
}

/** Generic auth failure — identical shape for wrong phone AND wrong PIN. */
const AUTH_FAIL = { error: 'Invalid phone or PIN', code: 'AUTH_FAILED' };

export default async ({ req, res, log, error }) => {
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, 400);
  }

  const { phone, pin } = body ?? {};

  if (typeof phone !== 'string' || !phone.trim()) {
    return res.json(AUTH_FAIL, 401);
  }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return res.json(AUTH_FAIL, 401);
  }

  const normalizedPhone = phone.trim();

  if (isRateLimited(normalizedPhone)) {
    return res.json({ error: 'Too many attempts. Try again later.', code: 'RATE_LIMITED' }, 429);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users     = new Users(client);

  let profile;
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_PROFILES,
      [Query.equal('parent_phone', normalizedPhone), Query.limit(1)]
    );
    profile = result.documents[0] ?? null;
  } catch (err) {
    error('login-with-pin DB lookup failed: ' + err.message);
    return res.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, 500);
  }

  // No profile or no PIN set — return the same shape to prevent enumeration
  if (!profile || !profile.pin_hash) {
    recordAttempt(normalizedPhone);
    return res.json(AUTH_FAIL, 401);
  }

  const match = await bcrypt.compare(pin, profile.pin_hash);
  if (!match) {
    recordAttempt(normalizedPhone);
    return res.json(AUTH_FAIL, 401);
  }

  // PIN correct — mint a custom token the client exchanges for a session
  clearAttempts(normalizedPhone);

  try {
    const token = await users.createToken(profile.$id);
    return res.json({ userId: profile.$id, secret: token.secret });
  } catch (err) {
    error('login-with-pin token creation failed: ' + err.message);
    return res.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, 500);
  }
};
