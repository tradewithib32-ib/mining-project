import { useState, useEffect } from 'react';
import { Home, DollarSign, Flame, Users, User, Power, Wallet, Trash2, ArrowUpDown } from 'lucide-react';
import { db } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  getDocs,
  Timestamp,
  orderBy
} from 'firebase/firestore';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'friends' | 'tg-pool' | 'play' | 'me' | 'admin-panel'>('dashboard');
  const [pools, setPools] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingPools, setPendingPools] = useState<any[]>([]);
  const [deletedPoolsHistory, setDeletedPoolsHistory] = useState<any[]>([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({email: '', password: ''});
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  // Subscribe to collections
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      
      // Update local user state if it's in the list
      const localUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (localUser) {
        const updated = usersData.find((u: any) => u.number === localUser.number);
        if (updated) {
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }
      }
    });

    const unsubPools = onSnapshot(collection(db, 'pools'), (snapshot) => {
      setPools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPending = onSnapshot(collection(db, 'pendingPools'), (snapshot) => {
      setPendingPools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubHistory = onSnapshot(query(collection(db, 'deletedPoolsHistory'), orderBy('deletedAt', 'desc')), (snapshot) => {
      setDeletedPoolsHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubPools();
      unsubPending();
      unsubHistory();
    };
  }, []);

  const handleUpdateUser = async (newUser: any) => {
    if (!newUser) {
      setUser(null);
      localStorage.removeItem('user');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', newUser.number);
      await setDoc(userRef, newUser, { merge: true });
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleAdminLogin = () => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'rishayt14@gmail.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Abcd@1234';

    if (adminCreds.email === adminEmail && adminCreds.password === adminPassword) {
        setShowAdminLogin(false);
        setView('admin-panel');
        setAdminCreds({email: '', password: ''});
    } else {
        alert('Invalid admin credentials');
    }
  };

  const handleNavClick = (targetView: any) => {
    if (view === 'admin-panel') {
      setPendingNav(targetView);
    } else {
      setView(targetView);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {showAdminLogin && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-sm flex flex-col gap-4 relative">
                  <button onClick={() => setShowAdminLogin(false)} className="absolute top-2 right-4 text-gray-400 font-bold text-xl">×</button>
                  <h3 className="text-xl font-bold text-orange-500 mb-2">Admin Login</h3>
                  <input type="email" placeholder="Email" value={adminCreds.email} onChange={(e) => setAdminCreds({...adminCreds, email: e.target.value})} className="bg-gray-800 p-3 rounded border border-gray-700 text-white" />
                  <input type="password" placeholder="Password" value={adminCreds.password} onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})} className="bg-gray-800 p-3 rounded border border-gray-700 text-white" />
                  <button onClick={handleAdminLogin} className="bg-orange-500 p-3 rounded-lg font-bold">Login</button>
              </div>
          </div>
      )}

      {pendingNav && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-sm flex flex-col gap-4 relative text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Are you sure you want to logout and leave?</h3>
                  <div className="flex gap-4">
                      <button onClick={() => { setView('dashboard'); setPendingNav(null); }} className="flex-1 bg-red-600 p-3 rounded-lg font-bold text-white hover:bg-red-700">Sure</button>
                      <button onClick={() => setPendingNav(null)} className="flex-1 bg-gray-700 p-3 rounded-lg font-bold text-white hover:bg-gray-600">No</button>
                  </div>
              </div>
          </div>
      )}

      <main className="p-4 sm:p-8 pb-24 relative max-w-7xl mx-auto w-full">
        {view === 'dashboard' ? (
          <div className="relative">
            <div className="absolute top-0 right-0 z-10">
              <button onClick={() => setShowAdminLogin(true)} className="p-2 border border-gray-800 rounded bg-gray-900 text-gray-500 hover:text-orange-500 text-xs">Admin</button>
            </div>
            <CalculatorView />
          </div>
        ) : view === 'friends' ? (
          <div className="flex items-center justify-center h-[60vh]">
             <h1 className="text-3xl font-bold text-gray-500 text-center">Service Under maintenance</h1>
          </div>
        ) : view === 'tg-pool' ? (
          <TGPoolView user={user} pendingPools={pendingPools} />
        ) : view === 'play' ? (
          <PlayView pools={pools} user={user} />
        ) : view === 'me' ? (
          <MeView user={user} setUser={handleUpdateUser} pools={pools} users={users} />
        ) : (
          <AdminPanelView users={users} pools={pools} user={user} setUser={handleUpdateUser} pendingPools={pendingPools} deletedPoolsHistory={deletedPoolsHistory} />
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 p-2 pb-4 flex justify-around items-end z-50">
        <NavItem icon={Home} label="HOME" onClick={() => handleNavClick('dashboard')} />
        <NavItem icon={DollarSign} label="ADD TG POOL" onClick={() => handleNavClick('tg-pool')} />
        <div className="flex flex-col items-center">
          <button onClick={() => handleNavClick('play')} className="bg-orange-500 text-white rounded-full p-4 -mt-10 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition">
            <Flame size={32} />
          </button>
          <span className="text-[10px] font-bold mt-2">PLAY</span>
        </div>
        <NavItem icon={Users} label="FRIENDS" onClick={() => handleNavClick('friends')} />
        <NavItem icon={User} label="ME" onClick={() => handleNavClick('me')} />
      </nav>
    </div>
  );
}

function TGPoolView({ user, pendingPools }: { user: any, pendingPools: any[] }) {
  const [phone, setPhone] = useState('');
  const [validity, setValidity] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return <div className="text-center mt-10">Please login in ME section to add pools.</div>;

  const currentPending = pendingPools.find(p => p.phone === phone && p.userNumber === user.number);

  const requestApiKey = async () => {
      if (!phone) return;
      if (!currentPending) {
          try {
              await addDoc(collection(db, 'pendingPools'), {
                  userNumber: user.number,
                  phone,
                  status: 'requested',
                  createdAt: Timestamp.now()
              });
          } catch (error) {
              console.error("Error requesting API key:", error);
          }
      }
  };

  const submitValidity = async () => {
    if (!phone || !validity) return;
    if (currentPending && currentPending.status === 'code_given') {
        try {
            const pendingRef = doc(db, 'pendingPools', currentPending.id);
            await updateDoc(pendingRef, {
                status: 'submitted',
                validityDetails: validity
            });
            setPhone('');
            setValidity('');
            alert('Details submitted. Wait for admin approval.');
        } catch (error) {
            console.error("Error submitting validity:", error);
        }
    } else {
        alert('Please request an API key first and wait for the code.');
    }
  };

  const renderApiKeyStatus = () => {
      if (!currentPending) {
          return <button onClick={requestApiKey} className="text-orange-500 text-sm font-semibold hover:underline text-left inline-block w-fit">Request for API key</button>;
      }
      
      if (currentPending.status === 'requested') {
          return <span className="text-yellow-500 text-sm font-bold">Requested... waiting for admin</span>;
      }
      
      if (currentPending.status === 'code_given') {
          const timeLeft = Math.max(0, 5 * 60 * 1000 - (now - currentPending.timerStart));
          const m = Math.floor(timeLeft / 60000);
          const s = Math.floor((timeLeft % 60000) / 1000);
          return (
              <div className="flex items-center gap-4">
                  <span className="text-orange-500 text-sm font-semibold">Request for API key</span>
                  <span className="text-2xl font-mono font-bold text-red-500 bg-red-950 px-3 py-1 rounded">
                      {m}:{s.toString().padStart(2, '0')}
                  </span>
              </div>
          );
      }
      
      if (currentPending.status === 'submitted') {
          return <span className="text-green-500 text-sm font-bold">Submitted for approval</span>;
      }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-orange-500">Add TG Pool</h1>
      <div className="flex flex-col gap-4 bg-gray-900 p-6 rounded-lg border border-gray-800">
        <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">TG Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" placeholder="+880..." />
        </div>
        
        <div>
            {renderApiKeyStatus()}
        </div>

        <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Validity Check</label>
            <input type="text" value={validity} onChange={(e) => setValidity(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" placeholder="Enter details..." />
        </div>
        <button onClick={submitValidity} className="bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition">Submit</button>
      </div>
    </div>
  );
}

function PlayView({ pools, user }: { pools: any[], user: any }) {
    const [poolToDelete, setPoolToDelete] = useState<string | null>(null);
    const togglePool = async (id: string) => {
        const pool = pools.find(p => p.id === id);
        if (pool) {
            try {
                await updateDoc(doc(db, 'pools', id), { enabled: !pool.enabled });
            } catch (error) {
                console.error("Error toggling pool:", error);
            }
        }
    }
    
    const requestDelete = (id: string) => {
        setPoolToDelete(id);
    }

    const confirmDelete = async () => {
        if (poolToDelete) {
            const poolObj = pools.find((p: any) => p.id === poolToDelete);
            if (poolObj) {
                const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime();
                const duration = 24 * 60 * 60 * 1000;
                const totalElapsed = Math.max(0, now - poolObj.startTime);
                const locked = 75 * (totalElapsed / duration);
                const unlocked = 5 * (totalElapsed / duration);

                const historyEntry = {
                    poolId: poolObj.id,
                    phone: poolObj.phone,
                    userNumber: user.number,
                    userName: user.name,
                    startTime: poolObj.startTime,
                    deletedAt: now,
                    finalLocked: locked.toFixed(9),
                    finalUnlocked: unlocked.toFixed(9),
                    daysActive: Math.floor(totalElapsed / duration)
                };

                try {
                    await addDoc(collection(db, 'deletedPoolsHistory'), historyEntry);
                    await deleteDoc(doc(db, 'pools', poolToDelete));
                } catch (error) {
                    console.error("Error deleting pool:", error);
                }
            }
            setPoolToDelete(null);
        }
    }

    if (!user) return <div className="text-center mt-10">Please login in ME section to see pools.</div>;

    const userPools = pools.filter((p: any) => !p.userNumber || p.userNumber === user.number);

    return (
        <div className="flex flex-col gap-6">
            {poolToDelete && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-sm">
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
            {userPools.map((p: any) => (
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
    const totalElapsed = Math.max(0, now - pool.startTime);
    const elapsed = totalElapsed % duration;
    
    // Calculate proportional income cumulatively over days
    const locked = 75 * (totalElapsed / duration);
    const unlocked = 5 * (totalElapsed / duration);

    const formatTime = (ms: number) => {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const remaining = duration - elapsed;

    return (
        <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold text-lg">{pool.phone}</span>
                <div className="flex items-center gap-2 text-sm font-mono text-orange-400 bg-orange-950/30 px-3 py-1 rounded-full">
                    {formatTime(remaining)}
                </div>
                <span className="text-xs font-bold bg-orange-950 text-orange-200 px-3 py-1 rounded-full">
                    Streak: {Math.floor((now - pool.startTime) / duration)} Days
                </span>
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    <button onClick={() => togglePool(pool.id)} className={`p-2 rounded-full ${pool.enabled ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                        <Power size={18} />
                    </button>
                    <button onClick={() => requestDelete(pool.id)} className="p-2 rounded-full bg-red-900 hover:bg-red-800 text-red-300">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            {pool.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-center">
                        <p className="text-xs text-gray-400 mb-1">Locked Income (75 BDT)</p>
                        <p className="font-bold text-xl text-orange-300 break-all">{locked.toFixed(9)} BDT</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-center">
                        <p className="text-xs text-gray-400 mb-1">Unlocked Income (5 BDT)</p>
                        <p className="font-bold text-xl text-green-400 break-all">{unlocked.toFixed(9)} BDT</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function MeView({ user, setUser, pools, users }: { user: any, setUser: any, pools: any, users: any[] }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', number: '', password: '' });
    const [now, setNow] = useState(() => new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime());
    
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [withdrawData, setWithdrawData] = useState({ method: 'Bkash', number: '', amount: '' });
    const [withdrawMessage, setWithdrawMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    const duration = 24 * 60 * 60 * 1000;
    
    let liveLocked = 0;
    let liveUnlocked = 0;
    
    pools.forEach((p: any) => {
        if(p.enabled && (!p.userNumber || p.userNumber === user?.number)) {
            const totalElapsed = Math.max(0, now - p.startTime);
            liveLocked += 75 * (totalElapsed / duration);
            liveUnlocked += 5 * (totalElapsed / duration);
        }
    });
    
    const availableUnlocked = Math.max(0, liveUnlocked - (user?.withdrawnAmount || 0));

    const handleAuth = async () => {
        if (!formData.number || !formData.password) return;
        
        if (isLogin) {
            const existingUser = users.find(u => u.number === formData.number && u.password === formData.password);
            if (existingUser) {
                setUser(existingUser);
                localStorage.setItem('user', JSON.stringify(existingUser));
            } else {
                alert('Invalid credentials');
            }
        } else {
            const existingUser = users.find(u => u.number === formData.number);
            if (existingUser) {
                alert('Number already registered');
            } else {
                const newUser = { 
                    ...formData, 
                    lockedBalance: 0, 
                    unlockedBalance: 0, 
                    withdrawnAmount: 0, 
                    withdrawHistory: [],
                    createdAt: Timestamp.now()
                };
                try {
                    await setDoc(doc(db, 'users', formData.number), newUser);
                    setUser(newUser);
                    localStorage.setItem('user', JSON.stringify(newUser));
                } catch (error) {
                    console.error("Error creating user:", error);
                }
            }
        }
    }

    const handleWithdrawSubmit = async () => {
        const amount = parseFloat(withdrawData.amount);
        if (isNaN(amount) || amount <= 0) {
            setWithdrawMessage({ type: 'error', text: 'Please enter a valid amount.' });
            return;
        }
        if (withdrawData.method === "Mobile Recharge" && (amount < 20 || amount > 100)) {
            setWithdrawMessage({ type: "error", text: "Mobile Recharge amount must be between 20 and 100 BDT." });
            return;
        }

        if ((withdrawData.method === "Bkash" || withdrawData.method === "Nagad") && (amount < 50 || amount > 1000)) {
            setWithdrawMessage({ type: "error", text: `${withdrawData.method === "Bkash" ? "bKash" : "Nagad"} amount must be between 50 and 1000 BDT.` });
            return;
        }

        if (amount > availableUnlocked) {
            setWithdrawMessage({ type: 'error', text: 'Insufficient balance.' });
            return;
        }
        
        const newWithdrawEntry = {
            id: Date.now(),
            amount: amount.toFixed(2),
            method: withdrawData.method,
            number: withdrawData.number,
            date: new Date().toLocaleString(),
            status: 'pending'
        };

        const updatedUser = { 
            ...user, 
            withdrawnAmount: (user.withdrawnAmount || 0) + amount, 
            withdrawHistory: [...(user.withdrawHistory || []), newWithdrawEntry] 
        };

        try {
            await setDoc(doc(db, 'users', user.number), updatedUser);
            setUser(updatedUser);
            setWithdrawMessage({ type: 'success', text: 'Your payment will reach your account very soon.' });
            setTimeout(() => {
                setShowWithdraw(false);
                setWithdrawMessage({ type: '', text: '' });
                setWithdrawData({ method: 'Bkash', number: '', amount: '' });
            }, 3000);
        } catch (error) {
            console.error("Error submitting withdraw:", error);
            setWithdrawMessage({ type: 'error', text: 'Something went wrong.' });
        }
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
            {showWithdraw && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-sm flex flex-col gap-4 relative">
                        <button onClick={() => setShowWithdraw(false)} className="absolute top-2 right-4 text-gray-400 font-bold text-xl">×</button>
                        <h3 className="text-xl font-bold text-orange-500 mb-2">Withdraw</h3>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">Select Method</label>
                            <select 
                                className="bg-gray-800 p-3 rounded border border-gray-700 text-white"
                                value={withdrawData.method}
                                onChange={(e) => setWithdrawData({...withdrawData, method: e.target.value})}
                            >
                                <option value="Bkash">bKash</option>
                                <option value="Nagad">Nagad</option>
                                <option value="Mobile Recharge">Mobile Recharge</option>
                                <option value="USDT (Upcoming)" disabled>USDT (Upcoming)</option>
                            </select>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">Number</label>
                            <input 
                                type="text" 
                                placeholder="Enter account number" 
                                className="bg-gray-800 p-3 rounded border border-gray-700 text-white"
                                value={withdrawData.number}
                                onChange={(e) => setWithdrawData({...withdrawData, number: e.target.value})}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">Amount (Available: {availableUnlocked.toFixed(9)} BDT)</label>
                            <input 
                                type="number" 
                                placeholder="Enter amount" 
                                className="bg-gray-800 p-3 rounded border border-gray-700 text-white"
                                value={withdrawData.amount}
                                onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                            />
                        </div>

                        {withdrawMessage.text && (
                            <div className={`p-3 rounded text-sm font-bold ${withdrawMessage.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                                {withdrawMessage.text}
                            </div>
                        )}

                        <button onClick={handleWithdrawSubmit} className="bg-green-600 p-3 rounded-lg font-bold mt-2">
                            Submit
                        </button>
                    </div>
                </div>
            )}
            <h1 className="text-3xl font-bold text-orange-500 break-words">Welcome, {user.name}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Locked Balance</p>
                    <p className="text-2xl font-bold">{liveLocked.toFixed(9)} BDT</p>
                </div>
                <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400">Unlocked Balance</p>
                    <p className="text-2xl font-bold">{availableUnlocked.toFixed(9)} BDT</p>
                </div>
            </div>
            <button onClick={() => setShowWithdraw(true)} className="bg-green-600 p-4 rounded-lg font-bold flex items-center justify-center gap-2">
                <Wallet size={20} /> Withdraw
            </button>

            {user.withdrawHistory && user.withdrawHistory.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-xl font-bold text-orange-500 mb-4">Withdrawal History</h2>
                    <div className="flex flex-col gap-3">
                        {user.withdrawHistory.slice().reverse().map((w: any) => (
                            <div key={w.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-orange-400">{w.method} - {w.number}</span>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${w.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                                        {w.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">{w.date}</span>
                                    <span className="font-bold text-lg">{w.amount} BDT</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={() => setShowLogoutConfirm(true)} className="text-red-500 mt-2">Logout</button>

            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700 w-full max-w-sm flex flex-col gap-4 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Are you sure you want to logout?</h3>
                        <div className="flex gap-4">
                            <button onClick={() => { setUser(null); setShowLogoutConfirm(false); }} className="flex-1 bg-red-600 p-3 rounded-lg font-bold text-white hover:bg-red-700">Sure</button>
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-gray-700 p-3 rounded-lg font-bold text-white hover:bg-gray-600">No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function CalculatorView() {
  const [pool, setPool] = useState<number>(0);
  const dailyIncome = pool > 0 ? 75 * pool : 0;
  const unlockedIncome = pool > 0 ? 5 * pool : 0;

  const [bdtAmount, setBdtAmount] = useState<string>('1');
  const [dogeAmount, setDogeAmount] = useState<string>('0.11276776909070327');
  const RATE = 0.11276776909070327;

  const handleBdtChange = (val: string) => {
    setBdtAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setDogeAmount((num * RATE).toString());
    } else {
      setDogeAmount('');
    }
  };

  const handleDogeChange = (val: string) => {
    setDogeAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setBdtAmount((num / RATE).toString());
    } else {
      setBdtAmount('');
    }
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
           <p className="text-sm text-gray-400">Daily Income</p>
           <p className="text-xl font-bold">{dailyIncome} BDT</p>
         </div>
         <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
           <p className="text-sm text-gray-400">Unlocked Daily Income</p>
           <p className="text-xl font-bold">{unlockedIncome} BDT</p>
         </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col gap-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-orange-500 uppercase tracking-wider">DOGE Calculator</h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">1 BDT ≈ {RATE.toFixed(10)} DOGE</p>
        </div>
        
        <div className="flex flex-col gap-4 bg-gray-900/40 p-5 sm:p-8 rounded-[2rem] border border-gray-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"></div>
            
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Upcoming Event for Locked BDT</h3>

            {/* BDT Input */}
            <div className="flex items-center gap-3 bg-gray-950/80 border border-blue-500/20 rounded-2xl px-5 py-4 focus-within:border-blue-500/60 transition-all duration-300 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-blue-500 uppercase mb-1">Send</span>
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500 font-bold border-r border-gray-800 pr-3">BDT</div>
                    <input 
                        type="number" 
                        value={bdtAmount} 
                        onChange={(e) => handleBdtChange(e.target.value)}
                        className="bg-transparent flex-1 text-lg sm:text-xl font-bold outline-none text-white placeholder-gray-700 min-w-0"
                        placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="ml-auto bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800 flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">৳</div>
                    <span className="text-xs font-bold text-gray-300">BDT</span>
                </div>
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center -my-3 z-10">
                <div className="p-3 rounded-2xl bg-gray-900 text-orange-500 border border-gray-800 shadow-xl group-hover:scale-110 transition-transform">
                     <ArrowUpDown size={20} />
                </div>
            </div>

            {/* DOGE Input */}
            <div className="flex items-center gap-3 bg-gray-950/80 border border-orange-500/20 rounded-2xl px-5 py-4 focus-within:border-orange-500/60 transition-all duration-300 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-orange-500 uppercase mb-1">Receive</span>
                  <div className="flex items-center gap-3">
                    <input 
                        type="number" 
                        value={dogeAmount} 
                        onChange={(e) => handleDogeChange(e.target.value)}
                        className="bg-transparent flex-1 text-lg sm:text-xl font-bold outline-none text-white placeholder-gray-700 min-w-0"
                        placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="ml-auto bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800 flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-black">Ð</div>
                    <span className="text-xs font-bold text-gray-300">DOGE</span>
                </div>
            </div>
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

function AdminPanelView({ users, pools, user, setUser, pendingPools, deletedPoolsHistory }: any) {
  const [tab, setTab] = useState<'users' | 'withdraws' | 'pending' | 'history'>('users');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const handleMarkPaid = async (userNumber: string, withdrawId: number) => {
    const u = users.find((u: any) => u.number === userNumber);
    if (u) {
        const newHistory = u.withdrawHistory.map((w: any) => w.id === withdrawId ? { ...w, status: 'paid' } : w);
        const updatedUser = { ...u, withdrawHistory: newHistory };
        try {
            await updateDoc(doc(db, 'users', userNumber), { withdrawHistory: newHistory });
            if (user?.number === userNumber) setUser(updatedUser);
            if (selectedUser?.number === userNumber) setSelectedUser(updatedUser);
        } catch (error) {
            console.error("Error marking paid:", error);
        }
    }
  };

  const handleDeleteWithdraw = async (userNumber: string, withdrawId: number) => {
    const u = users.find((u: any) => u.number === userNumber);
    if (u) {
        const newHistory = u.withdrawHistory.filter((w: any) => w.id !== withdrawId);
        const updatedUser = { ...u, withdrawHistory: newHistory };
        try {
            await updateDoc(doc(db, 'users', userNumber), { withdrawHistory: newHistory });
            if (user?.number === userNumber) setUser(updatedUser);
            if (selectedUser?.number === userNumber) setSelectedUser(updatedUser);
        } catch (error) {
            console.error("Error deleting withdraw:", error);
        }
    }
  };

  const handleDeleteUser = async (userNumber: string) => {
      try {
          await deleteDoc(doc(db, 'users', userNumber));
          // Delete related pools and pending requests
          const userPools = pools.filter((p: any) => p.userNumber === userNumber);
          for (const p of userPools) {
              await deleteDoc(doc(db, 'pools', p.id));
          }
          const userPending = pendingPools.filter((p: any) => p.userNumber === userNumber);
          for (const p of userPending) {
              await deleteDoc(doc(db, 'pendingPools', p.id));
          }
          if (user?.number === userNumber) setUser(null);
      } catch (error) {
          console.error("Error deleting user:", error);
      }
  };

  const handleDeletePendingPool = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'pendingPools', id));
      } catch (error) {
          console.error("Error deleting pending pool:", error);
      }
  };

  const handleGiveCode = async (id: string) => {
      try {
          await updateDoc(doc(db, 'pendingPools', id), {
              status: 'code_given',
              timerStart: Date.now()
          });
      } catch (error) {
          console.error("Error giving code:", error);
      }
  };

  const handleApprove = async (id: string) => {
      const pending = pendingPools.find((p: any) => p.id === id);
      if (pending) {
          const getBangladeshTime = () => new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"})).getTime();
          try {
              await addDoc(collection(db, 'pools'), {
                  phone: pending.phone,
                  enabled: true,
                  startTime: getBangladeshTime(),
                  userNumber: pending.userNumber
              });
              await deleteDoc(doc(db, 'pendingPools', id));
          } catch (error) {
              console.error("Error approving pool:", error);
          }
      }
  };

  const getActivePools = (userNumber: string) => pools.filter((p: any) => p.userNumber === userNumber && p.enabled);

  const allWithdraws = users.flatMap((u: any) => 
    (u.withdrawHistory || []).map((w: any) => ({...w, userNumber: u.number, userName: u.name}))
  ).sort((a: any, b: any) => b.id - a.id);

  if (selectedUser) {
      const userPools = getActivePools(selectedUser.number);
      return (
          <div className="flex flex-col gap-6">
              <button onClick={() => setSelectedUser(null)} className="text-orange-500 text-sm hover:underline w-fit">← Back to Users</button>
              <h1 className="text-3xl font-bold text-orange-500">User Details</h1>
              
              <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800">
                  <h2 className="text-xl font-bold mb-4">Profile</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-bold">{selectedUser.name}</p>
                      </div>
                      <div>
                          <p className="text-xs text-gray-500">Number</p>
                          <p className="font-bold">{selectedUser.number}</p>
                      </div>
                      <div>
                          <p className="text-xs text-gray-500">Password</p>
                          <p className="font-mono break-all">{selectedUser.password}</p>
                      </div>
                      <div>
                          <p className="text-xs text-gray-500">Total Withdrawn</p>
                          <p className="font-bold text-green-500 break-all">{(selectedUser.withdrawnAmount || 0).toFixed(2)} BDT</p>
                      </div>
                  </div>
              </div>

              <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800">
                  <h2 className="text-xl font-bold mb-4">Active Pools ({userPools.length})</h2>
                  {userPools.length > 0 ? (
                      <div className="flex flex-col gap-2">
                          {userPools.map((p: any) => (
                              <div key={p.id} className="flex justify-between bg-gray-800 p-3 rounded">
                                  <span className="font-bold">{p.phone}</span>
                                  <span className="text-gray-400">{Math.floor((Date.now() - p.startTime) / (24*60*60*1000))} Days Active</span>
                              </div>
                          ))}
                      </div>
                  ) : <p className="text-gray-500">No active pools.</p>}
              </div>

              <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-800">
                  <h2 className="text-xl font-bold mb-4">Withdraw History</h2>
                  {(selectedUser.withdrawHistory && selectedUser.withdrawHistory.length > 0) ? (
                      <div className="flex flex-col gap-3">
                          {selectedUser.withdrawHistory.slice().reverse().map((w: any) => (
                              <div key={w.id} className="bg-gray-800 p-4 rounded-lg flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                      <span className="font-bold text-orange-400">{w.method} - {w.number}</span>
                                      <span className={`text-xs px-2 py-1 rounded font-bold ${w.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                                          {w.status.toUpperCase()}
                                      </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-gray-400 text-sm">{w.date}</span>
                                      <span className="font-bold text-lg">{w.amount} BDT</span>
                                  </div>
                                  <div className="flex justify-end border-t border-gray-700 mt-2 pt-2">
                                      <div className="flex items-center gap-2">
                                          <button onClick={() => handleDeleteWithdraw(selectedUser.number, w.id)} className="text-red-500 hover:text-red-400 p-1">
                                              <Trash2 size={16} />
                                          </button>
                                          {w.status === 'pending' && (
                                              <button 
                                                  onClick={() => handleMarkPaid(selectedUser.number, w.id)}
                                                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1 rounded"
                                              >
                                                  Mark as Paid
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : <p className="text-gray-500">No withdraw history.</p>}
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-orange-500">Admin Panel</h1>
      
      <div className="flex overflow-x-auto border-b border-gray-800 scrollbar-hide">
        <button 
            className={`min-w-[120px] flex-1 px-4 py-3 text-center font-bold whitespace-nowrap ${tab === 'users' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}
            onClick={() => setTab('users')}
        >
            Users
        </button>
        <button 
            className={`min-w-[120px] flex-1 px-4 py-3 text-center font-bold whitespace-nowrap ${tab === 'withdraws' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}
            onClick={() => setTab('withdraws')}
        >
            Withdraws
        </button>
        <button 
            className={`min-w-[120px] flex-1 px-4 py-3 text-center font-bold whitespace-nowrap ${tab === 'pending' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}
            onClick={() => setTab('pending')}
        >
            Number Adding
        </button>
        <button 
            className={`min-w-[120px] flex-1 px-4 py-3 text-center font-bold whitespace-nowrap ${tab === 'history' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}
            onClick={() => setTab('history')}
        >
            Deleted History
        </button>
      </div>

      {tab === 'users' && (
        <div className="flex flex-col gap-4">
            {users.map((u: any) => {
                const userPools = getActivePools(u.number);
                return (
                    <div key={u.number} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div onClick={() => setSelectedUser(u)} className="cursor-pointer hover:opacity-80">
                                <p className="font-bold text-lg hover:underline">{u.name}</p>
                                <p className="text-sm text-gray-400">{u.number}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Password</p>
                                    <p className="text-sm font-mono break-all max-w-[150px] text-right">{u.password}</p>
                                </div>
                                <button onClick={() => handleDeleteUser(u.number)} className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-800">
                            <p className="text-sm font-bold text-orange-400 mb-1">Active Pools ({userPools.length})</p>
                            {userPools.map((p: any) => (
                                <div key={p.id} className="text-xs flex justify-between bg-gray-800 p-2 rounded mb-1">
                                    <span>{p.phone}</span>
                                    <span>{Math.floor((Date.now() - p.startTime) / (24*60*60*1000))} Days</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
            {users.length === 0 && <p className="text-gray-500 text-center py-8">No users found.</p>}
        </div>
      )}

      {tab === 'withdraws' && (
        <div className="flex flex-col gap-4">
            {allWithdraws.map((w: any) => (
                <div key={`${w.userNumber}-${w.id}`} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">{w.userName} <span className="text-sm font-normal text-gray-400">({w.userNumber})</span></p>
                            <p className="font-bold text-orange-400 mt-1">{w.method} - {w.number}</p>
                        </div>
                        <div className="text-right max-w-[150px]">
                            <p className="font-bold text-xl break-all">{w.amount} BDT</p>
                            <span className={`text-xs px-2 py-1 rounded font-bold mt-1 inline-block ${w.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
                                {w.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                        <span className="text-xs text-gray-500">{w.date}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleDeleteWithdraw(w.userNumber, w.id)} className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded">
                                <Trash2 size={16} />
                            </button>
                            {w.status === 'pending' && (
                                <button 
                                    onClick={() => handleMarkPaid(w.userNumber, w.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1 rounded"
                                >
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {allWithdraws.length === 0 && <p className="text-gray-500 text-center py-8">No withdraw requests found.</p>}
        </div>
      )}

      {tab === 'pending' && (
        <div className="flex flex-col gap-4">
            {pendingPools.map((p: any) => (
                <div key={p.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">{p.phone}</p>
                            <p className="text-sm text-gray-400">User: {p.userNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {p.status === 'requested' && (
                                <button 
                                    onClick={() => handleGiveCode(p.id)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded"
                                >
                                    Give Code
                                </button>
                            )}
                            {p.status === 'code_given' && (
                                <span className="text-yellow-500 text-xs font-bold">Waiting for Details</span>
                            )}
                            {p.status === 'submitted' && (
                                <button 
                                    onClick={() => handleApprove(p.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1 rounded"
                                >
                                    Approve
                                </button>
                            )}
                            <button onClick={() => handleDeletePendingPool(p.id)} className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    {p.status === 'submitted' && p.validityDetails && (
                        <div className="mt-2 pt-2 border-t border-gray-800">
                            <p className="text-xs text-gray-500">Validity Check Details:</p>
                            <p className="text-sm">{p.validityDetails}</p>
                        </div>
                    )}
                </div>
            ))}
            {pendingPools.length === 0 && <p className="text-gray-500 text-center py-8">No pending API key requests.</p>}
        </div>
      )}

      {tab === 'history' && (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
                <p className="text-gray-400 text-sm">{deletedPoolsHistory.length} Entries</p>
                {deletedPoolsHistory.length > 0 && (
                    <button 
                        onClick={async () => { 
                            if(confirm('Clear all history?')) {
                                for (const h of deletedPoolsHistory) {
                                    await deleteDoc(doc(db, 'deletedPoolsHistory', h.id));
                                }
                            } 
                        }}
                        className="text-red-500 text-xs font-bold hover:underline"
                    >
                        Clear All
                    </button>
                )}
            </div>
            {deletedPoolsHistory.map((h: any) => (
                <div key={h.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-orange-500">{h.phone}</p>
                            <p className="text-xs text-gray-400">User: {h.userName} ({h.userNumber})</p>
                        </div>
                        <button 
                            onClick={() => deleteDoc(doc(db, 'deletedPoolsHistory', h.id))}
                            className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-[10px] sm:text-xs">
                        <div className="bg-gray-800 p-2 rounded">
                            <p className="text-gray-500 uppercase tracking-wider mb-1">Locked Earned</p>
                            <p className="font-bold text-orange-300">{h.finalLocked} BDT</p>
                        </div>
                        <div className="bg-gray-800 p-2 rounded">
                            <p className="text-gray-500 uppercase tracking-wider mb-1">Unlocked Earned</p>
                            <p className="font-bold text-green-400">{h.finalUnlocked} BDT</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800 pt-2">
                        <div className="flex gap-3">
                            <span>Active: {h.daysActive} Days</span>
                            <span>Start: {new Date(h.startTime).toLocaleDateString()}</span>
                        </div>
                        <span>Deleted: {new Date(h.deletedAt).toLocaleString()}</span>
                    </div>
                </div>
            ))}
            {deletedPoolsHistory.length === 0 && <p className="text-gray-500 text-center py-8">No history found.</p>}
        </div>
      )}
    </div>
  );
}
