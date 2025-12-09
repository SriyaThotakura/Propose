import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function FeralGovernancePrototype() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const gridRef = useRef([]);
  const feralBlocksRef = useRef([]);
  const interventionsRef = useRef([]);

  // Game state
  const [turn, setTurn] = useState(0);
  const [feralScore, setFeralScore] = useState(0);
  const [controlScore, setControlScore] = useState(0);
  const [interventionScore, setInterventionScore] = useState(0);
  const [hasRunControl, setHasRunControl] = useState(false);
  const [hasDeployedIntervention, setHasDeployedIntervention] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // ABM Grid State (50x50)
  const gridSize = 50;
  const abmGrid = useRef(Array(gridSize).fill(null).map(() => 
    Array(gridSize).fill(null).map(() => ({
      feralIntensity: 0,
      vulnerability: Math.random() * 0.3, // Baseline vulnerability (0-0.3)
      hasIntervention: false,
      isHighway: false
    }))
  ));

  // === AESTHETIC CORE ===
  const FERAL_RED = 0xFF0055; // Neon Magenta
  const BACKGROUND_COLOR = 0x0a0a0a; // Deep Charcoal
  const GRID_COLOR = 0x2a2a2a; // Dark Gray
  const INTERVENTION_COLOR = 0x00ffff; // Cyan
  const UI_LIME = '#76ff03'; // Electric Lime
  const UI_CYAN = '#00ffff'; // Cyan

  useEffect(() => {
    if (!mountRef.current) return;

    // === I. SETUP & AESTHETIC ===
    
    // 1. Base Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND_COLOR);
    sceneRef.current = scene;

    // Isometric Camera (Mika Pikazo foreshortened perspective)
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(60, 80, 60);
    camera.lookAt(25, 0, 25);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 50, 30);
    scene.add(directionalLight);

    // 2. Create Base Map (50x50 grid)
    const gridGroup = new THREE.Group();
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const tileGeometry = new THREE.PlaneGeometry(1, 1);
        const tileMaterial = new THREE.MeshStandardMaterial({
          color: GRID_COLOR,
          side: THREE.DoubleSide
        });
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0, z);
        tile.userData = { x, z };
        gridGroup.add(tile);

        // Mark highway cells (simulate Cross-Bronx Expressway)
        if (z >= 24 && z <= 26) {
          abmGrid.current[x][z].isHighway = true;
          abmGrid.current[x][z].vulnerability += 0.2; // Higher vulnerability near highway
          tileMaterial.color.set(0x1a1a1a); // Darker highway cells
        }
      }
    }
    scene.add(gridGroup);
    gridRef.current = gridGroup;

    // Initialize some Feral Agent presence
    initializeFeralAgent();

    // Animation loop
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.016;

      // 10. Pulsing animation on Feral blocks
      feralBlocksRef.current.forEach((block, i) => {
        if (block) {
          const pulse = Math.sin(time * 3 + i * 0.1) * 0.1 + 0.9;
          block.material.emissiveIntensity = block.userData.baseEmissive * pulse;
          block.scale.y = block.userData.baseScale * (1 + Math.sin(time * 2 + i * 0.05) * 0.1);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Mouse interaction for placing interventions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(gridGroup.children);

      if (intersects.length > 0 && selectedCell) {
        const tile = intersects[0].object;
        const { x, z } = tile.userData;
        setSelectedCell({ x, z });
      }
    };

    window.addEventListener('click', onMouseClick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('click', onMouseClick);
      window.removeEventListener('resize', onResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // === II. FERAL LOGIC & SPREAD ===

  const initializeFeralAgent = () => {
    // Start with some baseline Feral presence
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Higher initial presence near highway
        if (abmGrid.current[x][z].isHighway) {
          abmGrid.current[x][z].feralIntensity = 0.6 + Math.random() * 0.2;
        } else {
          abmGrid.current[x][z].feralIntensity = Math.random() * 0.2;
        }
      }
    }
    updateFeralVisualization();
  };

  // 4. ABM Core Logic
  const calculateSpread = () => {
    const newGrid = JSON.parse(JSON.stringify(abmGrid.current));
    
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const cell = abmGrid.current[x][z];
        let spreadRate = 0;

        // Rule 1: Baseline Vulnerability
        spreadRate += cell.vulnerability * 0.1;

        // Rule 2: Macro-Climate Acceleration (highway acts as vector)
        if (cell.isHighway) {
          spreadRate *= 2.2; // Highway accelerates spread by 2.2x
        }

        // Check neighbors for contagion
        const neighbors = getNeighbors(x, z);
        neighbors.forEach(n => {
          if (n.feralIntensity > 0.5) {
            spreadRate += 0.02; // Neighbor contagion
          }
        });

        // Rule 3: CLT Intervention Factor
        if (cell.hasIntervention) {
          spreadRate *= 0.3; // Intervention reduces spread by 70%
        }

        // Check if nearby intervention provides protection
        const nearbyIntervention = neighbors.some(n => n.hasIntervention);
        if (nearbyIntervention) {
          spreadRate *= 0.5; // 50% reduction from nearby intervention
        }

        // Apply spread
        newGrid[x][z].feralIntensity = Math.min(1, cell.feralIntensity + spreadRate);
      }
    }

    abmGrid.current = newGrid;
    updateFeralVisualization();
    calculateFeralScore();
  };

  const getNeighbors = (x, z) => {
    const neighbors = [];
    const offsets = [[-1,0], [1,0], [0,-1], [0,1]];
    
    offsets.forEach(([dx, dz]) => {
      const nx = x + dx;
      const nz = z + dz;
      if (nx >= 0 && nx < gridSize && nz >= 0 && nz < gridSize) {
        neighbors.push(abmGrid.current[nx][nz]);
      }
    });
    
    return neighbors;
  };

  const calculateFeralScore = () => {
    let total = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        total += abmGrid.current[x][z].feralIntensity;
      }
    }
    setFeralScore(Math.round(total * 100));
  };

  // 5. Visualize Spread
  const updateFeralVisualization = () => {
    const scene = sceneRef.current;
    
    // Clear old blocks
    feralBlocksRef.current.forEach(block => scene.remove(block));
    feralBlocksRef.current = [];

    // Create new blocks based on Feral intensity
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const intensity = abmGrid.current[x][z].feralIntensity;
        
        if (intensity > 0.1) {
          const height = intensity * 5; // Scale height by intensity
          const geometry = new THREE.BoxGeometry(0.9, height, 0.9);
          const material = new THREE.MeshStandardMaterial({
            color: FERAL_RED,
            emissive: FERAL_RED,
            emissiveIntensity: intensity * 0.5,
            transparent: true,
            opacity: 0.8
          });
          
          const block = new THREE.Mesh(geometry, material);
          block.position.set(x, height / 2, z);
          block.userData.baseEmissive = intensity * 0.5;
          block.userData.baseScale = 1;
          
          scene.add(block);
          feralBlocksRef.current.push(block);
        }
      }
    }
  };

  // === III. UI & INTERACTION ===

  // 7. Deploy Intervention
  const deployIntervention = (x, z) => {
    if (!x && x !== 0) {
      // Auto-select high-intensity cell
      let maxIntensity = 0;
      let bestCell = { x: 25, z: 25 };
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (abmGrid.current[i][j].feralIntensity > maxIntensity) {
            maxIntensity = abmGrid.current[i][j].feralIntensity;
            bestCell = { x: i, z: j };
          }
        }
      }
      
      x = bestCell.x;
      z = bestCell.z;
    }

    // Mark intervention in ABM grid
    abmGrid.current[x][z].hasIntervention = true;

    // Draw intervention object (Cyan CylinderGeometry)
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 6);
    const material = new THREE.MeshStandardMaterial({
      color: INTERVENTION_COLOR,
      emissive: INTERVENTION_COLOR,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.3
    });
    
    const intervention = new THREE.Mesh(geometry, material);
    intervention.position.set(x, 0.25, z);
    
    sceneRef.current.add(intervention);
    interventionsRef.current.push(intervention);
    
    setHasDeployedIntervention(true);
  };

  // === IV. POLISH & PROOF OF ALERT ===

  // 8. Run simulation scenarios
  const runControlScenario = () => {
    // Reset grid
    initializeFeralAgent();
    
    // Clear interventions
    interventionsRef.current.forEach(i => sceneRef.current.remove(i));
    interventionsRef.current = [];
    
    // Run 10 turns
    for (let i = 0; i < 10; i++) {
      calculateSpread();
    }
    
    setControlScore(feralScore);
    setHasRunControl(true);
    setTurn(10);
  };

  const runInterventionScenario = () => {
    if (!hasDeployedIntervention) {
      alert("Please deploy a Community Land Trust intervention first!");
      return;
    }

    // Run 10 turns with intervention active
    for (let i = 0; i < 10; i++) {
      calculateSpread();
    }
    
    setInterventionScore(feralScore);
    setShowScorecard(true);
    setTurn(20);
  };

  const resetSimulation = () => {
    initializeFeralAgent();
    interventionsRef.current.forEach(i => sceneRef.current.remove(i));
    interventionsRef.current = [];
    setTurn(0);
    setFeralScore(0);
    setControlScore(0);
    setInterventionScore(0);
    setHasRunControl(false);
    setHasDeployedIntervention(false);
    setShowScorecard(false);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
      position: 'relative'
    }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* === 6. TACTICAL UI === */}
      
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px',
        background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <h1 style={{
          fontSize: '32px',
          color: UI_LIME,
          fontWeight: 700,
          letterSpacing: '4px',
          textShadow: `0 0 20px ${UI_LIME}`,
          margin: 0,
          textAlign: 'center'
        }}>
          FERAL GOVERNANCE
        </h1>
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: UI_CYAN,
          letterSpacing: '2px',
          marginTop: '8px'
        }}>
          TACTICAL SIMULATION // PROOF OF CONCEPT
        </div>
      </div>

      {/* Tactical Console */}
      <div style={{
        position: 'fixed',
        top: '120px',
        left: '20px',
        width: '320px',
        background: 'rgba(0, 0, 0, 0.95)',
        border: `2px solid ${UI_LIME}`,
        padding: '20px',
        borderRadius: '4px',
        boxShadow: `0 0 30px rgba(118, 255, 3, 0.3)`,
        pointerEvents: 'all',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '14px',
          color: UI_LIME,
          fontWeight: 700,
          letterSpacing: '2px',
          marginBottom: '16px',
          textTransform: 'uppercase'
        }}>
          TACTICAL CONSOLE
        </div>

        {/* Score Display */}
        <div style={{
          padding: '12px',
          background: 'rgba(255, 0, 85, 0.1)',
          border: '1px solid #ff0055',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '10px',
            color: '#ff0055',
            fontWeight: 700,
            letterSpacing: '1px',
            marginBottom: '4px'
          }}>
            CURRENT FERAL SCORE
          </div>
          <div style={{
            fontSize: '32px',
            color: '#fff',
            fontWeight: 900,
            textShadow: '0 0 10px #ff0055'
          }}>
            {feralScore}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#00ffff',
            marginTop: '4px'
          }}>
            TURN: {turn}
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={runControlScenario}
            disabled={hasRunControl}
            style={{
              width: '100%',
              padding: '12px',
              background: hasRunControl ? 'rgba(255, 0, 85, 0.3)' : '#ff0055',
              color: '#fff',
              border: '2px solid #ff0055',
              fontSize: '12px',
              fontWeight: 700,
              cursor: hasRunControl ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              transition: 'all 0.3s',
              opacity: hasRunControl ? 0.5 : 1
            }}
          >
            {hasRunControl ? '✓ CONTROL RUN COMPLETE' : '► RUN CONTROL (10 TURNS)'}
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => deployIntervention()}
            disabled={!hasRunControl || hasDeployedIntervention}
            style={{
              width: '100%',
              padding: '12px',
              background: hasDeployedIntervention ? 'rgba(0, 255, 255, 0.3)' : (hasRunControl ? UI_CYAN : 'rgba(0, 255, 255, 0.2)'),
              color: '#fff',
              border: `2px solid ${UI_CYAN}`,
              fontSize: '12px',
              fontWeight: 700,
              cursor: (hasRunControl && !hasDeployedIntervention) ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              transition: 'all 0.3s',
              opacity: hasRunControl ? 1 : 0.5
            }}
          >
            {hasDeployedIntervention ? '✓ CLT DEPLOYED' : '⬢ DEPLOY CLT INTERVENTION'}
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={runInterventionScenario}
            disabled={!hasDeployedIntervention}
            style={{
              width: '100%',
              padding: '12px',
              background: hasDeployedIntervention ? UI_LIME : 'rgba(118, 255, 3, 0.2)',
              color: '#000',
              border: `2px solid ${UI_LIME}`,
              fontSize: '12px',
              fontWeight: 700,
              cursor: hasDeployedIntervention ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              transition: 'all 0.3s',
              opacity: hasDeployedIntervention ? 1 : 0.5
            }}
          >
            ► RUN INTERVENTION (10 TURNS)
          </button>
        </div>

        <button
          onClick={resetSimulation}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            color: '#9e9e9e',
            border: '1px solid #616161',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            borderRadius: '4px',
            transition: 'all 0.3s'
          }}
        >
          RESET SIMULATION
        </button>

        {/* Instructions */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(0, 229, 255, 0.1)',
          border: '1px solid #00e5ff',
          borderRadius: '4px',
          fontSize: '10px',
          lineHeight: 1.6,
          color: '#e0e0e0'
        }}>
          <div style={{ color: UI_CYAN, fontWeight: 700, marginBottom: '6px' }}>
            PROTOCOL:
          </div>
          1. Run Control (baseline spread)<br/>
          2. Deploy CLT (Community Land Trust)<br/>
          3. Run Intervention (measure impact)<br/>
          4. View Scorecard (proof of alert)
        </div>
      </div>

      {/* === 9. SCORECARD === */}
      {showScorecard && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '40px',
          background: 'rgba(0, 0, 0, 0.98)',
          border: `4px solid ${UI_LIME}`,
          borderRadius: '8px',
          boxShadow: `0 0 60px rgba(118, 255, 3, 0.6), inset 0 0 40px rgba(118, 255, 3, 0.1)`,
          zIndex: 100,
          minWidth: '600px',
          pointerEvents: 'all'
        }}>
          <div style={{
            fontSize: '32px',
            color: UI_LIME,
            fontWeight: 900,
            letterSpacing: '3px',
            marginBottom: '24px',
            textAlign: 'center',
            textShadow: `0 0 30px ${UI_LIME}`,
            textTransform: 'uppercase'
          }}>
            FINAL SCORECARD
          </div>

          <div style={{
            fontSize: '14px',
            color: UI_CYAN,
            textAlign: 'center',
            marginBottom: '32px',
            letterSpacing: '2px'
          }}>
            PROOF OF COMPUTATIONAL ALERT
          </div>

          {/* Control Score */}
          <div style={{
            padding: '24px',
            background: 'rgba(255, 0, 85, 0.15)',
            border: '2px solid #ff0055',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#ff0055',
              fontWeight: 700,
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              CONTROL SCENARIO (NO INTERVENTION)
            </div>
            <div style={{
              fontSize: '56px',
              color: '#fff',
              fontWeight: 900,
              textShadow: '0 0 20px #ff0055',
              textAlign: 'center'
            }}>
              {controlScore}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9e9e9e',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Baseline spread after 10 turns
            </div>
          </div>

          {/* Intervention Score */}
          <div style={{
            padding: '24px',
            background: 'rgba(118, 255, 3, 0.15)',
            border: `2px solid ${UI_LIME}`,
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '12px',
              color: UI_LIME,
              fontWeight: 700,
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              INTERVENTION SCENARIO (CLT DEPLOYED)
            </div>
            <div style={{
              fontSize: '56px',
              color: '#fff',
              fontWeight: 900,
              textShadow: `0 0 20px ${UI_LIME}`,
              textAlign: 'center'
            }}>
              {interventionScore}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#9e9e9e',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Spread with Community Land Trust active
            </div>
          </div>

          {/* Impact Analysis */}
          <div style={{
            padding: '20px',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid #00e5ff',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '11px',
              color: UI_CYAN,
              fontWeight: 700,
              letterSpacing: '1px',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              IMPACT ANALYSIS
            </div>
            <div style={{
              fontSize: '14px',
              color: '#e0e0e0',
              lineHeight: 1.8
            }}>
              <strong style={{ color: UI_LIME }}>Reduction:</strong> {controlScore - interventionScore} points<br/>
              <strong style={{ color: UI_LIME }}>Percentage:</strong> {Math.round(((controlScore - interventionScore) / controlScore) * 100)}% decrease<br/>
              <strong style={{ color: UI_LIME }}>Verdict:</strong> {interventionScore < controlScore ? 'INTERVENTION EFFECTIVE' : 'INCONCLUSIVE'}
            </div>
          </div>

          {/* Conclusion */}
          <div style={{
            fontSize: '13px',
            color: '#fff',
            lineHeight: 1.8,
            textAlign: 'center',
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px'
          }}>
            <strong style={{ color: UI_LIME }}>
              Community-led intervention measurably reduces<br/>
              systemic socio-economic burden.
            </strong>
          </div>

          <button
            onClick={() => setShowScorecard(false)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#fff',
              border: `2px solid ${UI_LIME}`,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              borderRadius: '4px',
              transition: 'all 0.3s'
            }}
          >
            CLOSE SCORECARD
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid #00e5ff',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#e0e0e0',
        maxWidth: '280px',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '11px',
          color: UI_CYAN,
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '10px'
        }}>
          LEGEND
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: '#ff0055', fontWeight: 700 }}>◼</span> Feral Agent (Infrastructural Phlegm)
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: UI_CYAN, fontWeight: 700 }}>⬢</span> CLT Intervention (stabilization zone)
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ color: '#1a1a1a', fontWeight: 700 }}>━</span> Highway Corridor (2.2x acceleration)
        </div>
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #2a2a2a', fontSize: '9px', lineHeight: 1.6 }}>
          ABM Rules: Baseline vulnerability + Highway vectoring + Neighbor contagion − CLT protection
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
