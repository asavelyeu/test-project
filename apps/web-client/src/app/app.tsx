import { clsx } from 'clsx';

export function App() {
  const buttonClasses = clsx(
    'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm',
    'hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <button type="button" className={buttonClasses}>
        Tailwind works
      </button>
    </div>
  );
}

export default App;
