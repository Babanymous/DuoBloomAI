import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { auth, db, GoogleAuthProvider } from './services/firebase';
import { LogOut, Home, Play, Plus, ArrowRight, Globe, Download, Loader2, Share, Heart, PlusSquare, Castle, Store, CheckSquare, Flower2, ShoppingCart, Trash2, Check, Repeat, Calendar, Sprout, CheckCircle } from 'lucide-react';
import OctoChat from './components/OctoChat';
import GridCell from './components/GridCell';
import { RoomData, ITEMS, GARDEN_UPGRADES, Task, WATER_COOLDOWN } from './types';

// --- HELPER COMPONENTS ---

const ItemDisplay = ({ item, className = "" }: { item: any, className?: string }) => {
    const [hasError, setHasError] = useState(false);
    if (!item) return null;
    if (item.img && !hasError) {
        return <img src={item.img} alt={item.name} className={`${className} object-contain drop-shadow-md`} onError={() => setHasError(true)} />;
    }
    return <span className={`flex items-center justify-center ${className} text-2xl`}>{item.icon || "•"}</span>;
};

const Modal = ({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-pop">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                <button onClick={onClose}><span className="text-gray-500 hover:text-red-500 font-bold">X</span></button>
            </div>
            <div className="p-4 overflow-y-auto">{children}</div>
        </div>
    </div>
);

// --- SCREENS ---

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
            <p className="text-xs text-gray-400 mt-6">Version 24.1 (Vite + Gemini 2.5)</p>
        </div>
    </div>
);

const CommunityList = ({ onVisit, onBack }: { onVisit: (id: string) => void, onBack: () => void }) => {
    const [list, setList] = useState<RoomData[] & { id: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchG = async () => {
            try {
                const snap = await db.collection('rooms').orderBy('likes', 'desc').limit(50).get();
                const sorted = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                setList(sorted);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchG();
    }, []);

    return (
        <div className="h-full bg-slate-50 flex flex-col md:max-w-4xl md:mx-auto md:my-8 md:rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 bg-white shadow-sm flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><Home className="text-gray-600" /></button>
                <h2 className="text-2xl font-bold text-gray-800">Community Gärten</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loading && <div className="text-center p-8 text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Lade Liste...</div>}
                {list.map(g => (
                    <div key={g.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <div className="font-bold text-lg text-gray-800">{g.roomName || "Unbenannter Garten"}</div>
                            <div className="text-sm text-gray-500 flex gap-3">
                                <span className="text-red-500 flex items-center gap-1"><Heart size={12} fill="currentColor" /> {g.likes || 0}</span>
                                <span>Level {g.unlockedGardens?.length || 1}</span>
                            </div>
                        </div>
                        <button onClick={() => onVisit(g.id)} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold hover:bg-purple-200">Besuchen</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MainMenu = ({ user, onAction, currentRoom }: { user: firebase.User, onAction: (action: string, p?: any, p2?: any) => void, currentRoom: string | null }) => {
    const [joinCode, setJoinCode] = useState("");
    
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hallo, {user.displayName?.split(' ')[0]}! 👋</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                 <button onClick={() => onAction('create')} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-4">
                    <PlusSquare size={48} className="text-green-600" />
                    <span className="font-bold text-lg text-gray-700">Neuen Garten anlegen</span>
                </button>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><ArrowRight /> Garten beitreten</h3>
                    <div className="flex gap-2">
                        <input 
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Code eingeben..."
                            className="flex-1 bg-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                        />
                         <button onClick={() => onAction('join', joinCode)} disabled={!joinCode} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"><ArrowRight /></button>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                 <button onClick={() => onAction('community')} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 font-bold bg-white px-6 py-3 rounded-full shadow-sm"><Globe size={20} /> Community</button>
                 <button onClick={() => auth.signOut()} className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold bg-white px-6 py-3 rounded-full shadow-sm"><LogOut size={20} /> Abmelden</button>
            </div>
            
             {currentRoom && (
                <div className="mt-8">
                    <button onClick={() => onAction('enter', currentRoom)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-3">
                        <Play fill="currentColor" /> Weitergärtnern
                    </button>
                </div>
            )}
        </div>
    );
};

const GameScreen = ({ roomData, user, onBack, onUpdateRoom }: { roomData: RoomData, user: firebase.User, onBack: () => void, onUpdateRoom: (d: Partial<RoomData>) => void }) => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('garden');
    const [now, setNow] = useState(Date.now());
    
    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(i);
    }, []);

    const garden = roomData.gardens['main'] || {};
    // Ensure 5x5 grid
    for(let x=0; x<5; x++) for(let y=0; y<5; y++) if(!garden[`${x},${y}`]) garden[`${x},${y}`] = {};

    const handleCellClick = (x: number, y: number) => {
        const key = `${x},${y}`;
        const cell = garden[key];
        const newGarden = { ...garden };

        // 1. Plant/Place
        if (selectedItem && (!cell.item && !cell.floor)) {
            const itemDef = ITEMS[selectedItem];
            if (!itemDef) return;
            
            // Check inventory
            if ((roomData.inventory[selectedItem] || 0) <= 0) {
                alert("Nicht genug im Inventar!");
                return;
            }

            if (itemDef.type === 'floor') {
                newGarden[key] = { ...cell, floor: selectedItem };
            } else {
                newGarden[key] = { ...cell, item: selectedItem, stage: 0, grown: false, plantedAt: new Date().toISOString() };
                if (itemDef.type === 'seed') {
                     // Usually seeds need water to start.
                     newGarden[key].lastWatered = "0"; 
                }
            }
            
            const newInv = { ...roomData.inventory };
            newInv[selectedItem]--;
            onUpdateRoom({ 
                gardens: { ...roomData.gardens, main: newGarden },
                inventory: newInv
            });
            return;
        }

        // 2. Interact (Water/Harvest)
        if (cell.item) {
            const itemDef = ITEMS[cell.item];
            if (!itemDef) return;

            // Harvest
            if (cell.grown) {
                const reward = itemDef.reward || 5;
                const newInv = { ...roomData.inventory };
                if (itemDef.growsInto) {
                    newInv[itemDef.growsInto] = (newInv[itemDef.growsInto] || 0) + 1;
                }
                
                newGarden[key] = { floor: cell.floor }; // Clear item
                onUpdateRoom({
                    gardens: { ...roomData.gardens, main: newGarden },
                    coins: (roomData.coins || 0) + reward,
                    inventory: newInv
                });
                return;
            }

            // Water
            if (itemDef.type === 'seed') {
                const lastWatered = cell.lastWatered ? new Date(cell.lastWatered).getTime() : 0;
                if (now - lastWatered > WATER_COOLDOWN) {
                    let newStage = (cell.stage || 0) + 1;
                    let grown = false;
                    if (newStage >= (itemDef.stages || 3)) {
                        grown = true;
                    }
                    newGarden[key] = { ...cell, lastWatered: new Date().toISOString(), stage: newStage, grown };
                    onUpdateRoom({ gardens: { ...roomData.gardens, main: newGarden } });
                }
            }
        }
    };

    const buyItem = (id: string) => {
        const item = ITEMS[id];
        if (roomData.coins >= item.price) {
            const newInv = { ...roomData.inventory };
            newInv[id] = (newInv[id] || 0) + 1;
            onUpdateRoom({
                coins: roomData.coins - item.price,
                inventory: newInv
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-green-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><Home size={20}/></button>
                    <div>
                        <h2 className="font-bold text-lg">{roomData.roomName}</h2>
                        <div className="flex gap-4 text-sm font-mono text-gray-600">
                             <span className="text-yellow-600 font-bold flex items-center gap-1">🪙 {roomData.coins}</span>
                             <span className="text-blue-500 font-bold flex items-center gap-1">💎 {roomData.gems}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setSelectedItem(null)} className={`p-2 rounded-xl ${!selectedItem ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>🖐️</button>
                    <button onClick={() => setActiveTab('shop')} className={`p-2 rounded-xl ${activeTab === 'shop' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}><Store size={20}/></button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-auto p-4 flex justify-center">
                 {/* Grid */}
                 <div className="grid grid-cols-5 gap-1 bg-green-200 p-2 rounded-xl shadow-inner self-start">
                     {[0,1,2,3,4].map(y => [0,1,2,3,4].map(x => (
                         <GridCell key={`${x},${y}`} x={x} y={y} cell={garden[`${x},${y}`] || {}} handleGridClick={handleCellClick} now={now} />
                     )))}
                 </div>
            </div>

            {/* Bottom Panel (Inventory/Shop) */}
            <div className="bg-white border-t p-4 h-48 overflow-y-auto">
                {activeTab === 'shop' ? (
                     <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Laden</h3>
                            <button onClick={() => setActiveTab('garden')} className="text-sm text-blue-500">Zum Inventar</button>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                             {Object.values(ITEMS).map(item => (
                                 <button key={item.id} onClick={() => buyItem(item.id)} disabled={roomData.coins < item.price} className="flex flex-col items-center p-2 border rounded-xl hover:bg-gray-50 disabled:opacity-50">
                                     <ItemDisplay item={item} className="w-8 h-8 mb-1" />
                                     <span className="text-xs font-bold">{item.name}</span>
                                     <span className="text-xs text-yellow-600">🪙 {item.price}</span>
                                 </button>
                             ))}
                         </div>
                     </div>
                ) : (
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Dein Rucksack</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {Object.entries(roomData.inventory).map(([id, count]) => {
                                if (count <= 0) return null;
                                const item = ITEMS[id];
                                return (
                                    <button key={id} onClick={() => setSelectedItem(selectedItem === id ? null : id)} className={`flex-shrink-0 flex flex-col items-center p-3 border rounded-xl min-w-[80px] ${selectedItem === id ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'}`}>
                                        <ItemDisplay item={item} className="w-8 h-8 mb-1" />
                                        <span className="text-xs font-bold truncate w-full text-center">{item.name}</span>
                                        <span className="text-xs bg-gray-200 px-1.5 rounded-full mt-1">{count}x</span>
                                    </button>
                                );
                            })}
                            {Object.values(roomData.inventory).every(c => c <= 0) && <p className="text-gray-400 text-sm">Leer...</p>}
                        </div>
                    </div>
                )}
            </div>
            
            <OctoChat user={user} roomData={roomData} />
        </div>
    );
};

// --- APP COMPONENT ---

const App = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [screen, setScreen] = useState<'login'|'menu'|'game'|'community'>('login');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<RoomData | null>(null);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => {
            setUser(u);
            if(u) setScreen('menu'); else setScreen('login');
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!currentRoomId) return;
        const unsub = db.collection('rooms').doc(currentRoomId).onSnapshot(snap => {
            if (snap.exists) setRoomData(snap.data() as RoomData);
        });
        return unsub;
    }, [currentRoomId]);

    const handleLogin = async () => {
        try { await auth.signInWithPopup(new GoogleAuthProvider()); } catch (e) { console.error(e); }
    };

    const handleMenuAction = async (action: string, param?: any) => {
        if (action === 'create') {
            const newRoomRef = db.collection('rooms').doc();
            const newRoom: RoomData = {
                roomName: `Garten von ${user?.displayName?.split(' ')[0]}`,
                owner: user!.uid,
                ownerName: user!.displayName || 'Gärtner',
                users: [user!.uid],
                tasks: [],
                inventory: { carrot_seed: 5, stone_floor: 10 },
                coins: 100,
                gems: 0,
                gardens: { main: {} },
                unlockedGardens: [0],
                likes: 0,
                createdAt: new Date().toISOString()
            };
            await newRoomRef.set(newRoom);
            setCurrentRoomId(newRoomRef.id);
            setScreen('game');
        } else if (action === 'join') {
            const snap = await db.collection('rooms').doc(param).get();
            if (snap.exists) {
                setCurrentRoomId(param);
                setScreen('game');
            } else {
                alert("Garten nicht gefunden!");
            }
        } else if (action === 'enter') {
            setCurrentRoomId(param);
            setScreen('game');
        } else if (action === 'community') {
            setScreen('community');
        }
    };

    const handleUpdateRoom = (data: Partial<RoomData>) => {
        if (currentRoomId) db.collection('rooms').doc(currentRoomId).update(data);
    };

    if (!user) return <LoginScreen onLogin={handleLogin} />;
    if (screen === 'community') return <CommunityList onVisit={(id) => { setCurrentRoomId(id); setScreen('game'); }} onBack={() => setScreen('menu')} />;
    if (screen === 'game' && roomData) return <GameScreen roomData={roomData} user={user} onBack={() => setScreen('menu')} onUpdateRoom={handleUpdateRoom} />;
    
    return <MainMenu user={user} onAction={handleMenuAction} currentRoom={currentRoomId} />;
};

export default App;
