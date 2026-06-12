import { Client, Databases, Storage, ID } from 'node-appwrite';
import { recognize } from './providers/sarvam.js';
import { matchTranscript } from './match.js';

const DATABASE_ID          = 'aksharvan';
const COLLECTION_RECORDINGS = 'recordings';
const BUCKET_RECORDINGS     = 'recordings';

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

  const { audioBase64, mimeType, expected, exerciseId } = body ?? {};

  if (typeof audioBase64 !== 'string' || !audioBase64) {
    return res.json({ error: 'audioBase64 is required', code: 'BAD_REQUEST' }, 400);
  }
  if (!Array.isArray(expected) || expected.length === 0) {
    return res.json({ error: 'expected must be a non-empty array', code: 'BAD_REQUEST' }, 400);
  }

  // Decode audio
  let audioBuffer;
  try {
    audioBuffer = Buffer.from(audioBase64, 'base64');
  } catch {
    return res.json({ error: 'Invalid base64 audio', code: 'BAD_REQUEST' }, 400);
  }

  const resolvedMime = typeof mimeType === 'string' && mimeType ? mimeType : 'audio/webm';

  // Call ASR provider
  let transcript = '';
  let providerConf = 0;
  try {
    const result = await recognize(audioBuffer, resolvedMime, 'hi-IN');
    transcript   = result.transcript;
    providerConf = result.confidence;
  } catch (err) {
    error('ASR provider error: ' + err.message);
    return res.json({ error: 'ASR provider unavailable', code: 'ASR_ERROR' }, 502);
  }

  // Closed-vocabulary match
  const { matched, confidence } = matchTranscript(transcript, expected, providerConf);

  // Consent-gated recording storage
  const consentHeader = req.headers['x-consent'];
  if (consentHeader === 'true' && typeof exerciseId === 'string') {
    try {
      const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const storage   = new Storage(client);
      const databases = new Databases(client);

      const fileId = ID.unique();
      const blob   = new Blob([audioBuffer], { type: resolvedMime });
      await storage.createFile(BUCKET_RECORDINGS, fileId, blob);

      await databases.createDocument(DATABASE_ID, COLLECTION_RECORDINGS, ID.unique(), {
        profile_id:  userId,
        exercise_id: exerciseId,
        audio_path:  fileId,
        expected:    expected[0] ?? '',
        transcript,
        matched,
        created_at:  new Date().toISOString(),
      });
    } catch (err) {
      // Non-fatal — log and proceed; matching result still returned
      error('consent recording storage failed: ' + err.message);
    }
  }

  return res.json({ matched, confidence, transcript });
};
