import { Client, Databases } from 'node-appwrite';
import bcrypt from 'bcryptjs';

const DATABASE_ID        = 'aksharvan';
const COLLECTION_PROFILES = 'profiles';
const BCRYPT_ROUNDS       = 10;

/** Validate that pin is exactly 4 ASCII digits. */
function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

export default async ({ req, res, log, error }) => {
  // Require an authenticated session
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, 400);
  }

  const { pin } = body ?? {};
  if (!isValidPin(pin)) {
    return res.json({ error: 'PIN must be exactly 4 digits', code: 'INVALID_PIN' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const pin_hash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, userId, { pin_hash });
    return res.json({ ok: true });
  } catch (err) {
    error('set-pin failed: ' + err.message);
    return res.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, 500);
  }
};
