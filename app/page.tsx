import { supabase } from '@/lib/supabase';

// Tvinga Next.js att hämta ny data varje gång sidan laddas
export const revalidate = 0; 

type TimeLog = {
  id: string;
  action: 'in' | 'out';
  timestamp: string;
};

// Hjälpfunktion för att räkna ut timmar per dag
function calculateDailyStats(logs: TimeLog[]) {
  const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const firstIn = sorted.find(l => l.action === 'in');
  const lastOut = [...sorted].reverse().find(l => l.action === 'out');

  if (!firstIn) return { status: 'Ingen incheckning', time: '-' };
  if (!lastOut) return { status: 'Pågår (ej utcheckad)', time: '-' };

  const start = new Date(firstIn.timestamp).getTime();
  const end = new Date(lastOut.timestamp).getTime();
  
  if (end < start) return { status: 'Tidsfel', time: '-' };

  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    status: 'Klar',
    time: `${hours}h ${minutes}m`,
    startTime: new Date(firstIn.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
    endTime: new Date(lastOut.timestamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ...existing code...
export default async function Dashboard() {
  const { data: logs, error } = await supabase.from('time_logs').select('*').order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return (
      <main className="max-w-2xl mx-auto p-6 mt-10">
        <h1 className="text-3xl font-bold mb-8">Mina Arbetstimmar</h1>
        <p className="text-red-500">Kunde inte hämta loggar. Försök igen senare.</p>
      </main>
    );
  }

  const logsByDate = (logs || []).reduce<Record<string, TimeLog[]>>((acc, log) => {
    const dateStr = new Date(log.timestamp).toLocaleDateString('sv-SE');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {});

  return (
    <main className="max-w-2xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold mb-8">Mina Arbetstimmar</h1>
      <div className="space-y-6">
        {Object.entries(logsByDate).map(([date, dayLogs]) => {
          const stats = calculateDailyStats(dayLogs);
          return (
            <div key={date} className="bg-green-400 border p-5 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{date}</h2>
                <span className="font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  {stats.time}
                </span>
              </div>
              <div className="text-sm text-gray-600 flex space-x-6">
                <div>
                  <span className="block font-medium text-gray-400 text-xs uppercase tracking-wider">Start</span>
                  {stats.startTime || '-'}
                </div>
                <div>
                  <span className="block font-medium text-gray-400 text-xs uppercase tracking-wider">Slut</span>
                  {stats.endTime || '-'}
                </div>
                <div>
                  <span className="block font-medium text-gray-400 text-xs uppercase tracking-wider">Status</span>
                  {stats.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}