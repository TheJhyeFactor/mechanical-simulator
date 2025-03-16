// 3D Mechanical System Designer
// Educational physics simulator with Three.js

let scene, camera, renderer, controls;
let components = [];
let selectedComponent = null;
let raycaster, mouse;
let gridHelper, axesHelper;
let physicsEnabled = false;
let showForces = false;

// System state
let hammerComponent = null;
let searComponent = null;
let springComponent = null;
let triggerComponent = null;

const PHYSICS_CONFIG = {
    gravity: 9.81,
    springConstant: 500, // N/m (abstract)
    hammerMass: 0.05, // kg (abstract)
    friction: 0.3
};

// Component definitions with realistic geometries
class MechanicalComponent {
    constructor(type, position = {x: 0, y: 0, z: 0}) {
        this.type = type;
        this.mesh = null;
        this.state = 'at_rest';
        this.velocity = {x: 0, y: 0, z: 0};
        this.angularVelocity = 0;
        this.mass = 0.01;
        this.rotation = 0;
        this.createMesh(position);
    }

    createMesh(position) {
        let geometry, material;

        switch(this.type) {
            case 'hammer':
                this.createHammer(position);
                break;
            case 'sear':
                this.createSear(position);
                break;
            case 'spring':
                this.createSpring(position);
                break;
            case 'trigger':
                this.createTrigger(position);
                break;
            case 'pin':
                this.createPin(position);
                break;
            case 'block':
                this.createBlock(position);
                break;
        }
    }

    createHammer(position) {
        // Create hammer with realistic geometry
        const group = new THREE.Group();

        // Hammer body
        const bodyGeom = new THREE.BoxGeometry(0.8, 0.15, 0.15);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4a5568,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(0.4, 0, 0);
        group.add(body);

        // Hammer striking surface
        const strikeGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const strike = new THREE.Mesh(strikeGeom, bodyMat);
        strike.position.set(0.9, 0, 0);
        group.add(strike);

        // Pivot hole
        const pivotGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16);
        const pivotMat = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
        const pivot = new THREE.Mesh(pivotGeom, pivotMat);
        pivot.rotation.z = Math.PI / 2;
        group.add(pivot);

        // Sear notch
        const notchGeom = new THREE.BoxGeometry(0.15, 0.08, 0.15);
        const notch = new THREE.Mesh(notchGeom, new THREE.MeshStandardMaterial({ color: 0x3498db }));
        notch.position.set(-0.3, -0.1, 0);
        group.add(notch);

        group.position.set(position.x, position.y, position.z);
        this.mesh = group;
        this.mass = 0.05;
        scene.add(group);
    }

    createSear(position) {
        const group = new THREE.Group();

        // Sear body
        const bodyGeom = new THREE.BoxGeometry(0.4, 0.15, 0.12);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2ecc71,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);

        // Engagement hook
        const hookGeom = new THREE.BoxGeometry(0.1, 0.15, 0.12);
        const hook = new THREE.Mesh(hookGeom, bodyMat);
        hook.position.set(0.2, 0.08, 0);
        group.add(hook);

        // Pivot
        const pivotGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 16);
        const pivot = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x1a202c }));
        pivot.rotation.z = Math.PI / 2;
        group.add(pivot);

        group.position.set(position.x, position.y, position.z);
        this.mesh = group;
        this.mass = 0.02;
        scene.add(group);
    }

    createSpring(position) {
        const group = new THREE.Group();

        // Spring coils
        const coilCurve = new THREE.CatmullRomCurve3([]);
        for (let i = 0; i < 20; i++) {
            const angle = i * Math.PI / 3;
            const radius = 0.08;
            const x = i * 0.03;
            const y = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            coilCurve.points.push(new THREE.Vector3(x, y, z));
        }

        const tubeGeom = new THREE.TubeGeometry(coilCurve, 64, 0.015, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            metalness: 0.6,
            roughness: 0.4
        });
        const coil = new THREE.Mesh(tubeGeom, tubeMat);
        group.add(coil);

        // End caps
        const capGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

        const cap1 = new THREE.Mesh(capGeom, capMat);
        cap1.rotation.z = Math.PI / 2;
        cap1.position.set(0, 0, 0);
        group.add(cap1);

        const cap2 = new THREE.Mesh(capGeom, capMat);
        cap2.rotation.z = Math.PI / 2;
        cap2.position.set(0.57, 0, 0);
        group.add(cap2);

        group.position.set(position.x, position.y, position.z);
        this.mesh = group;
        this.mass = 0.008;
        scene.add(group);
    }

    createTrigger(position) {
        const group = new THREE.Group();

        // Trigger lever
        const leverGeom = new THREE.BoxGeometry(0.5, 0.1, 0.15);
        const leverMat = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            metalness: 0.5,
            roughness: 0.5
        });
        const lever = new THREE.Mesh(leverGeom, leverMat);
        lever.position.set(0.25, 0, 0);
        group.add(lever);

        // Trigger face
        const faceGeom = new THREE.BoxGeometry(0.15, 0.25, 0.15);
        const face = new THREE.Mesh(faceGeom, leverMat);
        face.position.set(0.6, -0.12, 0);
        group.add(face);

        // Pivot
        const pivotGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 16);
        const pivot = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x1a202c }));
        pivot.rotation.z = Math.PI / 2;
        group.add(pivot);

        group.position.set(position.x, position.y, position.z);
        this.mesh = group;
        this.mass = 0.015;
        scene.add(group);
    }

    createPin(position) {
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            metalness: 0.9,
            roughness: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.mesh.rotation.z = Math.PI / 2;
        this.mass = 0.005;
        scene.add(this.mesh);
    }

    createBlock(position) {
        const geometry = new THREE.BoxGeometry(1.0, 0.6, 0.4);
        const material = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            metalness: 0.3,
            roughness: 0.7
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        this.mass = 0.1;
        scene.add(this.mesh);
    }

    highlight(enabled) {
        if (!this.mesh) return;

        if (enabled) {
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.emissive = new THREE.Color(0x3498db);
                    child.material.emissiveIntensity = 0.5;
                }
            });
        } else {
            this.mesh.traverse(child => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }
    }

    remove() {
        if (this.mesh) {
            scene.remove(this.mesh);
        }
    }
}

// Initialize Three.js scene
function init() {
    const viewport = document.getElementById('viewport');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);
    scene.fog = new THREE.Fog(0x0a0e14, 10, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        viewport.clientWidth / viewport.clientHeight,
        0.1,
        1000
    );
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 20;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x3498db, 0.3);
    pointLight.position.set(-3, 3, -3);
    scene.add(pointLight);

    // Grid and axes
    gridHelper = new THREE.GridHelper(10, 20, 0x2d3742, 0x1c2229);
    scene.add(gridHelper);

    axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Raycaster for picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event listeners
    setupEventListeners();

    // Start animation loop
    animate();

    updateUI();
}

function setupEventListeners() {
    // Component library
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            addComponent(type);
        });
    });

    // Canvas interactions
    renderer.domElement.addEventListener('click', onCanvasClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Control buttons
    document.getElementById('cock-hammer').addEventListener('click', cockHammer);
    document.getElementById('pull-trigger').addEventListener('click', releaseSear);
    document.getElementById('run-simulation').addEventListener('click', runSimulation);
    document.getElementById('show-forces').addEventListener('click', toggleForces);

    // Camera views
    document.getElementById('view-front').addEventListener('click', () => setCameraView('front'));
    document.getElementById('view-side').addEventListener('click', () => setCameraView('side'));
    document.getElementById('view-top').addEventListener('click', () => setCameraView('top'));
    document.getElementById('view-iso').addEventListener('click', () => setCameraView('iso'));

    // Utility
    document.getElementById('clear-workspace').addEventListener('click', clearWorkspace);
    document.getElementById('reset-states').addEventListener('click', resetSystem);
    document.getElementById('load-example').addEventListener('click', loadExampleSystem);

    // Keyboard
    document.addEventListener('keydown', onKeyDown);

    // Resize
    window.addEventListener('resize', onWindowResize);
}

function addComponent(type) {
    const position = {
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 2,
        z: (Math.random() - 0.5) * 2
    };

    const component = new MechanicalComponent(type, position);
    components.push(component);

    // Store references to key components
    if (type === 'hammer' && !hammerComponent) {
        hammerComponent = component;
    } else if (type === 'sear' && !searComponent) {
        searComponent = component;
    } else if (type === 'spring' && !springComponent) {
        springComponent = component;
    } else if (type === 'trigger' && !triggerComponent) {
        triggerComponent = component;
    }

    updateUI();
    updateStatus('idle', `Added ${type} component`);
}

function onCanvasClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes = components.map(c => c.mesh).filter(m => m);
    const intersects = raycaster.intersectObjects(meshes, true);

    if (selectedComponent) {
        selectedComponent.highlight(false);
        selectedComponent = null;
    }

    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;

        // Find which component was clicked
        for (let comp of components) {
            if (comp.mesh === clickedMesh || comp.mesh.children.includes(clickedMesh) || clickedMesh.parent === comp.mesh) {
                selectedComponent = comp;
                comp.highlight(true);
                updateSelectedComponentInfo(comp);
                break;
            }
        }
    } else {
        document.getElementById('selected-component').textContent = 'None';
        document.getElementById('prop-pos').textContent = '-';
        document.getElementById('prop-rot').textContent = '-';
        document.getElementById('prop-mass').textContent = '-';
    }
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onKeyDown(event) {
    if (event.key === 'Delete' && selectedComponent) {
        removeComponent(selectedComponent);
    }
}

function removeComponent(component) {
    component.remove();
    components = components.filter(c => c !== component);

    if (component === hammerComponent) hammerComponent = null;
    if (component === searComponent) searComponent = null;
    if (component === springComponent) springComponent = null;
    if (component === triggerComponent) triggerComponent = null;

    selectedComponent = null;
    updateUI();
}

function updateSelectedComponentInfo(comp) {
    document.getElementById('selected-component').textContent = comp.type.toUpperCase();
    document.getElementById('prop-pos').textContent =
        `${comp.mesh.position.x.toFixed(2)}, ${comp.mesh.position.y.toFixed(2)}, ${comp.mesh.position.z.toFixed(2)}`;
    document.getElementById('prop-rot').textContent =
        `${(comp.mesh.rotation.x * 180 / Math.PI).toFixed(1)}°, ${(comp.mesh.rotation.y * 180 / Math.PI).toFixed(1)}°, ${(comp.mesh.rotation.z * 180 / Math.PI).toFixed(1)}°`;
    document.getElementById('prop-mass').textContent = `${(comp.mass * 1000).toFixed(1)} g`;
}

// Mechanical Actions
function cockHammer() {
    if (!hammerComponent) {
        updateStatus('error', 'No hammer component found');
        return;
    }

    updateStatus('active', 'Cocking hammer...');

    // Animate hammer rotation
    const targetRotation = -Math.PI / 3; // 60 degrees back
    animateRotation(hammerComponent.mesh, targetRotation, 'z', 800);

    hammerComponent.state = 'cocked';
    document.getElementById('hammer-state').textContent = 'cocked';

    // Calculate spring compression
    if (springComponent) {
        const compression = Math.abs(targetRotation) * 50; // Abstract calculation
        updateStressBar('spring-stress', compression);
        updateForceValue('spring-force', PHYSICS_CONFIG.springConstant * 0.1);
        springComponent.state = 'compressed';
        document.getElementById('spring-state').textContent = 'compressed';
    }

    // Check sear engagement
    if (searComponent) {
        setTimeout(() => {
            searComponent.state = 'engaged';
            document.getElementById('sear-state').textContent = 'engaged';
            updateStressBar('sear-stress', 75);
            updateStatus('idle', 'Hammer cocked and engaged');
        }, 850);
    }
}

function releaseSear() {
    if (!hammerComponent || hammerComponent.state !== 'cocked') {
        updateStatus('error', 'Hammer not cocked');
        return;
    }

    if (!searComponent || searComponent.state !== 'engaged') {
        updateStatus('error', 'Sear not engaged');
        return;
    }

    updateStatus('active', 'Releasing sear...');

    // Disengage sear
    animateRotation(searComponent.mesh, -Math.PI / 8, 'z', 200);
    searComponent.state = 'disengaged';
    document.getElementById('sear-state').textContent = 'disengaged';
    updateStressBar('sear-stress', 0);

    // Release hammer
    setTimeout(() => {
        hammerComponent.state = 'falling';
        document.getElementById('hammer-state').textContent = 'falling';

        // Calculate impact physics
        const springEnergy = 0.5 * PHYSICS_CONFIG.springConstant * Math.pow(0.1, 2);
        const velocity = Math.sqrt(2 * springEnergy / hammerComponent.mass);
        const impactEnergy = 0.5 * hammerComponent.mass * Math.pow(velocity, 2);

        updateForceValue('hammer-velocity', velocity);
        updateForceValue('impact-energy', impactEnergy);
        updateForceValue('contact-force', impactEnergy * 10);

        // Animate hammer fall
        animateRotation(hammerComponent.mesh, 0, 'z', 300, () => {
            hammerComponent.state = 'at_rest';
            document.getElementById('hammer-state').textContent = 'fired';
            updateStatus('idle', 'Hammer released');

            // Reset spring
            if (springComponent) {
                springComponent.state = 'relaxed';
                document.getElementById('spring-state').textContent = 'relaxed';
                updateStressBar('spring-stress', 0);
                updateForceValue('spring-force', 0);
            }
        });
    }, 250);
}

function runSimulation() {
    updateStatus('active', 'Running physics simulation...');
    document.getElementById('physics-status').textContent = 'Physics: Running';
    physicsEnabled = true;

    // Run failure analysis
    setTimeout(() => {
        analyzeFailurePoints();
        physicsEnabled = false;
        document.getElementById('physics-status').textContent = 'Physics: Complete';
        updateStatus('idle', 'Simulation complete');
    }, 2000);
}

function analyzeFailurePoints() {
    const failures = [];

    if (hammerComponent && hammerComponent.state === 'cocked') {
        const stress = Math.abs(hammerComponent.mesh.rotation.z) * 100;
        if (stress > 50) {
            failures.push({
                component: 'Hammer',
                reason: 'Excessive rotation stress on pivot',
                severity: stress > 80 ? 'CRITICAL' : 'HIGH'
            });
        }
    }

    if (searComponent && searComponent.state === 'engaged') {
        failures.push({
            component: 'Sear',
            reason: 'High contact pressure at engagement surface',
            severity: 'MEDIUM'
        });
    }

    if (springComponent && springComponent.state === 'compressed') {
        failures.push({
            component: 'Spring',
            reason: 'Material fatigue from repeated compression',
            severity: 'LOW'
        });
    }

    if (!hammerComponent || !searComponent) {
        failures.push({
            component: 'System',
            reason: 'Missing critical components for operation',
            severity: 'CRITICAL'
        });
    }

    displayFailurePoints(failures);
}

function displayFailurePoints(failures) {
    const container = document.querySelector('.failure-list');

    if (failures.length === 0) {
        container.innerHTML = '<em style="color: #2ecc71;">No critical failures detected</em>';
        return;
    }

    container.innerHTML = failures.map(f => `
        <div style="margin-bottom: 10px; padding: 10px; background: var(--bg-primary); border-radius: 4px; border-left: 3px solid ${
            f.severity === 'CRITICAL' ? '#e74c3c' : f.severity === 'HIGH' ? '#f39c12' : f.severity === 'MEDIUM' ? '#3498db' : '#2ecc71'
        };">
            <div style="font-weight: 700; color: ${
                f.severity === 'CRITICAL' ? '#e74c3c' : f.severity === 'HIGH' ? '#f39c12' : f.severity === 'MEDIUM' ? '#3498db' : '#2ecc71'
            }; margin-bottom: 4px;">${f.severity}</div>
            <div style="font-size: 0.9em; font-weight: 600;">${f.component}</div>
            <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 4px;">${f.reason}</div>
        </div>
    `).join('');
}

function toggleForces() {
    showForces = !showForces;
    const btn = document.getElementById('show-forces');
    btn.textContent = showForces ? 'Hide Forces' : 'Show Forces';

    if (showForces) {
        // Add force vector visualizations
        updateStatus('idle', 'Force vectors enabled');
    } else {
        updateStatus('idle', 'Force vectors disabled');
    }
}

function setCameraView(view) {
    const distance = 3;

    switch(view) {
        case 'front':
            camera.position.set(0, 1, distance);
            break;
        case 'side':
            camera.position.set(distance, 1, 0);
            break;
        case 'top':
            camera.position.set(0, distance, 0);
            break;
        case 'iso':
            camera.position.set(distance, distance * 0.7, distance);
            break;
    }

    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

function clearWorkspace() {
    if (confirm('Clear all components?')) {
        components.forEach(c => c.remove());
        components = [];
        hammerComponent = null;
        searComponent = null;
        springComponent = null;
        triggerComponent = null;
        selectedComponent = null;
        updateUI();
        resetForces();
        updateStatus('idle', 'Workspace cleared');
    }
}

function resetSystem() {
    components.forEach(comp => {
        comp.state = 'at_rest';
        if (comp.mesh) {
            comp.mesh.rotation.set(0, 0, 0);
        }
    });

    document.getElementById('hammer-state').textContent = 'at_rest';
    document.getElementById('sear-state').textContent = 'disengaged';
    document.getElementById('spring-state').textContent = 'relaxed';

    resetForces();
    updateStatus('idle', 'System reset');
}

function loadExampleSystem() {
    clearWorkspace();

    // Create example hammer system
    hammerComponent = new MechanicalComponent('hammer', {x: 0, y: 0.5, z: 0});
    components.push(hammerComponent);

    searComponent = new MechanicalComponent('sear', {x: -0.5, y: 0.2, z: 0});
    components.push(searComponent);

    springComponent = new MechanicalComponent('spring', {x: -0.3, y: 0.7, z: 0});
    components.push(springComponent);

    triggerComponent = new MechanicalComponent('trigger', {x: -0.6, y: -0.3, z: 0});
    components.push(triggerComponent);

    const pin1 = new MechanicalComponent('pin', {x: 0, y: 0.5, z: 0});
    components.push(pin1);

    const pin2 = new MechanicalComponent('pin', {x: -0.5, y: 0.2, z: 0});
    components.push(pin2);

    const block = new MechanicalComponent('block', {x: 0, y: -0.3, z: 0});
    components.push(block);

    updateUI();
    updateStatus('idle', 'Example system loaded');
}

// Utility Functions
function animateRotation(mesh, targetAngle, axis, duration, callback) {
    const startAngle = mesh.rotation[axis];
    const startTime = Date.now();

    function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        mesh.rotation[axis] = startAngle + (targetAngle - startAngle) * eased;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else if (callback) {
            callback();
        }
    }

    step();
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function updateStressBar(id, value) {
    const bar = document.getElementById(id);
    const valueDisplay = bar.parentElement.nextElementSibling;

    if (bar) {
        bar.style.width = `${Math.min(value, 100)}%`;
        valueDisplay.textContent = `${Math.round(value)}%`;
    }
}

function updateForceValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;

    if (id === 'spring-force' || id === 'contact-force') {
        element.textContent = `${value.toFixed(1)} N`;
    } else if (id === 'hammer-velocity') {
        element.textContent = `${value.toFixed(2)} m/s`;
    } else if (id === 'impact-energy') {
        element.textContent = `${value.toFixed(3)} J`;
    }
}

function resetForces() {
    updateForceValue('spring-force', 0);
    updateForceValue('hammer-velocity', 0);
    updateForceValue('impact-energy', 0);
    updateForceValue('contact-force', 0);

    updateStressBar('spring-stress', 0);
    updateStressBar('sear-stress', 0);
    updateStressBar('pin-stress', 0);
    updateStressBar('frame-stress', 0);
}

function updateUI() {
    document.getElementById('component-count').textContent = `Components: ${components.length}`;
}

function updateStatus(type, message) {
    const statusEl = document.getElementById('system-status');
    const textEl = document.getElementById('status-text');
    const dotEl = statusEl.querySelector('.status-dot');

    dotEl.className = `status-dot ${type}`;
    textEl.textContent = message;
}

function onWindowResize() {
    const viewport = document.getElementById('viewport');
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // Physics update
    if (physicsEnabled) {
        // Update physics simulation
    }

    renderer.render(scene, camera);
}

// Start when page loads
window.addEventListener('DOMContentLoaded', init);
