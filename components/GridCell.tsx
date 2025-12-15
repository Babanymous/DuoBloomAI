import React from 'react';
import { GridCellData, ITEMS, WATER_COOLDOWN } from '../types';

interface GridCellProps {
    x: number;
    y: number;
    cell: GridCellData;
    handleGridClick: (x: number, y: number) => void;
    now: number;
}

const GridCell: React.FC<GridCellProps> = ({ x, y, cell, handleGridClick, now }) => {
    const floorItem = cell.floor ? ITEMS[cell.floor] : null;
    const objectItem = cell.item ? ITEMS[cell.item] : null;
    let showTimer = false, timeLeftStr = "";

    if (objectItem && objectItem.type === 'seed' && !cell.grown) {
        const lastWatered = cell.lastWatered ? new Date(cell.lastWatered).getTime() : 0;
        const diff = now - lastWatered;
        if (diff < WATER_COOLDOWN) {
            showTimer = true;
            const ms = WATER_COOLDOWN - diff;
            const h = Math.floor(ms / 3600000);
            const m = Math.floor((ms % 3600000) / 60000);
            timeLeftStr = h + "h " + m + "m";
        }
    }

    return (
        <div 
            onClick={() => handleGridClick(x, y)} 
            className={`w-14 h-14 md:w-20 md:h-20 relative cursor-pointer ${floorItem ? floorItem.css : 'bg-white/10 border border-white/20'}`}
        >
            {objectItem && (
                <div className="absolute inset-0 flex items-center justify-center z-10 hover:scale-110 transition-transform">
                    {cell.grown || objectItem.type === 'deco' ? (
                        objectItem.img ? (
                             <img src={objectItem.img} alt={objectItem.name} className="w-10 h-10 md:w-16 md:h-16 object-contain drop-shadow-md" />
                        ) : (
                            <span className="text-4xl">{objectItem.icon}</span>
                        )
                    ) : (
                        <div className="flex flex-col items-center relative">
                             {objectItem.img ? (
                                 <img src={objectItem.img} alt="seed" className="w-8 h-8 md:w-12 md:h-12 object-contain opacity-70" />
                             ) : (
                                 <span className="text-2xl">{objectItem.icon}</span>
                             )}
                            {showTimer ? (
                                <div className="absolute -top-4 bg-black/70 text-white text-[8px] md:text-[10px] px-1.5 rounded-full backdrop-blur-sm pointer-events-none whitespace-nowrap">{timeLeftStr}</div>
                            ) : (
                                <div className="absolute -top-4 bg-blue-500 text-white text-[8px] px-1 rounded-full animate-bounce shadow-sm">Gießen!</div>
                            )}
                            <div className="w-8 h-1 bg-black/20 rounded-full mt-1 overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all" 
                                    style={{width: `${((cell.stage || 0)/(objectItem.stages || 1))*100}%`}} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!objectItem && floorItem && <div className="absolute inset-0 hover:bg-white/20 transition-colors"></div>}
        </div>
    );
};

export default GridCell;