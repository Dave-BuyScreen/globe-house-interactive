// Uploads the Base44 media files to Supabase Storage bucket "uploads", folder "base44".
// Runs as a signed-in app user (the bucket allows inserts from any authenticated user),
// so it does not need the service role key or Supabase CLI access.
//
// Usage:
//   SB_EMAIL=you@example.com SB_PASSWORD=... node --env-file=.env.local \
//     scripts/upload-base44-media.mjs ~/Desktop/globehouse-media-upload
//
// Then run supabase/sql/rewrite-base44-media.sql in the SQL editor.
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const dir = process.argv[2];
const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anon, SB_EMAIL: email, SB_PASSWORD: password } = process.env;
if (!dir || !url || !anon || !email || !password) {
  console.error('Need <dir> arg, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SB_EMAIL, SB_PASSWORD');
  process.exit(1);
}

const types = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.mov': 'video/quicktime', '.webm': 'video/webm',
};

const supabase = createClient(url, anon, { auth: { persistSession: false } });
const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error('Sign-in failed:', authError.message);
  process.exit(1);
}

let failed = 0;
for (const name of (await readdir(dir)).filter((f) => !f.startsWith('.'))) {
  const contentType = types[extname(name).toLowerCase()] || 'application/octet-stream';
  const { error } = await supabase.storage
    .from('uploads')
    .upload(`base44/${name}`, await readFile(join(dir, name)), { contentType, upsert: false });
  if (error && !/exists/i.test(error.message)) {
    failed++;
    console.error(`FAIL ${name}: ${error.message}`);
  } else {
    console.log(`${error ? 'skip (exists)' : 'ok'} ${name}`);
  }
}
console.log(failed ? `${failed} failed` : 'All uploaded.');
process.exit(failed ? 1 : 0);
