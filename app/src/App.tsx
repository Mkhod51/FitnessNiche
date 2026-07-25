import { useEffect, useState } from 'react';
import { initDb, execSql } from './db/client';

export default function App() {
  const [mode, setMode] = useState('booting');
  const [exerciseCount, setExerciseCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const m = await initDb();
      setMode(m);
      const rows = await execSql('select count(*) from exercises', [], 'all');
      setExerciseCount(Number(rows[0]?.[0] ?? 0));
    })().catch((e) => setMode(`error: ${e.message}`));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-xl font-semibold">Evidence-graded training log</h1>
      <p data-testid="storage-mode">{mode}</p>
      <p data-testid="exercise-count">{exerciseCount ?? '-'}</p>
    </main>
  );
}
