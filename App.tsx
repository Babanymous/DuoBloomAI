
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/app';
import { auth, db, GoogleAuthProvider } from './services/firebase';
import { LogOut, Home, Play, Plus, ArrowRight, Globe, Download, Loader2, Share, Heart, PlusSquare, Castle, Store, CheckSquare, Flower2, ShoppingCart, Trash2, Check, Repeat, Calendar } from 'lucide-react';
import OctoChat from './components/OctoChat';
import GridCell from './components/GridCell';
import { RoomData, ITEMS, GARDEN_UPGRADES, Task, WATER_COOLDOWN } from './types';

// --- SUB-COMPONENTS (Moved inside or kept here for simplicity due to file limit) ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-300 to-green-100 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full animate-pop">
            <div className="text-6xl mb-4">🌱</div>
            <h1 className="text-3xl font-black text-green-700 mb-2">DuoBloom</h1>
            <p className="text-gray-500 mb-8">Gemeinsam gärtnern, gemeinsam wachsen.</p>
            <button onClick={onLogin} className="w-full bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95">
                <span className="font-bold text-xl">G</span>
                Mit Google anmelden
            </button>
            <p className="text-xs text-gray-400 mt-6">Version 24.1 (React + Gemini 2.5)</p>
        </div>
    </div>
);

const GameApp = ({ user, roomCode, isSpectator, onBackToMenu }: { user: firebase.User, roomCode: string, isSpectator: boolean, onBackToMenu: () => void }) => {
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [tab, setTab] = useState<'garden' | 'tasks' | 'shop'>('garden');
    const [activeGardenIdx, setActiveGardenIdx] = useState(0);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());
    const [hasLiked, setHasLiked] = useState(false);

    // Data Sync
    useEffect(() => {
        if(!roomCode || !db) return;
        const unsub = db.collection('rooms').doc(roomCode).onSnapshot((snap) => {
            if (snap.exists) {
                const data = snap.data() as RoomData;
                // Defaults
                if(!data.tasks) data.tasks = [];
                if(!data.inventory) data.inventory = {};
                if(!data.gardens) data.gardens = { 0: {} };
                if(!data.unlockedGardens) data.unlockedGardens = [0];
                setRoomData(data);
            } else if (isSpectator) { 
                alert("Raum nicht gefunden."); 
                onBackToMenu(); 
            }
        }, err => console.log("DB Error", err));

        if (localStorage.getItem(`liked_${roomCode}`)) setHasLiked(true);
        return () => unsub();
    }, [roomCode, isSpectator, onBackToMenu]);

    // Timer
    useEffect(() => { 
        const t = setInterval(() => setNow(Date.now()), 1000); 
        return () => clearInterval(t); 
    }, []);

    const handleGridClick = async (x: number, y: number) => {
        if (isSpectator || !roomData) return;
        const key = `${x},${y}`;
        const currentGrid = roomData.gardens[activeGardenIdx] || {};
        const cell = currentGrid[key] || {};
        const roomRef = db.collection('rooms').doc(roomCode);
        const path = `gardens.${activeGardenIdx}.${key}`;
        const increment = firebase.firestore.FieldValue.increment;
        const deleteField = firebase.firestore.FieldValue.delete;

        // Planting/Placing
        if (selectedItem) {
            const itemDef = ITEMS[selectedItem];
            const invCount = roomData.inventory[selectedItem] || 0;
            if (invCount > 0) {
                if (itemDef.type === 'floor') { 
                    if (cell.item) return alert("Erst Pflanze entfernen!"); 
                    await roomRef.update({ [`${path}.floor`]: selectedItem, [`inventory.${selectedItem}`]: increment(-1) }); 
                } else if (itemDef.type === 'seed' && !cell.floor && !cell.item) {
                    await roomRef.update({ 
                        [`${path}.item`]: selectedItem, 
                        [`${path}.stage`]: 0, 
                        [`${path}.plantedAt`]: new Date().toISOString(), 
                        [`inventory.${selectedItem}`]: increment(-1) 
                    });
                } else if (itemDef.type === 'deco' && !cell.item) {
                     await roomRef.update({ [`${path}.item`]: selectedItem, [`inventory.${selectedItem}`]: increment(-1) }); 
                }
                if (invCount - 1 <= 0) setSelectedItem(null);
            }
            return;
        }

        // Harvesting/Watering
        if (cell.item) {
            const itemDef = ITEMS[cell.item];
            if(!itemDef) return; 
            
            if (cell.grown && itemDef.type === 'seed') { 
                await roomRef.update({ 
                    [`${path}.item`]: deleteField(), 
                    [`${path}.stage`]: deleteField(), 
                    [`${path}.grown`]: deleteField(), 
                    gems: increment(itemDef.reward || 0) 
                }); 
            } else if (itemDef.type === 'seed') { 
                const lastWatered = cell.lastWatered ? new Date(cell.lastWatered).getTime() : 0; 
                if (now - lastWatered > WATER_COOLDOWN) { 
                    const newStage = (cell.stage || 0) + 1; 
                    await roomRef.update({ 
                        [`${path}.stage`]: newStage, 
                        [`${path}.grown`]: newStage >= (itemDef.stages || 1), 
                        [`${path}.lastWatered`]: new Date().toISOString() 
                    }); 
                } 
            } else if (itemDef.type === 'deco') { 
                if(confirm(`${itemDef.name} ins Inventar zurück?`)) { 
                    await roomRef.update({ [`${path}.item`]: deleteField(), [`inventory.${cell.item}`]: increment(1) }); 
                } 
            }
            return;
        }

        // Removing Floor
        if (cell.floor) { 
            const floorDef = ITEMS[cell.floor]; 
            if(confirm(`${floorDef.name} aufheben?`)) { 
                await roomRef.update({ [`${path}.floor`]: deleteField(), [`inventory.${cell.floor}`]: increment(1) }); 
            } 
        }
    };

    const buy = async (id: string, isGarden: boolean) => { 
        if (isSpectator || !roomData) return; 
        const increment = firebase.firestore.FieldValue.increment;
        const arrayUnion = firebase.firestore.FieldValue.arrayUnion;

        if(isGarden) { 
            const g = GARDEN_UPGRADES.find(x => x.id === parseInt(id)); 
            if(g && roomData.gems >= g.price) {
                await db.collection('rooms').doc(roomCode).update({ gems: increment(-g.price), unlockedGardens: arrayUnion(parseInt(id)), [`gardens.${id}`]: {} });
            }
        } else { 
            const item = ITEMS[id]; 
            if (roomData.coins >= item.price) {
                await db.collection('rooms').doc(roomCode).update({ coins: increment(-item.price), [`inventory.${id}`]: increment(1) }); 
            }
        } 
    };

    if (!roomData) return <div className="h-full flex items-center justify-center animate-pulse">Lade Garten...</div>;

    const currentGrid = roomData.gardens[activeGardenIdx] || {};

    return (
        <div className={`flex h-full bg-slate-100 overflow-hidden md:max-w-7xl md:mx-auto md:my-8 md:rounded-3xl md:shadow-2xl md:border ${isSpectator ? 'border-purple-300 ring-4 ring-purple-100' : 'border-slate-200'}`}>
            <nav className="fixed bottom-0 left-0 w-full bg-white border-t z-40 flex justify-around p-2 pb-safe md:relative md:w-64 md:flex-col md:justify-start md:border-t-0 md:border-r md:p-6 md:gap-4">
                <div className="hidden md:block mb-8"><h1 className="text-2xl font-bold text-green-600 flex items-center gap-2"><Flower2/> DuoBloom</h1></div>
                <button onClick={() => setTab('garden')} className={`p-3 rounded-xl flex md:flex-row flex-col items-center gap-3 transition-all ${tab === 'garden' ? 'bg-green-50 text-green-600 font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><Flower2/> <span className="text-[10px] md:text-sm">Garten</span></button>
                {!isSpectator && (
                    <>
                        <button onClick={() => setTab('tasks')} className={`p-3 rounded-xl flex md:flex-row flex-col items-center gap-3 transition-all ${tab === 'tasks' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><CheckSquare/> <span className="text-[10px] md:text-sm">Aufgaben</span></button>
                        <button onClick={() => setTab('shop')} className={`p-3 rounded-xl flex md:flex-row flex-col items-center gap-3 transition-all ${tab === 'shop' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-400 hover:bg-gray-50'}`}><ShoppingCart/> <span className="text-[10px] md:text-sm">Shop</span></button>
                    </>
                )}
            </nav>
            <main className="flex-1 overflow-y-auto bg-[#eefcf3] relative pb-28 md:pb-0">
                <header className="sticky top-0 backdrop-blur-md p-4 shadow-sm z-30 flex justify-between items-center px-6 bg-white/90">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToMenu} className="bg-white border p-2 rounded-xl hover:bg-gray-100 shadow-sm"><Home className="text-gray-600"/></button>
                        <div><span className="font-bold text-gray-700">{roomData.roomName}</span></div>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="font-bold text-yellow-600 flex items-center gap-1">💰 {roomData.coins}</span>
                        <span className="font-bold text-purple-600 flex items-center gap-1">💎 {roomData.gems}</span>
                    </div>
                </header>
                
                {tab === 'garden' && (
                    <div className="p-4 md:p-8 flex flex-col items-center">
                        <div className="flex gap-2 mb-4 overflow-x-auto w-full justify-center">
                            {GARDEN_UPGRADES.map(g => { 
                                const owned = (roomData.unlockedGardens || []).includes(g.id); 
                                if(!owned) return null; 
                                return <button key={g.id} onClick={() => setActiveGardenIdx(g.id)} className={`px-4 py-1 rounded-full text-sm font-bold border ${activeGardenIdx === g.id ? 'bg-green-500 text-white border-green-500' : 'bg-white text-green-700 border-green-200'}`}>{g.name}</button> 
                            })}
                        </div>
                        <div className="p-4 rounded-xl shadow-2xl relative inline-block bg-cover bg-center bg-[#5c4033]" style={{ backgroundImage: `url(assets/gbg.png)` }}>
                            <div className="grid grid-cols-5 gap-0 border-2 border-black/10 shadow-inner">
                                {Array.from({ length: 25 }).map((_, i) => ( 
                                    <GridCell 
                                        key={i} 
                                        x={i%5} 
                                        y={Math.floor(i/5)} 
                                        cell={currentGrid[`${i%5},${Math.floor(i/5)}`] || {}} 
                                        handleGridClick={handleGridClick} 
                                        now={now} 
                                    /> 
                                ))}
                            </div>
                        </div>
                        {!isSpectator && (
                            <div className="mt-8 w-full max-w-2xl bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Werkzeugkasten</h3>
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                    {Object.entries(roomData.inventory).map(([id, count]) => { 
                                        if ((count as number) <= 0) return null; 
                                        const item = ITEMS[id];
                                        return (
                                            <button key={id} onClick={() => setSelectedItem(selectedItem === id ? null : id)} className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl border-2 transition-all min-w-[80px] ${selectedItem === id ? 'border-blue-500 bg-blue-50 shadow-md transform -translate-y-1' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                {item.img ? <img src={item.img} className="w-8 h-8 object-contain"/> : <span className="text-2xl">{item.icon}</span>}
                                                <span className="text-xs font-bold text-gray-600">{count}x</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Shop Tab (Simplified) */}
                {tab === 'shop' && !isSpectator && (
                     <div className="p-6 md:max-w-4xl md:mx-auto pb-32">
                        <h3 className="font-bold text-xl text-orange-600 mb-4 flex items-center gap-2"><Store/> Markt</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.values(ITEMS).map(item => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                                    <div className="text-4xl mb-3 mt-2">
                                        {item.img ? <img src={item.img} className="w-12 h-12 object-contain"/> : item.icon}
                                    </div>
                                    <h3 className="font-bold text-gray-700 text-center text-sm">{item.name}</h3>
                                    <button 
                                        onClick={() => buy(item.id, false)} 
                                        disabled={roomData.coins < item.price} 
                                        className={`mt-2 w-full py-2 rounded-xl text-sm font-bold transition-all ${roomData.coins >= item.price ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                                    >
                                        {item.price} 💰
                                    </button>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
            </main>
            <OctoChat user={user} roomData={roomData} />
        </div>
    );
};

// --- MAIN APP ---

const App = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'login' | 'menu' | 'community' | 'game'>('login');
    const [currentRoom, setCurrentRoom] = useState<string | null>(localStorage.getItem('lastRoom') || null);
    const [isSpectator, setIsSpectator] = useState(false);
    const [joinCode, setJoinCode] = useState("");

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            setUser(u);
            setLoading(false);
            if (u) setView('menu');
            else setView('login');
        });
        return () => unsub();
    }, []);

    const handleLogin = async () => { 
        try { await auth.signInWithPopup(new GoogleAuthProvider()); } 
        catch (e: any) { alert("Login fehlgeschlagen: " + e.message); } 
    };

    const handleCreate = async () => {
        if(!user) return;
        const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        await db.collection('rooms').doc(newCode).set({ 
            roomName: "Mein Garten", 
            owner: user.uid, 
            ownerName: user.displayName, 
            createdAt: new Date().toISOString(), 
            users: [user.uid], 
            tasks: [], 
            inventory: { carrot_seed: 2 }, 
            coins: 50, 
            gems: 0, 
            gardens: { 0: {} }, 
            unlockedGardens: [0], 
            likes: 0 
        });
        enterRoom(newCode, false);
    };

    const enterRoom = (code: string, spectator: boolean) => { 
        if (!spectator) localStorage.setItem('lastRoom', code); 
        setCurrentRoom(code); 
        setIsSpectator(spectator); 
        setView('game'); 
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-slate-50 text-green-600 animate-pulse"><Loader2 className="animate-spin mr-2"/> Lade DuoBloom...</div>;
    if (!user) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="h-full w-full">
            {view === 'menu' && (
                <div className="h-full bg-slate-100 flex flex-col items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="p-6 bg-green-500 text-white flex items-center gap-4">
                            {user.photoURL && <img src={user.photoURL} className="w-16 h-16 rounded-full border-4 border-white/50" />}
                            <div>
                                <h2 className="text-xl font-bold">{user.displayName}</h2>
                                <p className="opacity-80 text-sm">Willkommen zurück!</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {currentRoom && (
                                <button onClick={() => enterRoom(currentRoom, false)} className="w-full bg-green-50 border-2 border-green-500 p-4 rounded-xl flex justify-between items-center group hover:bg-green-100 transition-colors">
                                    <div className="text-left">
                                        <div className="text-xs text-green-600 font-bold uppercase">Weitergärtnern</div>
                                        <div className="text-xl font-bold text-green-800">{currentRoom}</div>
                                    </div>
                                    <div className="bg-green-500 text-white p-2 rounded-full group-hover:scale-110 transition-transform"><Play size={20} fill="currentColor"/></div>
                                </button>
                            )}
                            <button onClick={handleCreate} className="w-full bg-blue-500 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                                <PlusSquare/> Neuer Garten
                            </button>
                            <div className="flex gap-2">
                                <input 
                                    value={joinCode} 
                                    onChange={e => setJoinCode(e.target.value.toUpperCase())} 
                                    placeholder="Garten Code" 
                                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-bold uppercase outline-none focus:ring-2 ring-blue-500"
                                />
                                <button onClick={() => joinCode && enterRoom(joinCode, false)} className="bg-gray-800 text-white px-6 rounded-xl font-bold">
                                    <ArrowRight/>
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t flex justify-between text-gray-400">
                             <button onClick={() => auth.signOut()} className="flex items-center gap-2 hover:text-red-500"><LogOut size={16}/> Logout</button>
                        </div>
                    </div>
                </div>
            )}
            {view === 'game' && currentRoom && (
                <GameApp user={user} roomCode={currentRoom} isSpectator={isSpectator} onBackToMenu={() => setView('menu')} />
            )}
        </div>
    );
};

export default App;
