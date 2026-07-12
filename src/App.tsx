import { useState, useEffect } from 'react';
import { Home, DollarSign, Flame, Users, User, Power, Wallet, Trash2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'calculator' | 'tg-pool' | 'play' | 'me'>('dashboard');
  const [pools, setPools] = useState(() => JSON.parse(localStorage.getItem('pools') || '[]'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    localStorage.setItem('pools', JSON.stringify(pools));
    localStorage.setItem('user', JSON.stringify(user));
  }, [pools, user]);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <main className="p-8 pb-24">
        {view === 'dashboard' ? (
          <>
            <h1 className="text-3xl font-bold">Arcade Dashboard</h1>
            <p className="text-gray-400 mt-2">Ready to play?</p>
          </>
        ) : view === 'calculator' ? (
          <CalculatorView />
        ) : view === 'tg-pool' ? (
          <TGPoolView setPools={setPools} />
        ) : view === 'play' ? (
          <PlayView pools={pools} setPools={setPools} user={user} />
        ) : (
          <MeView user={user} setUser={setUser} pools={pools} />
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 p-2 pb-4 flex justify-around items-end z-50">
        <NavItem icon={Home} label="HOME" onClick={() => setView('dashboard')} />
        <NavItem icon={DollarSign} label="ADD TG POOL" onClick={() => setView('tg-pool')} />
        <div className="flex flex-col items-center">
          <button onClick={() => setView('play')} className="bg-orange-500 text-white rounded-full p-4 -mt-10 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
            <Flame size={32} />
          </button>
          <span className="text-[10px] font-bold mt-2">PLAY</span>
        </div>
        <NavItem icon={Users} label="FRIENDS" />
        <NavItem icon={User} label="ME" onClick={() => setView('me')} />
      </nav>
    </div>
  );
}

function TGPoolView({ setPools }: { setPools: any }) {
  const [phone, setPhone] = useState('');
  const [validity, setValidity] = useState('');

  const submitPool = () => {
    if (!phone) return;
    const getBangladeshTime = () => new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime();
    setPools((prev: any) => [...prev, { id: Date.now(), phone, enabled: true, startTime: getBangladeshTime() }]);
    setPhone('');
    setValidity('');
    alert('Pool Added!');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-orange-500">Add TG Pool</h1>
      <div className="flex flex-col gap-4 bg-gray-900 p-6 rounded-lg border border-gray-800">
        <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">TG Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" placeholder="+880..." />
        </div>
        <button className="text-orange-500 text-sm font-semibold hover:underline text-left">Request for API key</button>
        <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Validity Check</label>
            <input type="text" value={validity} onChange={(e) => setValidity(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" placeholder="Enter details..." />
        </div>
        <button onClick={submitPool} className="bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition">Submit</button>
      </div>
    </div>
  );
}

function PlayView({ pools, setPools, user }: { pools: any, setPools: any, user: any }) {
    const [poolToDelete, setPoolToDelete] = useState<number | null>(null);
    const togglePool = (id: number) => {
        setPools((prev: any) => prev.map((p: any) => p.id === id ? { ...p, enabled: !p.enabled } : p));
    }
    
    const requestDelete = (id: number) => {
        setPoolToDelete(id);
    }

    const confirmDelete = () => {
        if (poolToDelete) {
            setPools((prev: any) => prev.filter((p: any) => p.id !== poolToDelete));
            setPoolToDelete(null);
        }
    }

    if (!user) return <div className="text-center mt-10">Please login in ME section to see pools.</div>;

    return (
        <div className="flex flex-col gap-6">
            {poolToDelete && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Are you sure?</h3>
                        <p className="text-gray-400 mb-6">This action cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setPoolToDelete(null)} className="flex-1 p-3 rounded-lg bg-gray-800 font-bold">No</button>
                            <button onClick={confirmDelete} className="flex-1 p-3 rounded-lg bg-red-600 font-bold">Yes</button>
                        </div>
                    </div>
                </div>
            )}
            <h1 className="text-3xl font-bold text-orange-500">Live Pools</h1>
            {pools.map((p: any) => (
                <PoolItem key={p.id} pool={p} togglePool={togglePool} requestDelete={requestDelete} />
            ))}
        </div>
    )
}

function PoolItem(props: any) {
    const { pool, togglePool, requestDelete } = props;
    const [now, setNow] = useState(() => new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    const duration = 24 * 60 * 60 * 1000;
    const elapsed = (now - pool.startTime) % duration;
    
    // Calculate proportional income:
    // Locked Income (75 total): starts 0, grows to 75 over 24h
    // Unlocked Income (5 total): starts 0, grows to 5 over 24h
    const locked = 75 * (elapsed / duration);
    const unlocked = 5 * (elapsed / duration);

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const remaining = duration - elapsed;

    return (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <span className="font-bold">{pool.phone}</span>
                <span className="text-sm font-mono text-orange-400">{formatTime(remaining)}</span>
                <span className="text-xs bg-orange-950 text-orange-200 px-2 py-1 rounded">
                    Streak: {Math.floor((now - pool.startTime) / duration)} Days
                </span>
                <div className="flex items-center gap-3">
                    <button onClick={() => togglePool(pool.id)} className={`p-2 rounded-full ${pool.enabled ? 'bg-green-500' : 'bg-red-500'}`}>
                        <Power size={20} />
                    </button>
                    <button onClick={() => requestDelete(pool.id)} className="p-2 rounded-full bg-red-900 text-red-300">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
            {pool.enabled && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-3 rounded">
                        <p className="text-xs text-gray-400">Locked Income (75 BDT)</p>
                        <p className="font-bold text-orange-300">{locked.toFixed(2)} BDT</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                        <p className="text-xs text-gray-400">Unlocked Income (5 BDT)</p>
                        <p className="font-bold text-green-400">{unlocked.toFixed(2)} BDT</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function MeView({ user, setUser, pools }: { user: any, setUser: any, pools: any }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', number: '', password: '' });
    const [now, setNow] = useState(() => new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    const duration = 24 * 60 * 60 * 1000;
    
    let liveLocked = 0;
    let liveUnlocked = 0;
    
    pools.forEach((p: any) => {
        if(p.enabled) {
            const elapsed = (now - p.startTime) % duration;
            liveLocked += 75 * (elapsed / duration);
            liveUnlocked += 5 * (elapsed / duration);
        }
    });

    const handleAuth = () => {
        if (!formData.number || !formData.password) return;
        setUser({ ...formData, lockedBalance: 0, unlockedBalance: 0 });
    }

    if (!user) {
        return (
            <div className="flex flex-col gap-6">
                <h1 className="text-3xl font-bold text-orange-500">{isLogin ? 'Login' : 'Sign Up'}</h1>
                <input type="text" placeholder="Number" onChange={(e) => setFormData({...formData, number: e.target.value})} className="bg-gray-900 p-3 rounded border border-gray-700"/>
                {!isLogin && <input type="text" placeholder="Name" onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-gray-900 p-3 rounded border border-gray-700"/>}
                <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-gray-900 p-3 rounded border border-gray-700"/>
                <button onClick={handleAuth} className="bg-orange-500 p-3 rounded font-bold">{isLogin ? 'Login' : 'Sign Up'}</button>
                <button onClick={() => setIsLogin(!isLogin)} className="text-gray-400 text-sm">
                    {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-orange-500">Welcome, {user.name}</h1>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Locked Balance</p>
                    <p className="text-2xl font-bold">{(user.lockedBalance + liveLocked).toFixed(2)} BDT</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Unlocked Balance</p>
                    <p className="text-2xl font-bold">{(user.unlockedBalance + liveUnlocked).toFixed(2)} BDT</p>
                </div>
            </div>
            <button className="bg-green-600 p-4 rounded-lg font-bold flex items-center justify-center gap-2">
                <Wallet size={20} /> Withdraw
            </button>
            <button onClick={() => setUser(null)} className="text-red-500">Logout</button>
        </div>
    )
}

function CalculatorView() {
  const [pool, setPool] = useState<number>(0);
  const dailyIncome = pool > 0 ? 60 * Math.pow(2, pool - 1) : 0;
  const unlockedIncome = pool > 0 ? 5 * pool : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-orange-500">Free Miner Calculator</h1>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-400">Add Pool</label>
        <input
          type="number"
          value={pool}
          onChange={(e) => setPool(parseInt(e.target.value) || 0)}
          className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
          placeholder="Enter number (e.g. 1)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
           <p className="text-sm text-gray-400">Daily Income</p>
           <p className="text-xl font-bold">{dailyIncome} BDT</p>
         </div>
         <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
           <p className="text-sm text-gray-400">Unlocked Daily Income</p>
           <p className="text-xl font-bold">{unlockedIncome} BDT</p>
         </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition">
      <Icon size={24} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
