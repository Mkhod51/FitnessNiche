import { useEffect, useState } from 'react';
import { initDb, execSql } from './db/client';

export default function App() {
  const [mode, setMode] = useState('booting');
  // TODO(M0): remove boot_log scaffolding (this state, the effect below, and
  // the two <p> readouts) with Task 5 once real seeding lands.
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const m = await initDb();
      setMode(m);
      await execSql('create table if not exists boot_log (at text not null)', [], 'run');
      await execSql('insert into boot_log (at) values (?)', [new Date().toISOString()], 'run');
      const rows = await execSql('select count(*) from boot_log', [], 'all');
      setVisits(Number(rows[0]?.[0] ?? 0));
    })().catch((e) => setMode(`error: ${e.message}`));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-xl font-semibold">Evidence-graded training log</h1>
      <p data-testid="storage-mode">{mode}</p>
      <p data-testid="boot-count">{visits ?? '-'}</p>
    </main>
  );
}
