import React, { useEffect } from 'react';
import { useRoute, navigate } from './lib/router';
import { getSession } from './lib/auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AppShell from './app/AppShell';
import Overview from './app/Overview';
import Assistant from './app/Assistant';
import Incidents from './app/Incidents';
import Runbooks from './app/Runbooks';
import Approvals from './app/Approvals';
import System from './app/System';

const PAGES = {
  '/app': Overview,
  '/app/assistant': Assistant,
  '/app/incidents': Incidents,
  '/app/runbooks': Runbooks,
  '/app/approvals': Approvals,
  '/app/system': System,
};

export default function App() {
  const route = useRoute();
  const path = route.split('?')[0].replace(/\/$/, '') || '/';
  const session = getSession();

  useEffect(() => {
    if (path.startsWith('/app') && !session) navigate('/login');
    if (path === '/login' && session) navigate('/app');
  }, [path, session]);

  if (path.startsWith('/app')) {
    if (!session) return null;
    const Page = PAGES[path] || Overview;
    return (
      <AppShell session={session} route={route}>
        <Page session={session} route={route} />
      </AppShell>
    );
  }

  if (path === '/login') {
    const mode = new URLSearchParams(route.split('?')[1] || '').get('mode') === 'signup' ? 'signup' : 'signin';
    return <Login key={mode} mode={mode} />;
  }

  return <Landing />;
}
