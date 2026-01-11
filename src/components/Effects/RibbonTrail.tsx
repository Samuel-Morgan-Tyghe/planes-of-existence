import { useFrame } from '@react-three/fiber';
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface RibbonTrailProps {
    target: React.RefObject<THREE.Object3D>;
    length?: number; // Number of segments
    width?: number;
    color?: string;
    decay?: number; // How fast visualization shrinks?
    interval?: number; // Update every N frames? (Use 1 for smooth)
}

export function RibbonTrail({ target, length = 20, width = 0.4, color = 'cyan' }: RibbonTrailProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const pointsRef = useRef<THREE.Vector3[]>([]); // History buffer

    // Geometry Data
    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const maxPoints = length;

    // Initialize buffers
    const positions = useMemo(() => new Float32Array(maxPoints * 2 * 3), [maxPoints]);
    const indices = useMemo(() => {
        const ind = [];
        for (let i = 0; i < maxPoints - 1; i++) {
            // Triangle Strip Logic
            // 0, 1, 2, 3...
            // For BufferAttribute, standard indexed triangles might be safer/easier than strip draw mode if we want custom UVs.
            // But let's try strict pair logic.
            // Top: 2*i, Bottom: 2*i+1
            // Next Top: 2*(i+1), Next Bottom: 2*(i+1)+1

            // Quad: (2i, 2i+1, 2i+2), (2i+1, 2i+3, 2i+2)
            const p = i * 2;
            ind.push(p, p + 1, p + 2);
            ind.push(p + 1, p + 3, p + 2);
        }
        return new Uint16Array(ind);
    }, [maxPoints]);

    const uvs = useMemo(() => {
        const u = new Float32Array(maxPoints * 2 * 2);
        for (let i = 0; i < maxPoints; i++) {
            const progress = i / (maxPoints - 1);
            // Vert 0 (Top)
            u[i * 4 + 0] = progress;
            u[i * 4 + 1] = 0;
            // Vert 1 (Bottom)
            u[i * 4 + 2] = progress;
            u[i * 4 + 3] = 1;
        }
        return u;
    }, [maxPoints]);

    useLayoutEffect(() => {
        if (geometryRef.current) {
            geometryRef.current.setIndex(new THREE.BufferAttribute(indices, 1));
            geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometryRef.current.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            // Pre-fill with degraded positions (all at zero or current pos) to avoid wild render
        }
    }, [indices, positions, uvs]);

    useFrame((state) => {
        if (!target.current || !meshRef.current || !geometryRef.current) return;

        // Update History
        // If first frame, init all points
        const currentPos = new THREE.Vector3();
        target.current.getWorldPosition(currentPos);

        if (pointsRef.current.length === 0) {
            for (let i = 0; i < maxPoints; i++) pointsRef.current.push(currentPos.clone());
        } else {
            // Shift
            // We want smooth ribbon.
            // Move Head (index 0) to new pos?
            // Usually Trail is: Head is latest, Tail is oldest.
            // points[0] = current
            // points[last] = old

            // Shift array
            pointsRef.current.pop();
            pointsRef.current.unshift(currentPos.clone());
        }

        // Update Geometry Vertices
        // We need Camera position to billboard
        const cameraPos = state.camera.position;
        const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;

        // Inverse Matrix Calculation to handle Parent Movement
        // Since this mesh is a child of the projectile, it moves with it.
        // We want the trail points to remain "fixed" in world space relative to the camera/scene,
        // but since our coordinate system is moving, we must transform stored WORLD points
        // into LOCAL space for this frame.
        meshRef.current.updateMatrixWorld();
        const worldToLocal = meshRef.current.matrixWorld.clone().invert();

        // Optimize: Create vectors once
        // Optimize: Create vectors once


        for (let i = 0; i < pointsRef.current.length; i++) {
            const pWorld = pointsRef.current[i];

            // Convert World Point -> Local Point


            // Calculate direction to next point (or prev?)
            // Tangent needs to be in WORLD space for ViewDir calculation, then converted?
            // actually, Billboarding is easier in World Space usually.
            // But we must write LOCAL coordinates to the buffer.

            // Let's do billboard math in World Space, then convert the final 2 vertices to Local.

            let tangent = new THREE.Vector3();
            if (i === 0) {
                if (pointsRef.current.length > 1) {
                    tangent.subVectors(pointsRef.current[i], pointsRef.current[i + 1]);
                } else {
                    tangent.set(0, 0, 1);
                }
            } else {
                tangent.subVectors(pointsRef.current[i - 1], pointsRef.current[i]);
            }
            if (tangent.lengthSq() < 0.001) tangent.set(0, 0, 0);
            tangent.normalize();

            const viewDir = new THREE.Vector3().subVectors(pWorld, cameraPos).normalize();
            const offset = new THREE.Vector3().crossVectors(viewDir, tangent).normalize();

            const size = width * (1 - i / maxPoints);

            // Calc World Vertices
            const v1World = pWorld.clone().add(offset.clone().multiplyScalar(size / 2));
            const v2World = pWorld.clone().sub(offset.clone().multiplyScalar(size / 2));

            // Convert to Local for Buffer
            const v1Local = v1World.applyMatrix4(worldToLocal);
            const v2Local = v2World.applyMatrix4(worldToLocal);

            posAttr.setXYZ(i * 2, v1Local.x, v1Local.y, v1Local.z);
            posAttr.setXYZ(i * 2 + 1, v2Local.x, v2Local.y, v2Local.z);
        }

        posAttr.needsUpdate = true;
    });

    return (
        <mesh ref={meshRef} frustumCulled={false}>
            <bufferGeometry ref={geometryRef} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}
