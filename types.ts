export interface Item {
    id: string;
    name: string;
    type: 'seed' | 'floor' | 'deco';
    price: number;
    img?: string;
    icon?: string;
    css?: string;
    growsInto?: string;
    stages?: number;
    reward?: number;
}

export interface GridCellData {
    floor?: string;
    item?: string;
    stage?: number;
    grown?: boolean;
    lastWatered?: string;
    plantedAt?: string;
}

export interface Task {
    id: string;
    title: string;
    reward: number;
    type: 'once' | 'daily';
    deadline?: string;
    done: boolean;
    lastDone?: string;
    completedBy?: string;
    completedAt?: string;
}

export interface RoomData {
    roomName: string;
    owner: string;
    users: string[];
    tasks: Task[];
    inventory: Record<string, number>;
    coins: number;
    gems: number;
    gardens: Record<string, Record<string, GridCellData>>;
    unlockedGardens: number[];
    likes: number;
    lastStreakDate?: string;
    currentStreak?: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const WATER_COOLDOWN = 6 * 60 * 60 * 1000; 

export const ITEMS: Record<string, Item> = {
    carrot_seed: { id: 'carrot_seed', name: 'Karotte', type: 'seed', price: 20, img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Carrot.png', icon: '🥕', growsInto: 'carrot', stages: 3, reward: 10 },
    sunflower_seed: { id: 'sunflower_seed', name: 'Sonnenblume', type: 'seed', price: 60, img: 'assets/sunflower.png', icon: '🌻', growsInto: 'sunflower', stages: 4, reward: 20 },
    forgetmenot_seed: { id: 'forgetmenot_seed', name: 'Vergissmeinnicht', type: 'seed', price: 100, img: 'assets/forgetmenot.png', icon: '🪻', growsInto: 'forgetmenot', stages: 6, reward: 50 },
    stone_floor: { id: 'stone_floor', name: 'Steinweg', type: 'floor', price: 10, css: 'texture-stone', icon: '🪨' },
    wood_floor: { id: 'wood_floor', name: 'Holzboden', type: 'floor', price: 25, css: 'texture-wood', icon: '🪵' },
    fence: { id: 'fence', name: 'Zaun', type: 'deco', price: 15, img: 'assets/fence.png', icon: '🚧' },
    bench: { id: 'bench', name: 'Bank', type: 'deco', price: 150, img: 'assets/bench.png', icon: '🪑' },
    gnome: { id: 'gnome', name: 'Zwerg', type: 'deco', price: 250, img: 'assets/gnome.png', icon: '🎅' },
};

export const GARDEN_UPGRADES = [
    { id: 0, name: "Start-Garten", price: 0 },
    { id: 1, name: "Hinterhof", price: 200 },
    { id: 2, name: "Waldlichtung", price: 650 },
];