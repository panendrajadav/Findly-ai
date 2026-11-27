import { useEffect, useState } from 'react';

function current() {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function useRoute() {
  const [route, setRoute] = useState(current());
  useEffect(() => {
    const onChange = () => { setRoute(current()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path) {
  window.location.hash = path;
}
