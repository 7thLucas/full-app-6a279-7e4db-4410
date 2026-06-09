"use client";
import { useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";

// ── Zone color map ─────────────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  A: "#3B82F6",
  B: "#14B8A6",
  C: "#8B5CF6",
  D: "#F97316",
};

// ── Pulsing highlighted bin ────────────────────────────────────────────────────
function HighlightedBin({
  position,
}: {
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[0.9, 0.5, 0.75]} />
      <meshStandardMaterial
        color="#F59E0B"
        emissive="#F59E0B"
        emissiveIntensity={0.8}
        metalness={0.2}
        roughness={0.3}
      />
    </mesh>
  );
}

// ── Individual bin ─────────────────────────────────────────────────────────────
function Bin({
  position,
  color,
  isHighlighted,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  if (isHighlighted) {
    return (
      <group onClick={onClick}>
        <HighlightedBin position={position} />
      </group>
    );
  }

  return (
    <mesh position={position} castShadow onClick={onClick}>
      <boxGeometry args={[0.85, 0.45, 0.7]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.12}
        metalness={0.2}
        roughness={0.55}
        transparent
        opacity={0.82}
      />
    </mesh>
  );
}

// ── Warehouse Rack ─────────────────────────────────────────────────────────────
function WarehouseRack({
  posX,
  posZ,
  zone,
  bins,
  highlightLocationId,
  onBinClick,
}: {
  posX: number;
  posZ: number;
  zone: string;
  bins: Array<{
    _id: string;
    shelf: string;
    bin: string;
  }>;
  highlightLocationId: string;
  onBinClick: (locId: string) => void;
}) {
  const zoneColor = ZONE_COLORS[zone] ?? "#334155";
  const rackColor = "#1E293B";
  const shelfColor = "#263548";
  const shelfYPositions = [0.75, 2.25, 3.75];

  return (
    <group position={[posX, 0, posZ]}>
      {/* Vertical uprights */}
      {[-1.55, 1.55].map((xOff) => (
        <mesh key={xOff} position={[xOff, 2.5, 0]} castShadow>
          <boxGeometry args={[0.1, 5.1, 0.1]} />
          <meshStandardMaterial color={rackColor} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Back beam */}
      <mesh position={[0, 5.05, -0.4]} castShadow>
        <boxGeometry args={[3.2, 0.1, 0.1]} />
        <meshStandardMaterial color={rackColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Shelves */}
      {shelfYPositions.map((y, si) => (
        <group key={si}>
          {/* Shelf board */}
          <mesh position={[0, y - 0.06, 0]}>
            <boxGeometry args={[3.2, 0.09, 0.82]} />
            <meshStandardMaterial color={shelfColor} metalness={0.3} roughness={0.7} />
          </mesh>

          {/* Cross-beam */}
          <mesh position={[0, y - 0.12, -0.35]}>
            <boxGeometry args={[3.2, 0.06, 0.06]} />
            <meshStandardMaterial color={rackColor} metalness={0.5} />
          </mesh>

          {/* Bins on this shelf */}
          {bins
            .filter((b) => b.shelf === String(si + 1))
            .map((bin) => {
              const binX = bin.bin === "A" ? -1 : bin.bin === "B" ? 0 : 1;
              return (
                <Bin
                  key={bin._id}
                  position={[binX, y + 0.27, 0]}
                  color={zoneColor}
                  isHighlighted={bin._id === highlightLocationId}
                  onClick={() => onBinClick(bin._id)}
                />
              );
            })}
        </group>
      ))}

      {/* Zone label */}
      <Text
        position={[0, 5.7, 0]}
        fontSize={0.4}
        color={zoneColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {`Zone ${zone}`}
      </Text>
    </group>
  );
}

// ── Navigation path ────────────────────────────────────────────────────────────
function NavigationPath({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#F59E0B", linewidth: 2 }))} />
  );
}

// ── Pulsing highlight ring on floor ───────────────────────────────────────────
function PulsingRing({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      const t = 1 + Math.sin(s.clock.elapsedTime * 2.5) * 0.12;
      ref.current.scale.setScalar(t);
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.0, 32]} />
      <meshBasicMaterial color="#F59E0B" transparent opacity={0.65} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Camera smooth-fly to highlight ────────────────────────────────────────────
function CameraFly({ target }: { target: THREE.Vector3 | null }) {
  const { camera } = useThree();
  const goal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (target) {
      goal.current = new THREE.Vector3(target.x, target.y + 10, target.z + 12);
    }
  }, [target]);

  useFrame(() => {
    if (goal.current) {
      camera.position.lerp(goal.current, 0.04);
    }
  });

  return null;
}

// ── Scene ──────────────────────────────────────────────────────────────────────
function WarehouseScene({
  locations,
  highlightLocationId,
  onBinClick,
}: {
  locations: any[];
  highlightLocationId: string;
  onBinClick: (loc: any) => void;
}) {
  const ZONES = ["A", "B", "C", "D"];

  // Group bins by zone+rack
  const rackMap = new Map<string, { zone: string; rack: string; posX: number; posZ: number; bins: any[] }>();
  for (const loc of locations) {
    const key = `${loc.zone}-${loc.rack}`;
    if (!rackMap.has(key)) {
      const zi = ZONES.indexOf(loc.zone);
      const ri = parseInt(loc.rack, 10) - 1;
      rackMap.set(key, {
        zone: loc.zone,
        rack: loc.rack,
        posX: (zi - 1.5) * 7.5,
        posZ: (ri - 1) * 4.5,
        bins: [],
      });
    }
    rackMap.get(key)!.bins.push(loc);
  }

  const hl = locations.find((l) => l._id === highlightLocationId);
  let hlPos: THREE.Vector3 | null = null;
  let hlFloor: [number, number, number] | null = null;

  if (hl) {
    const ri = parseInt(hl.rack, 10) - 1;
    const zi = ZONES.indexOf(hl.zone);
    const binX = hl.bin === "A" ? -1 : hl.bin === "B" ? 0 : 1;
    const shelfY = [0.75, 2.25, 3.75][parseInt(hl.shelf, 10) - 1] ?? 0.75;
    hlPos = new THREE.Vector3((zi - 1.5) * 7.5 + binX, shelfY + 0.27, (ri - 1) * 4.5);
    hlFloor = [(zi - 1.5) * 7.5 + binX, 0.02, (ri - 1) * 4.5];
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 22, 10]} intensity={0.9} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-15, 12, -15]} intensity={0.25} color="#3B6BF6" />
      <pointLight position={[0, 12, 0]} intensity={0.4} color="#F59E0B" distance={40} />

      {/* Floor */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[90, 70]} />
        <meshStandardMaterial color="#080E1C" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Floor grid */}
      <Grid
        position={[0, 0, 0]}
        args={[80, 60]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1A2B3E"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#2D3F5E"
        fadeDistance={90}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Racks */}
      {Array.from(rackMap.values()).map((rg) => (
        <WarehouseRack
          key={`${rg.zone}-${rg.rack}`}
          posX={rg.posX}
          posZ={rg.posZ}
          zone={rg.zone}
          bins={rg.bins}
          highlightLocationId={highlightLocationId}
          onBinClick={(locId) => {
            const loc = locations.find((l) => l._id === locId);
            if (loc) onBinClick(loc);
          }}
        />
      ))}

      {/* Highlight floor ring */}
      {hlFloor && <PulsingRing position={hlFloor} />}

      {/* Navigation path from entrance */}
      {hlPos && (
        <NavigationPath from={[0, 0.15, 15]} to={[hlPos.x, 0.15, hlPos.z]} />
      )}

      {/* Entrance */}
      <mesh position={[0, 0.08, 15]}>
        <cylinderGeometry args={[0.7, 0.7, 0.12, 24]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.8} />
      </mesh>
      <Text position={[0, 0.7, 15]} fontSize={0.55} color="#10B981" anchorX="center" outlineWidth={0.03} outlineColor="#000">
        ENTRANCE
      </Text>

      <CameraFly target={hlPos} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={6}
        maxDistance={70}
        target={[0, 2, 0]}
      />
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────
export default function Warehouse3DCanvas({
  locations,
  highlightLocationId,
  onBinClick,
}: {
  locations: any[];
  highlightLocationId: string;
  onBinClick: (loc: any) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 28, 32], fov: 52 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#080E1C", width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <WarehouseScene
          locations={locations}
          highlightLocationId={highlightLocationId}
          onBinClick={onBinClick}
        />
      </Suspense>
    </Canvas>
  );
}
