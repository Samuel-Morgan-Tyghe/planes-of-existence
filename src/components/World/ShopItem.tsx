import { useStore } from '@nanostores/react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getAvailableUniqueItems } from '../../logic/loot';
import { $coins, $hoveredItem, $inventory, $purchasedShopItems, addItem, recordPurchase } from '../../stores/game';
import { $position } from '../../stores/player';
import { ITEM_DEFINITIONS } from '../../types/items';

interface ShopItemProps {
    id: string; // Unique persistent ID (room-x-y)
    position: [number, number, number];
    itemId?: string; // Optional override, otherwise random
}

// Simple seeded random function (LCG)
const seededRandom = (seed: number) => {
    const a = 1664525;
    const c = 1013904223;
    const m = 4294967296;
    let s = seed;
    return () => {
        s = (a * s + c) % m;
        return s / m;
    };
};

export function ShopItem({ id, position, itemId }: ShopItemProps) {
    const meshRef = useRef<THREE.Group>(null);
    const purchasedItems = useStore($purchasedShopItems);
    const purchased = purchasedItems.has(id);
    const coins = useStore($coins);

    // Deterministic item selection based on position
    const seed = Math.floor(position[0] * 1000 + position[2] * 1000);
    const rng = seededRandom(seed);

    useStore($inventory); // Subscribe to changes
    const itemKeys = getAvailableUniqueItems();

    // Fallback if collected all items: allow duplicates or show 'sold out'? 
    // User said "shouldnt get same item twice". 
    // If empty, maybe show nothing?
    if (itemKeys.length === 0) return null;

    const selectedKey = itemId || itemKeys[Math.floor(rng() * itemKeys.length)];
    const itemDef = ITEM_DEFINITIONS[selectedKey];

    // Price calculation (base cost + rarity multiplier?)
    // For now, fixed cost or random variance
    const cost = itemDef ? Math.floor(20 + rng() * 30) : 50;

    const [hovered, setHovered] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if ($hoveredItem.get() === selectedKey) {
                $hoveredItem.set(null);
            }
        };
    }, [selectedKey]);

    useFrame((state) => {
        if (meshRef.current && !purchased) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }

        // Preview Logic (Distance based)
        const playerPos = $position.get();
        const dx = playerPos[0] - position[0];
        const dy = playerPos[1] - position[1];
        const dz = playerPos[2] - position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < 4.0) {
            if ($hoveredItem.get() !== selectedKey) {
                $hoveredItem.set(selectedKey);
            }
        } else {
            if ($hoveredItem.get() === selectedKey) {
                $hoveredItem.set(null);
            }
        }
    });

    const handlePurchase = () => {
        if (purchased) return;

        // Check funds
        const currentCoins = $coins.get();
        if (currentCoins >= cost) {
            $coins.set(currentCoins - cost);
            addItem(selectedKey);
            recordPurchase(id);
            if ($hoveredItem.get() === selectedKey) $hoveredItem.set(null);
            console.log(`💰 Bought ${itemDef.name} for ${cost} coins!`);
        } else {
            console.log('❌ Not enough coins!');
            // TODO: Sound/Visual feedback
        }
    };

    if (!itemDef) return null;
    if (purchased) return null; // Disappear when bought

    const canAfford = coins >= cost;

    return (
        <group position={position}>
            {/* Visuals */}
            <group ref={meshRef}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color={(itemDef as any).color || '#ffffff'} emissive={(itemDef as any).color} emissiveIntensity={0.5} />
                </mesh>

                {/* Price Tag */}
                <Html position={[0, 1, 0]} center transform sprite>
                    <div style={{
                        background: canAfford ? 'rgba(0, 0, 0, 0.8)' : 'rgba(50, 0, 0, 0.8)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: canAfford ? '#ffd700' : '#ff4444',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: canAfford ? '1px solid #ffd700' : '1px solid #ff4444',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                    }}>
                        <div style={{ fontSize: '10px', color: '#aaaaaa' }}>{itemDef.name}</div>
                        <div>{cost} 🟡</div>
                        {hovered && <div style={{ fontSize: '10px', color: '#00ff00' }}>[Touch to Buy]</div>}
                    </div>
                </Html>
            </group>

            {/* Trigger for buying */}
            <RigidBody
                type="fixed"
                sensor
                onIntersectionEnter={(e) => {
                    if (e.other.rigidBodyObject?.userData?.isPlayer) {
                        setHovered(true);
                        handlePurchase();
                    }
                }}
                onIntersectionExit={(e) => {
                    if (e.other.rigidBodyObject?.userData?.isPlayer) {
                        setHovered(false);
                    }
                }}
            >
                <CuboidCollider args={[0.4, 0.5, 0.4]} />
            </RigidBody>
        </group>
    );
}
