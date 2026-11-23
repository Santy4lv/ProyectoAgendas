import { useCallback, useEffect, useState } from 'react';
import { Navbar, type RutaApp } from './components/Navbar';
import { ScrollShowcase } from './components/ScrollShowcase';
import { ClinicProvider } from './context/ClinicContext';
import type { RolUsuario } from './domain/types';
import { AgendarView } from './views/AgendarView';
import { AgendaView } from './views/AgendaView';
import { InventarioView } from './views/InventarioView';
import { LoginView } from './views/LoginView';
import './App.css';

function normalizarRuta(pathname: string): RutaApp {
  switch (pathname) {
    case '/':
      return '/';
    case '/login':
      return '/login';
    case '/agendar':
      return '/agendar';
    case '/agenda':
      return '/agenda';
    case '/inventario':
      return '/inventario';
    default:
      return '/';
  }
}

function AppShell() {
  const [ruta, setRuta] = useState<RutaApp>(() =>
    normalizarRuta(window.location.pathname),
  );

  const navegar = useCallback((nuevaRuta: RutaApp) => {
    if (window.location.pathname !== nuevaRuta) {
      window.history.pushState({}, '', nuevaRuta);
    }
    setRuta(nuevaRuta);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRuta(normalizarRuta(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleLoginSuccess = useCallback(
    (rol: RolUsuario) => {
      navegar(rol === 'ADMIN_BODEGA' ? '/inventario' : '/agendar');
    },
    [navegar],
  );

  if (ruta === '/') {
    return (
      <div className="app-shell">
        <ScrollShowcase onIrAlSistema={() => navegar('/agendar')} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar rutaActual={ruta} onNavegar={navegar} />

      <main className="app-main">
        {ruta === '/login' && <LoginView onLoginSuccess={handleLoginSuccess} />}
        {ruta === '/agendar' && <AgendarView />}
        {ruta === '/agenda' && <AgendaView />}
        {ruta === '/inventario' && <InventarioView />}
      </main>

      <footer className="app-footer">
        <span>
          MVP · Sistema de Agendamiento Vinculado a Stock · Fórmula:{' '}
          <strong>Stock Disponible Real = Stock Físico − Stock Comprometido</strong>
        </span>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ClinicProvider>
      <AppShell />
    </ClinicProvider>
  );
}

export default App;
