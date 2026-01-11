import { forwardRef, useImperativeHandle, useRef } from 'react';

// Mock implementation of RapierRigidBody methods used in the game
// This effectively creates a "ghost" object that logic can interact with 
// triggers no WASM/WGL calls.

export const MockRigidBody = forwardRef((props: any, ref) => {
    const { children, position } = props;

    // Internal state to track "physics" mostly for debugging or simple logical position holding
    const internalPos = useRef(position || [0, 0, 0]);

    useImperativeHandle(ref, () => ({
        setLinvel: (_vel: { x: number; y: number; z: number }, _wake?: boolean) => {
            // No-op
        },
        linvel: () => ({ x: 0, y: 0, z: 0 }),
        setTranslation: (pos: { x: number; y: number; z: number }, _wake?: boolean) => {
            internalPos.current = [pos.x, pos.y, pos.z];
        },
        translation: () => ({
            x: internalPos.current[0],
            y: internalPos.current[1],
            z: internalPos.current[2]
        }),
        applyImpulse: (_impulse: any, _wake?: boolean) => { },
        lockRotations: (_locked: boolean, _wake?: boolean) => { },
        setEnabledTranslations: (_enabled: boolean, _wake?: boolean) => { },
        setAngvel: (_vel: any, _wake?: boolean) => { },
        // Add other methods as needed by Enemy.tsx
        userData: props.userData || {}
    }));

    // Render children (meshes/logic) but WRAP in group to maintain tree structure
    return (
        <group position={position}>
            {children}
        </group>
    );
});

// Mock collider as well since RigidBody expects them as children?
// Actually if we just render children, <CuboidCollider> inside will try to render.
// We should probably strip Colliders too if we Mock the Body or make MockCollider.
// But <CuboidCollider> comes from @react-three/rapier.
// In Enemy.tsx, we can conditionally render Colliders.
