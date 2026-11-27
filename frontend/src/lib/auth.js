// Demo-only session: stored in the browser. The API itself is not access-controlled.
const KEY = 'findly_session';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function signIn({ name, email }) {
  const session = {
    name: name || email.split('@')[0],
    email,
    sessionId: `web_${Math.random().toString(36).slice(2, 10)}`,
    signedInAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  localStorage.removeItem(KEY);
}
