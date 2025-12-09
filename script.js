let CITY_MESHES = [];
let SECONDARY_MESHES = [];
let ISOCHRONE_SPEARS = [];
let lastPointer = { x: 0, y: 0 };

document.addEventListener('DOMContentLoaded', () => {
    // 3D tactical background for hero section (if THREE is available globally)
    initTacticalScene();
    // Floating UI shapes inspired by reference artwork
    initFloatingShapes();
    initSecondaryInterventionScene();
    initIsochroneScene();
});

function initTacticalScene() {
    if (typeof THREE === 'undefined') return;

    const container = document.querySelector('.tactical-3d-container');
    if (!container) return;

    const width = container.clientWidth || container.offsetWidth || 800;
    const height = container.clientHeight || container.offsetHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.015);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 200);
    camera.position.set(0, 28, 40);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Ground grid as abstract Bronx street layout
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.45 });
    const gridSize = 40;
    const gridDivisions = 20;
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x64748b, 0x94a3b8);
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    grid.position.y = -0.5;
    scene.add(grid);

    // Highway strip
    const roadGeo = new THREE.PlaneGeometry(4, gridSize * 1.3);
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.95 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.49, 0);
    scene.add(road);

    // Feral Agent "hot zones" as glowing extruded blocks along highway
    const hotspots = [];
    const hotspotGeo = new THREE.BoxGeometry(1.4, 0.6, 1.4);
    const hotspotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const hotspotPositions = [-14, -9, -4, 1, 6, 11, 16];
    hotspotPositions.forEach((z, idx) => {
        const mesh = new THREE.Mesh(hotspotGeo, hotspotMat.clone());
        mesh.position.set(
            (Math.random() - 0.5) * 8,
            0.3 + Math.random() * 0.6,
            z + (Math.random() - 0.5) * 1.5
        );
        mesh.material.color.setHex(0xff1f7d);
        mesh.material.transparent = true;
        mesh.material.opacity = 0.85;
        hotspots.push(mesh);
        scene.add(mesh);
    });

    // Low skyline as extruded census tracts
    const blockGeo = new THREE.BoxGeometry(1.2, 1, 1.2);
    const blockMat = new THREE.MeshLambertMaterial({ color: 0x0f172a, emissive: 0x0b1120 });
    for (let x = -8; x <= 8; x += 2) {
        for (let z = -18; z <= 18; z += 2) {
            if (Math.abs(z) < 3) continue; // leave highway corridor
            if (Math.random() > 0.55) continue;
            const h = 0.5 + Math.random() * 4;
            const mesh = new THREE.Mesh(blockGeo, blockMat);
            mesh.scale.y = h;
            mesh.position.set(x + (Math.random() - 0.5) * 0.7, h * 0.5, z + (Math.random() - 0.5) * 0.7);
            scene.add(mesh);
        }
    }

    // Lights
    const ambient = new THREE.AmbientLight(0x94a3b8, 0.9);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight.position.set(10, 25, 15);
    scene.add(dirLight);

    // Load granular city-type layer from GeoJSON
    loadCityTypeLayer(scene);

    // Raycasting for interactive city layer
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const infoEl = document.getElementById('city-info');

    function handlePointerMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.set(x, y);
        lastPointer.x = event.clientX;
        lastPointer.y = event.clientY;
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    let hoveredMesh = null;

    // Animation loop
    let startTime = performance.now();
    function animate(now) {
        const t = (now - startTime) / 1000;

        // Gentle orbit of camera
        const radius = 42;
        const ang = 0.25 + t * 0.08;
        camera.position.x = Math.cos(ang) * radius;
        camera.position.z = Math.sin(ang) * radius;
        camera.position.y = 26 + Math.sin(t * 0.35) * 2;
        camera.lookAt(0, 0, 0);

        // Pulse hotspots
        hotspots.forEach((h, i) => {
            const phase = t * 2 + i * 0.6;
            const scaleY = 0.8 + Math.sin(phase) * 0.5;
            h.scale.y = 1.1 + scaleY;
            h.position.y = h.scale.y * 0.5;
            const intensity = 0.7 + 0.3 * (Math.sin(phase) * 0.5 + 0.5);
            h.material.opacity = intensity;
        });

        // City layer hover detection
        if (CITY_MESHES.length) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(CITY_MESHES, false);
            const hit = intersects.length ? intersects[0].object : null;

            if (hit !== hoveredMesh) {
                if (hoveredMesh && hoveredMesh.material && hoveredMesh.userData.baseEmissive) {
                    hoveredMesh.material.emissive.setHex(hoveredMesh.userData.baseEmissive);
                    hoveredMesh.material.opacity = hoveredMesh.userData.baseOpacity;
                }
                hoveredMesh = hit;

                if (hoveredMesh && hoveredMesh.material) {
                    hoveredMesh.material.emissive.setHex(0xffffff);
                    hoveredMesh.material.opacity = 1;
                    updateCityInfo(infoEl, hoveredMesh.userData.props || {});
                } else {
                    updateCityInfo(infoEl, null);
                }
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // Handle resize
    window.addEventListener('resize', () => {
        const w = container.clientWidth || container.offsetWidth || width;
        const h = container.clientHeight || container.offsetHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

function initIsochroneScene() {
    if (typeof THREE === 'undefined') return;

    const container = document.querySelector('.isochrone-3d-container');
    if (!container) return;

    const width = container.clientWidth || container.offsetWidth || 800;
    const height = container.clientHeight || container.offsetHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.018);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 300);
    camera.position.set(0, 55, 55);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x94a3b8, 1.0);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(18, 40, 24);
    scene.add(dirLight);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const infoEl = document.getElementById('city-info');
    let hoveredMesh = null;

    function handlePointerMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.set(x, y);
        lastPointer.x = event.clientX;
        lastPointer.y = event.clientY;
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    let radius = 46;
    let targetRadius = 46;

    function handleWheel(event) {
        event.preventDefault();
        const delta = event.deltaY;
        if (delta > 0) {
            targetRadius = Math.min(110, targetRadius + 4);
        } else if (delta < 0) {
            targetRadius = Math.max(22, targetRadius - 4);
        }
    }

    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    loadIsochroneSpears(scene);

    let startTime = performance.now();
    function animate(now) {
        const t = (now - startTime) / 1000;

        radius += (targetRadius - radius) * 0.08;
        const ang = 0.3 + t * 0.035;
        camera.position.x = Math.cos(ang) * radius;
        camera.position.z = Math.sin(ang) * radius;
        camera.position.y = 40 + Math.sin(t * 0.4) * 2;
        camera.lookAt(0, 0, 0);

        if (ISOCHRONE_SPEARS.length) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(ISOCHRONE_SPEARS, false);
            const hit = intersects.length ? intersects[0].object : null;

            if (hit !== hoveredMesh) {
                if (hoveredMesh && hoveredMesh.material && hoveredMesh.userData.baseEmissive != null) {
                    hoveredMesh.material.emissive.setHex(hoveredMesh.userData.baseEmissive);
                    hoveredMesh.material.opacity = hoveredMesh.userData.baseOpacity;
                }
                hoveredMesh = hit;

                if (hoveredMesh && hoveredMesh.material) {
                    hoveredMesh.material.emissive.setHex(0xffffff);
                    hoveredMesh.material.opacity = 1;
                    updateIsochroneInfo(infoEl, hoveredMesh.userData.props || {});
                } else {
                    updateIsochroneInfo(infoEl, null);
                }
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
        const w = container.clientWidth || container.offsetWidth || width;
        const h = container.clientHeight || container.offsetHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

function loadIsochroneSpears(scene) {
    fetch('5min_isochrone.geojson')
        .then((res) => res.json())
        .then((geojson) => {
            const features = geojson.features || [];
            if (!features.length) return;

            let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
            features.forEach((f) => {
                const c = f.properties && Array.isArray(f.properties.center) ? f.properties.center : null;
                if (!c) return;
                const lon = c[0];
                const lat = c[1];
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            });

            if (!isFinite(minLon) || !isFinite(maxLon) || !isFinite(minLat) || !isFinite(maxLat)) return;

            const centerLon = (minLon + maxLon) / 2;
            const centerLat = (minLat + maxLat) / 2;
            const scale = 1200;

            const project = (lon, lat) => {
                return {
                    x: (lon - centerLon) * scale,
                    z: (lat - centerLat) * scale,
                };
            };

            const group = new THREE.Group();
            group.position.y = 0.05;
            scene.add(group);

            features.forEach((f) => {
                const props = f.properties || {};
                const c = Array.isArray(props.center) ? props.center : null;
                if (!c) return;
                const lon = c[0];
                const lat = c[1];

                const asthma = typeof props.Asthma_I_R_mean_count === 'number' ? props.Asthma_I_R_mean_count : 0;
                const cvi = typeof props.CVI_mean_count === 'number' ? props.CVI_mean_count : 0;

                const asthmaNorm = Math.max(0, Math.min(1, asthma / 4));
                const cviNorm = Math.max(0, Math.min(1, cvi / 4));

                const height = 0.6 + asthmaNorm * 2.4;
                const radius = 0.18 + cviNorm * 0.25;

                const color = new THREE.Color().setHSL(0.0 + asthmaNorm * 0.06, 0.9, 0.55);
                const emissive = new THREE.Color().setHSL(0.95 - cviNorm * 0.4, 0.8, 0.3);

                const { x, z } = project(lon, lat);

                const geometry = new THREE.CylinderGeometry(radius, radius, height, 16, 1, false);
                const material = new THREE.MeshStandardMaterial({
                    color,
                    emissive,
                    metalness: 0.45,
                    roughness: 0.4,
                    transparent: true,
                    opacity: 0.97,
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, height / 2, z);
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                mesh.userData = {
                    props,
                    baseEmissive: emissive.getHex(),
                    baseOpacity: material.opacity,
                };

                group.add(mesh);
                ISOCHRONE_SPEARS.push(mesh);
            });
        })
        .catch((err) => {
            console.error('Failed to load 5min_isochrone.geojson', err);
        });
}

function loadCityTypeLayer(scene) {
    fetch('City_Type.geojson')
        .then((res) => res.json())
        .then((geojson) => {
            const features = geojson.features || [];
            if (!features.length) return;

            // Compute geographic bounds
            let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
            features.forEach((f) => {
                const geom = f.geometry;
                if (!geom || geom.type !== 'MultiPolygon') return;
                geom.coordinates.forEach((poly) => {
                    poly.forEach((ring) => {
                        ring.forEach(([lon, lat]) => {
                            if (lon < minLon) minLon = lon;
                            if (lon > maxLon) maxLon = lon;
                            if (lat < minLat) minLat = lat;
                            if (lat > maxLat) maxLat = lat;
                        });
                    });
                });
            });

            const centerLon = (minLon + maxLon) / 2;
            const centerLat = (minLat + maxLat) / 2;
            const scale = 1200; // degrees → scene units

            const project = (lon, lat) => {
                return {
                    x: (lon - centerLon) * scale,
                    z: (lat - centerLat) * scale,
                };
            };

            const cityGroup = new THREE.Group();
            cityGroup.position.y = 0.05;
            scene.add(cityGroup);

            features.forEach((f) => {
                const geom = f.geometry;
                if (!geom || geom.type !== 'MultiPolygon') return;
                const cityType = (f.properties && f.properties.City_Type) || 'Unknown';

                let color = 0x38bdf8;
                let emissive = 0x000000;
                let height = 0.4;

                if (cityType === 'Green City') {
                    color = 0x22c55e;
                    emissive = 0x16a34a;
                    height = 0.2;
                } else if (cityType === 'Human City') {
                    color = 0xf97316;
                    emissive = 0xc2410c;
                    height = 0.5;
                } else if (cityType === 'Gray City') {
                    color = 0x6b7280;
                    emissive = 0x4b5563;
                    height = 0.25;
                } else if (cityType === 'Feral City') {
                    color = 0xdb2777;
                    emissive = 0xbe185d;
                    height = 0.9;
                }

                geom.coordinates.forEach((poly) => {
                    if (!poly.length) return;
                    const [outer, ...holes] = poly;
                    if (!outer || !outer.length) return;

                    const shape = new THREE.Shape();
                    outer.forEach(([lon, lat], idx) => {
                        const { x, z } = project(lon, lat);
                        if (idx === 0) shape.moveTo(x, z);
                        else shape.lineTo(x, z);
                    });

                    holes.forEach((ring) => {
                        if (!ring.length) return;
                        const path = new THREE.Path();
                        ring.forEach(([lon, lat], idx) => {
                            const { x, z } = project(lon, lat);
                            if (idx === 0) path.moveTo(x, z);
                            else path.lineTo(x, z);
                        });
                        shape.holes.push(path);
                    });

                    const extrudeSettings = {
                        depth: height,
                        bevelEnabled: false,
                    };

                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    geometry.computeVertexNormals();

                    const material = new THREE.MeshStandardMaterial({
                        color,
                        emissive,
                        metalness: 0.25,
                        roughness: 0.45,
                        transparent: true,
                        opacity: 0.9,
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.castShadow = false;
                    mesh.receiveShadow = false;
                    mesh.userData = {
                        props: f.properties || {},
                        baseEmissive: emissive,
                        baseOpacity: material.opacity,
                    };
                    cityGroup.add(mesh);
                    CITY_MESHES.push(mesh);
                });
            });
        })
        .catch((err) => {
            console.error('Failed to load City_Type.geojson', err);
        });
}

function updateCityInfo(infoEl, props) {
    if (!infoEl) return;
    if (!props) {
        infoEl.classList.remove('visible');
        return;
    }

    const title = infoEl.querySelector('.city-info-title');
    const meta = infoEl.querySelector('.city-info-meta');
    if (title) {
        title.textContent = props.City_Type || 'City segment';
    }
    if (meta) {
        const lot = props.LotArea_sum != null ? props.LotArea_sum.toLocaleString() : '—';
        const shapeArea = props.Shape_Area_sum != null ? props.Shape_Area_sum.toLocaleString() : '—';
        meta.textContent = `Lots: ${lot} · Shape area: ${shapeArea}`;
    }

    infoEl.style.left = `${lastPointer.x + 16}px`;
    infoEl.style.top = `${lastPointer.y + 16}px`;
    infoEl.classList.add('visible');
}

function updateIsochroneInfo(infoEl, props) {
    if (!infoEl) return;
    if (!props) {
        infoEl.classList.remove('visible');
        return;
    }

    const title = infoEl.querySelector('.city-info-title');
    const meta = infoEl.querySelector('.city-info-meta');
    if (title) {
        const name = props.name311 || props.signname || 'Access point';
        const borough = props.borough || '';
        title.textContent = borough ? `${name} · ${borough}` : name;
    }
    if (meta) {
        const asthma = props.Asthma_I_R_mean_count != null ? props.Asthma_I_R_mean_count : '—';
        const cvi = props.CVI_mean_count != null ? props.CVI_mean_count : '—';
        const minutes = props.isochrone_minutes != null ? props.isochrone_minutes : 5;
        meta.textContent = `Isochrone: ${minutes} min · Asthma idx count: ${asthma} · CVI count: ${cvi}`;
    }

    infoEl.style.left = `${lastPointer.x + 16}px`;
    infoEl.style.top = `${lastPointer.y + 16}px`;
    infoEl.classList.add('visible');
}

function updateSecondaryInfo(infoEl, props) {
    if (!infoEl) return;
    if (!props) {
        infoEl.classList.remove('visible');
        return;
    }

    const title = infoEl.querySelector('.city-info-title');
    const meta = infoEl.querySelector('.city-info-meta');
    if (title) {
        title.textContent = props.ZONEDIST || 'Residential zone';
    }
    if (meta) {
        const cvi = props.CVI_mean != null ? props.CVI_mean.toFixed(2) : '—';
        const asthma = props.Asthma_I_R_mean_mean_majority != null
            ? props.Asthma_I_R_mean_mean_majority.toFixed(1)
            : '—';
        meta.textContent = `CVI: ${cvi} · Asthma index: ${asthma}`;
    }

    infoEl.style.left = `${lastPointer.x + 16}px`;
    infoEl.style.top = `${lastPointer.y + 16}px`;
    infoEl.classList.add('visible');
}

function initFloatingShapes() {
    const layer = document.getElementById('floating-layer');
    if (!layer) return;

    const total = 22;
    const shapeTypes = ['shape-shard', 'shape-ribbon', 'shape-petal', 'shape-bit'];

    for (let i = 0; i < total; i++) {
        const el = document.createElement('div');
        el.classList.add('floating-shape');

        const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        el.classList.add(type);

        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 40 - 20);
        const rot = (Math.random() * 60 - 30) + 'deg';
        const duration = 20 + Math.random() * 20; // 20–40s
        const delay = -Math.random() * duration;  // negative for staggered start

        el.style.setProperty('--fx-start-x', startX + 'vw');
        el.style.setProperty('--fx-end-x', endX + 'vw');
        el.style.setProperty('--fx-rot', rot);
        el.style.animationDuration = duration + 's';
        el.style.animationDelay = delay + 's';

        layer.appendChild(el);
    }
}

function initSecondaryInterventionScene() {
    if (typeof THREE === 'undefined') return;

    const container = document.querySelector('.granular-3d-container');
    if (!container) return;

    const width = container.clientWidth || container.offsetWidth || 800;
    const height = container.clientHeight || container.offsetHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.02);

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 200);
    camera.position.set(0, 40, 40);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x94a3b8, 1.0);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    loadSecondaryInterventionLayer(scene);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const infoEl = document.getElementById('city-info');
    let hoveredMesh = null;

    function handlePointerMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.set(x, y);
        lastPointer.x = event.clientX;
        lastPointer.y = event.clientY;
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);

    let radius = 38;
    let targetRadius = 38;

    function handleWheel(event) {
        event.preventDefault();
        const delta = event.deltaY;
        if (delta > 0) {
            targetRadius = Math.min(90, targetRadius + 4);
        } else if (delta < 0) {
            targetRadius = Math.max(18, targetRadius - 4);
        }
    }

    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    let startTime = performance.now();
    function animate(now) {
        const t = (now - startTime) / 1000;

        radius += (targetRadius - radius) * 0.08;
        const ang = 0.15 + t * 0.04;
        camera.position.x = Math.cos(ang) * radius;
        camera.position.z = Math.sin(ang) * radius;
        camera.position.y = 32 + Math.sin(t * 0.3) * 2;
        camera.lookAt(0, 0, 0);

        if (SECONDARY_MESHES.length) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(SECONDARY_MESHES, false);
            const hit = intersects.length ? intersects[0].object : null;

            if (hit !== hoveredMesh) {
                if (hoveredMesh && hoveredMesh.material && hoveredMesh.userData.baseEmissive != null) {
                    hoveredMesh.material.emissive.setHex(hoveredMesh.userData.baseEmissive);
                    hoveredMesh.material.opacity = hoveredMesh.userData.baseOpacity;
                }
                hoveredMesh = hit;

                if (hoveredMesh && hoveredMesh.material) {
                    hoveredMesh.material.emissive.setHex(0xffffff);
                    hoveredMesh.material.opacity = 1;
                    updateSecondaryInfo(infoEl, hoveredMesh.userData.props || {});
                } else {
                    updateSecondaryInfo(infoEl, null);
                }
            }
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
        const w = container.clientWidth || container.offsetWidth || width;
        const h = container.clientHeight || container.offsetHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

function loadSecondaryInterventionLayer(scene) {
    fetch('Secondary_Intervention_Residential_TRIVARIATE.geojson')
        .then((res) => res.json())
        .then((geojson) => {
            const features = geojson.features || [];
            if (!features.length) return;

            let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
            features.forEach((f) => {
                const geom = f.geometry;
                if (!geom || geom.type !== 'MultiPolygon') return;
                geom.coordinates.forEach((poly) => {
                    poly.forEach((ring) => {
                        ring.forEach(([lon, lat]) => {
                            if (lon < minLon) minLon = lon;
                            if (lon > maxLon) maxLon = lon;
                            if (lat < minLat) minLat = lat;
                            if (lat > maxLat) maxLat = lat;
                        });
                    });
                });
            });

            const centerLon = (minLon + maxLon) / 2;
            const centerLat = (minLat + maxLat) / 2;
            const scale = 1400;

            const project = (lon, lat) => {
                return {
                    x: (lon - centerLon) * scale,
                    z: (lat - centerLat) * scale,
                };
            };

            const group = new THREE.Group();
            group.position.y = 0.05;
            scene.add(group);

            features.forEach((f) => {
                const geom = f.geometry;
                if (!geom || geom.type !== 'MultiPolygon') return;

                const props = f.properties || {};
                const cvi = typeof props.CVI_mean === 'number' ? props.CVI_mean : 0;
                const norm = Math.max(0, Math.min(1, cvi / 3));

                const baseColor = new THREE.Color().setHSL(0.95 - norm * 0.4, 0.9, 0.55);
                const emissive = new THREE.Color().setHSL(0.95 - norm * 0.4, 0.8, 0.3);
                const height = 0.2 + norm * 1.1;

                geom.coordinates.forEach((poly) => {
                    if (!poly.length) return;
                    const [outer, ...holes] = poly;
                    if (!outer || !outer.length) return;

                    const shape = new THREE.Shape();
                    outer.forEach(([lon, lat], idx) => {
                        const { x, z } = project(lon, lat);
                        if (idx === 0) shape.moveTo(x, z);
                        else shape.lineTo(x, z);
                    });

                    holes.forEach((ring) => {
                        if (!ring.length) return;
                        const path = new THREE.Path();
                        ring.forEach(([lon, lat], idx) => {
                            const { x, z } = project(lon, lat);
                            if (idx === 0) path.moveTo(x, z);
                            else path.lineTo(x, z);
                        });
                        shape.holes.push(path);
                    });

                    const extrudeSettings = {
                        depth: height,
                        bevelEnabled: false,
                    };

                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    geometry.computeVertexNormals();

                    const material = new THREE.MeshStandardMaterial({
                        color: baseColor,
                        emissive: emissive,
                        metalness: 0.2,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0.95,
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.castShadow = false;
                    mesh.receiveShadow = false;
                    mesh.userData = {
                        props,
                        baseEmissive: emissive.getHex(),
                        baseOpacity: material.opacity,
                    };
                    group.add(mesh);
                    SECONDARY_MESHES.push(mesh);
                });
            });
        })
        .catch((err) => {
            console.error('Failed to load Secondary_Intervention_Residential_TRIVARIATE.geojson', err);
        });
}