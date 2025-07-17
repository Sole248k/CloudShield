import '../styles/globals.css';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    <div className="flex">
      <nav className="w-64 h-screen bg-gray-950 p-6 text-white border-r border-gray-800 shadow-md">
        <h1 className="text-2xl font-bold mb-8 tracking-wide border-b border-gray-700 pb-4">PulseShield</h1>

        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="/"
              className={`block px-4 py-2 rounded transition duration-200 ${
                router.pathname === '/' ? 'bg-yellow-400 text-black font-semibold' : 'hover:bg-gray-800'
              }`}
            >
              🏠 Main
            </a>
          </li>
          <li>
            <a
              href="/logs"
              className={`block px-4 py-2 rounded transition duration-200 ${
                router.pathname === '/logs' ? 'bg-yellow-400 text-black font-semibold' : 'hover:bg-gray-800'
              }`}
            >
              📜 Log Reports
            </a>
          </li>
          <li>
            <a
              href="/performance"
              className={`block px-4 py-2 rounded transition duration-200 ${
                router.pathname === '/performance' ? 'bg-yellow-400 text-black font-semibold' : 'hover:bg-gray-800'
              }`}
            >
              📊 Performance Matrix
            </a>
          </li>
        </ul>
      </nav>

      <main className="flex-1 p-6 bg-gray-900 text-white min-h-screen">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp;
