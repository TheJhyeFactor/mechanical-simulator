// 3D Mechanical System Designer
// Educational physics simulator with realistic mechanical assemblies

let scene, camera, renderer, controls;
let components = [];
let selectedComponent = null;
let raycaster, mouse;
let currentSystem = null;
let animationFrameId = null;

// System configurations
const SYSTEMS = {
    shotgun: null,
    straightPull: null
};

// Component class with proper mechanical design
class MechanicalComponent {
    constructor(type, position = {x: 0, y: 0, z: 0}, rotation = {x: 0, y: 0, z: 0}) {
        this.type = type;
        this.mesh = null;
        this.state = 'at_rest';
        this.originalRotation = {...rotation};
        this.createMesh(position, rotation);
    }

    createMesh(position, rotation) {
        switch(this.type) {
            case 'shotgun-hammer':
                this.createShotgunHammer(position, rotation);
                break;
            case 'shotgun-sear':
                this.createShotgunSear(position, rotation);
                break;
            case 'shotgun-spring':
                this.createShotgunSpring(position, rotation);
                break;
            case 'shotgun-trigger':
                this.createShotgunTrigger(position, rotation);
                break;
            case 'shotgun-frame':
                this.createShotgunFrame(position, rotation);
                break;
            case 'bolt-body':
                this.createBoltBody(position, rotation);
                break;
            case 'bolt-hammer':
                this.createBoltHammer(position, rotation);
                break;
            case 'bolt-sear':
                this.createBoltSear(position, rotation);
                break;
            case 'bolt-spring':
                this.createBoltSpring(position, rotation);
                break;
            case 'bolt-trigger':
                this.createBoltTrigger(position, rotation);
                break;
            case 'bolt-frame':
                this.createBoltFrame(position, rotation);
                break;
        }
    }

    // SHOTGUN SYSTEM COMPONENTS
    createShotgunHammer(position, rotation) {
        const group = new THREE.Group();

        // Main hammer body - L-shaped
        const bodyGeom = new THREE.BoxGeometry(0.15, 0.6, 0.12);
        const hammerMat = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            metalness: 0.9,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeom, hammerMat);
        body.position.set(0, 0.3, 0);
        group.add(body);

        // Striker face (top of hammer)
        const strikerGeom = new THREE.BoxGeometry(0.18, 0.15, 0.12);
        const striker = new THREE.Mesh(strikerGeom, hammerMat);
        striker.position.set(0, 0.65, 0);
        group.add(striker);

        // Sear notch (engagement point)
        const notchGeom = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const notchMat = new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.8, roughness: 0.3 });
        const notch = new THREE.Mesh(notchGeom, notchMat);
        notch.position.set(-0.1, 0.15, 0);
        group.add(notch);

        // Pivot hole
        const pivotGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 16);
        const pivotMat = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.7, roughness: 0.5 });
        const pivot = new THREE.Mesh(pivotGeom, pivotMat);
        pivot.rotation.z = Math.PI / 2;
        pivot.position.set(0, 0, 0);
        group.add(pivot);

        // Hammer spring seat (bottom)
        const seatGeom = new THREE.BoxGeometry(0.12, 0.1, 0.12);
        const seat = new THREE.Mesh(seatGeom, hammerMat);
        seat.position.set(0, -0.05, 0);
        group.add(seat);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createShotgunSear(position, rotation) {
        const group = new THREE.Group();

        // Sear lever body
        const bodyGeom = new THREE.BoxGeometry(0.3, 0.1, 0.12);
        const searMat = new THREE.MeshStandardMaterial({
            color: 0x27ae60,
            metalness: 0.8,
            roughness: 0.25
        });
        const body = new THREE.Mesh(bodyGeom, searMat);
        group.add(body);

        // Engagement hook (catches hammer notch)
        const hookGeom = new THREE.BoxGeometry(0.08, 0.12, 0.12);
        const hook = new THREE.Mesh(hookGeom, new THREE.MeshStandardMaterial({ color: 0x2ecc71, metalness: 0.8, roughness: 0.3 }));
        hook.position.set(0.12, 0.1, 0);
        group.add(hook);

        // Pivot point
        const pivotGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 16);
        const pivot = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.7, roughness: 0.5 }));
        pivot.rotation.z = Math.PI / 2;
        pivot.position.set(-0.1, 0, 0);
        group.add(pivot);

        // Trigger connection point
        const connGeom = new THREE.BoxGeometry(0.06, 0.08, 0.08);
        const conn = new THREE.Mesh(connGeom, searMat);
        conn.position.set(-0.15, -0.08, 0);
        group.add(conn);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createShotgunSpring(position, rotation) {
        const group = new THREE.Group();

        // Coil spring visualization
        const curve = new THREE.CatmullRomCurve3([]);
        const numCoils = 15;
        const springLength = 0.4;
        const radius = 0.04;

        for (let i = 0; i <= numCoils * 4; i++) {
            const t = i / (numCoils * 4);
            const angle = i * Math.PI / 2;
            const y = t * springLength;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            curve.points.push(new THREE.Vector3(x, y, z));
        }

        const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.01, 8, false);
        const springMat = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            metalness: 0.6,
            roughness: 0.4
        });
        const coil = new THREE.Mesh(tubeGeom, springMat);
        group.add(coil);

        // End caps
        const capGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.8, roughness: 0.3 });

        const cap1 = new THREE.Mesh(capGeom, capMat);
        cap1.position.set(0, 0, 0);
        group.add(cap1);

        const cap2 = new THREE.Mesh(capGeom, capMat);
        cap2.position.set(0, springLength, 0);
        group.add(cap2);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createShotgunTrigger(position, rotation) {
        const group = new THREE.Group();

        // Trigger blade
        const bladeGeom = new THREE.BoxGeometry(0.08, 0.25, 0.15);
        const triggerMat = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            metalness: 0.6,
            roughness: 0.4
        });
        const blade = new THREE.Mesh(bladeGeom, triggerMat);
        blade.position.set(0, -0.15, 0);
        group.add(blade);

        // Trigger lever (connects to sear)
        const leverGeom = new THREE.BoxGeometry(0.3, 0.08, 0.12);
        const lever = new THREE.Mesh(leverGeom, triggerMat);
        lever.position.set(0.1, 0, 0);
        group.add(lever);

        // Pivot
        const pivotGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.18, 16);
        const pivot = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.7, roughness: 0.5 }));
        pivot.rotation.z = Math.PI / 2;
        group.add(pivot);

        // Sear connector
        const connGeom = new THREE.BoxGeometry(0.06, 0.1, 0.1);
        const conn = new THREE.Mesh(connGeom, triggerMat);
        conn.position.set(0.22, 0.05, 0);
        group.add(conn);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createShotgunFrame(position, rotation) {
        const group = new THREE.Group();

        // Main receiver block
        const receiverGeom = new THREE.BoxGeometry(0.8, 0.5, 0.3);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            metalness: 0.5,
            roughness: 0.6
        });
        const receiver = new THREE.Mesh(receiverGeom, frameMat);
        group.add(receiver);

        // Trigger guard
        const guardGeom = new THREE.TorusGeometry(0.15, 0.02, 8, 16, Math.PI);
        const guard = new THREE.Mesh(guardGeom, frameMat);
        guard.rotation.x = Math.PI / 2;
        guard.position.set(-0.2, -0.3, 0);
        group.add(guard);

        // Mounting holes
        const holeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
        const holeMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.9, roughness: 0.2 });

        const hole1 = new THREE.Mesh(holeGeom, holeMat);
        hole1.rotation.z = Math.PI / 2;
        hole1.position.set(0.2, 0.1, 0);
        group.add(hole1);

        const hole2 = new THREE.Mesh(holeGeom, holeMat);
        hole2.rotation.z = Math.PI / 2;
        hole2.position.set(-0.1, -0.1, 0);
        group.add(hole2);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    // STRAIGHT-PULL BOLT SYSTEM COMPONENTS
    createBoltBody(position, rotation) {
        const group = new THREE.Group();

        // Bolt cylinder
        const boltGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16);
        const boltMat = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            metalness: 0.9,
            roughness: 0.15
        });
        const bolt = new THREE.Mesh(boltGeom, boltMat);
        bolt.rotation.z = Math.PI / 2;
        group.add(bolt);

        // Bolt handle
        const handleGeom = new THREE.BoxGeometry(0.15, 0.08, 0.25);
        const handle = new THREE.Mesh(handleGeom, boltMat);
        handle.position.set(0.5, 0.12, 0);
        group.add(handle);

        // Cocking piece (rear of bolt)
        const cockingGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16);
        const cocking = new THREE.Mesh(cockingGeom, new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.9, roughness: 0.2 }));
        cocking.rotation.z = Math.PI / 2;
        cocking.position.set(-0.7, 0, 0);
        group.add(cocking);

        // Extractor claw
        const extractorGeom = new THREE.BoxGeometry(0.05, 0.05, 0.1);
        const extractor = new THREE.Mesh(extractorGeom, new THREE.MeshStandardMaterial({ color: 0xe74c3c, metalness: 0.8, roughness: 0.3 }));
        extractor.position.set(0.6, 0, 0.06);
        group.add(extractor);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createBoltHammer(position, rotation) {
        const group = new THREE.Group();

        // Striker body (internal hammer)
        const strikerGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 12);
        const strikerMat = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            metalness: 0.9,
            roughness: 0.1
        });
        const striker = new THREE.Mesh(strikerGeom, strikerMat);
        striker.rotation.z = Math.PI / 2;
        group.add(striker);

        // Striker tip (firing pin)
        const tipGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 12);
        const tip = new THREE.Mesh(tipGeom, strikerMat);
        tip.rotation.z = Math.PI / 2;
        tip.position.set(0.38, 0, 0);
        group.add(tip);

        // Sear notch
        const notchGeom = new THREE.BoxGeometry(0.08, 0.05, 0.05);
        const notch = new THREE.Mesh(notchGeom, new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.8, roughness: 0.3 }));
        notch.position.set(-0.25, -0.04, 0);
        group.add(notch);

        // Cocking knob (rear)
        const knobGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16);
        const knob = new THREE.Mesh(knobGeom, new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.6, roughness: 0.4 }));
        knob.rotation.z = Math.PI / 2;
        knob.position.set(-0.34, 0, 0);
        group.add(knob);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createBoltSear(position, rotation) {
        const group = new THREE.Group();

        // Sear body
        const bodyGeom = new THREE.BoxGeometry(0.12, 0.25, 0.08);
        const searMat = new THREE.MeshStandardMaterial({
            color: 0x27ae60,
            metalness: 0.8,
            roughness: 0.25
        });
        const body = new THREE.Mesh(bodyGeom, searMat);
        group.add(body);

        // Engagement surface
        const engageGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const engage = new THREE.Mesh(engageGeom, new THREE.MeshStandardMaterial({ color: 0x2ecc71, metalness: 0.8, roughness: 0.3 }));
        engage.position.set(0, 0.15, 0);
        group.add(engage);

        // Pivot pin
        const pivotGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 16);
        const pivot = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.7, roughness: 0.5 }));
        pivot.rotation.z = Math.PI / 2;
        pivot.position.set(0, -0.05, 0);
        group.add(pivot);

        // Trigger connector
        const connGeom = new THREE.BoxGeometry(0.08, 0.06, 0.06);
        const conn = new THREE.Mesh(connGeom, searMat);
        conn.position.set(0, -0.15, 0);
        group.add(conn);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createBoltSpring(position, rotation) {
        const group = new THREE.Group();

        // Striker spring
        const curve = new THREE.CatmullRomCurve3([]);
        const numCoils = 20;
        const springLength = 0.5;
        const radius = 0.035;

        for (let i = 0; i <= numCoils * 4; i++) {
            const t = i / (numCoils * 4);
            const angle = i * Math.PI / 2;
            const x = t * springLength;
            const y = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            curve.points.push(new THREE.Vector3(x, y, z));
        }

        const tubeGeom = new THREE.TubeGeometry(curve, 80, 0.008, 8, false);
        const springMat = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            metalness: 0.6,
            roughness: 0.4
        });
        const coil = new THREE.Mesh(tubeGeom, springMat);
        coil.rotation.z = Math.PI / 2;
        group.add(coil);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createBoltTrigger(position, rotation) {
        const group = new THREE.Group();

        // Trigger blade
        const bladeGeom = new THREE.BoxGeometry(0.1, 0.3, 0.15);
        const triggerMat = new THREE.MeshStandardMaterial({
            color: 0xe74c3c,
            metalness: 0.6,
            roughness: 0.4
        });
        const blade = new THREE.Mesh(bladeGeom, triggerMat);
        blade.position.set(0, -0.2, 0);
        group.add(blade);

        // Trigger bar (connects to sear)
        const barGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 12);
        const bar = new THREE.Mesh(barGeom, new THREE.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.7, roughness: 0.3 }));
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0.15, 0.05, 0);
        group.add(bar);

        // Pivot
        const pivotGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.18, 16);
        const pivot = new THREE.Mesh(pivotGeom, new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.7, roughness: 0.5 }));
        pivot.rotation.z = Math.PI / 2;
        group.add(pivot);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    createBoltFrame(position, rotation) {
        const group = new THREE.Group();

        // Receiver body
        const receiverGeom = new THREE.BoxGeometry(1.5, 0.4, 0.25);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x7f8c8d,
            metalness: 0.5,
            roughness: 0.6
        });
        const receiver = new THREE.Mesh(receiverGeom, frameMat);
        group.add(receiver);

        // Bolt raceway
        const racewayGeom = new THREE.CylinderGeometry(0.09, 0.09, 1.3, 16);
        const raceway = new THREE.Mesh(racewayGeom, new THREE.MeshStandardMaterial({ color: 0x5a6268, metalness: 0.7, roughness: 0.4 }));
        raceway.rotation.z = Math.PI / 2;
        raceway.position.set(0, 0.08, 0);
        group.add(raceway);

        // Trigger housing
        const housingGeom = new THREE.BoxGeometry(0.2, 0.35, 0.2);
        const housing = new THREE.Mesh(housingGeom, frameMat);
        housing.position.set(-0.3, -0.3, 0);
        group.add(housing);

        // Magazine well
        const magGeom = new THREE.BoxGeometry(0.15, 0.3, 0.3);
        const mag = new THREE.Mesh(magGeom, new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.6, roughness: 0.5 }));
        mag.position.set(0.2, -0.35, 0);
        group.add(mag);

        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.mesh = group;
        this.mesh.userData.component = this;
        scene.add(group);
    }

    highlight(enabled) {
        if (!this.mesh) return;

        this.mesh.traverse(child => {
            if (child.isMesh) {
                if (enabled) {
                    if (!child.userData.originalEmissive) {
                        child.userData.originalEmissive = child.material.emissive.clone();
                    }
                    child.material.emissive = new THREE.Color(0x3498db);
                    child.material.emissiveIntensity = 0.4;
                } else {
                    if (child.userData.originalEmissive) {
                        child.material.emissive = child.userData.originalEmissive;
                        child.material.emissiveIntensity = 0;
                    }
                }
            }
        });
    }

    remove() {
        if (this.mesh) {
            scene.remove(this.mesh);
        }
    }
}

// Initialize Three.js
function init() {
    const viewport = document.getElementById('viewport');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);

    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        viewport.clientWidth / viewport.clientHeight,
        0.1,
        100
    );
    camera.position.set(2, 1.5, 2);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    viewport.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.3, 0);
    controls.update();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(3, 5, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x3498db, 0.4);
    pointLight1.position.set(-2, 2, -2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xe74c3c, 0.3);
    pointLight2.position.set(2, 1, 2);
    scene.add(pointLight2);

    // Grid
    const gridHelper = new THREE.GridHelper(5, 20, 0x2d3742, 0x1c2229);
    scene.add(gridHelper);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    setupEventListeners();
    animate();

    // Load shotgun system by default
    loadShotgunSystem();
}

function setupEventListeners() {
    renderer.domElement.addEventListener('click', onCanvasClick);

    document.getElementById('load-shotgun').addEventListener('click', loadShotgunSystem);
    document.getElementById('load-bolt').addEventListener('click', loadBoltSystem);
    document.getElementById('cock-system').addEventListener('click', cockSystem);
    document.getElementById('fire-system').addEventListener('click', fireSystem);
    document.getElementById('reset-system').addEventListener('click', resetSystem);
    document.getElementById('clear-all').addEventListener('click', clearAll);
    document.getElementById('toggle-xray').addEventListener('click', toggleXRayMode);

    // Camera views
    document.getElementById('view-front').addEventListener('click', () => setCameraView('front'));
    document.getElementById('view-side').addEventListener('click', () => setCameraView('side'));
    document.getElementById('view-top').addEventListener('click', () => setCameraView('top'));
    document.getElementById('view-iso').addEventListener('click', () => setCameraView('iso'));

    window.addEventListener('resize', onWindowResize);
}

// SYSTEM LOADERS
function loadShotgunSystem() {
    clearAll();
    currentSystem = 'shotgun';

    updateStatus('idle', 'Loading single-barrel shotgun system...');

    // Build from bottom up for proper assembly

    // 1. Frame/receiver - base of everything
    const frame = new MechanicalComponent('shotgun-frame', {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0});
    components.push(frame);

    // 2. Trigger - in trigger guard at bottom of frame (frame is 0.5 tall, so trigger at -0.25)
    const trigger = new MechanicalComponent('shotgun-trigger', {x: -0.2, y: -0.13, z: 0}, {x: 0, y: 0, z: 0});
    components.push(trigger);
    SYSTEMS.shotgun = { trigger };

    // 3. Sear - sits above trigger, pivot at frame level (y: 0)
    const sear = new MechanicalComponent('shotgun-sear', {x: 0.1, y: 0, z: 0}, {x: 0, y: 0, z: 0});
    components.push(sear);
    SYSTEMS.shotgun.sear = sear;

    // 4. Hammer - pivot at (0.2, 0.1, 0), hammer body extends upward
    // Hammer pivot hole is at y=0 in the mesh, body extends from -0.05 to 0.65
    const hammer = new MechanicalComponent('shotgun-hammer', {x: 0.2, y: 0.1, z: 0}, {x: 0, y: 0, z: 0});
    components.push(hammer);
    SYSTEMS.shotgun.hammer = hammer;

    // 5. Spring - sits BETWEEN hammer bottom (at y: 0.05) and frame bottom (at y: -0.25)
    // Spring is 0.4 tall, so position it at y: -0.05 to connect hammer base to frame
    const spring = new MechanicalComponent('shotgun-spring', {x: 0.2, y: -0.05, z: 0}, {x: 0, y: 0, z: 0});
    components.push(spring);
    SYSTEMS.shotgun.spring = spring;

    updateStatus('idle', 'Single-barrel shotgun loaded - Assembled');
    updateUI();
}

function loadBoltSystem() {
    clearAll();
    currentSystem = 'bolt';

    updateStatus('idle', 'Loading straight-pull bolt system...');

    // Build bolt action system properly assembled

    // 1. Receiver/frame - base, centered
    // Frame is 1.5 long, 0.4 tall, receiver body at y=0
    const frame = new MechanicalComponent('bolt-frame', {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0});
    components.push(frame);

    // 2. Trigger - in trigger housing at (-0.3, -0.3, 0)
    const trigger = new MechanicalComponent('bolt-trigger', {x: -0.3, y: -0.18, z: 0}, {x: 0, y: 0, z: 0});
    components.push(trigger);
    SYSTEMS.straightPull = { trigger };

    // 3. Sear - catches striker from below, positioned in receiver
    const sear = new MechanicalComponent('bolt-sear', {x: -0.25, y: 0, z: 0}, {x: 0, y: 0, z: 0});
    components.push(sear);
    SYSTEMS.straightPull.sear = sear;

    // 4. Bolt body - in raceway at y: 0.08 (slightly above receiver centerline)
    // Bolt is 1.2 long, centered at x: 0
    const bolt = new MechanicalComponent('bolt-body', {x: 0, y: 0.08, z: 0}, {x: 0, y: 0, z: 0});
    components.push(bolt);
    SYSTEMS.straightPull.bolt = bolt;

    // 5. Striker - INSIDE bolt, striker is 0.6 long
    // Position at x: -0.15 so it's inside the bolt body, aligned at y: 0.08
    const hammer = new MechanicalComponent('bolt-hammer', {x: -0.15, y: 0.08, z: 0}, {x: 0, y: 0, z: 0});
    components.push(hammer);
    SYSTEMS.straightPull.hammer = hammer;

    // 6. Spring - BETWEEN striker rear (-0.45) and bolt rear (-0.6)
    // Spring is 0.5 long horizontally, position at x: -0.45 so it connects
    const spring = new MechanicalComponent('bolt-spring', {x: -0.45, y: 0.08, z: 0}, {x: 0, y: 0, z: 0});
    components.push(spring);
    SYSTEMS.straightPull.spring = spring;

    updateStatus('idle', 'Straight-pull bolt loaded - Assembled');
    updateUI();
}

// MECHANICAL ACTIONS
function cockSystem() {
    if (currentSystem === 'shotgun') {
        cockShotgun();
    } else if (currentSystem === 'bolt') {
        cockBolt();
    }
}

function cockShotgun() {
    const sys = SYSTEMS.shotgun;
    if (!sys || !sys.hammer) {
        updateStatus('error', 'No hammer found');
        return;
    }

    updateStatus('active', 'Cocking hammer...');

    // Rotate hammer back 70 degrees
    animateRotation(sys.hammer.mesh, -Math.PI * 0.39, 'z', 800, () => {
        sys.hammer.state = 'cocked';
        updateStatus('idle', 'Hammer cocked');
        updateForceDisplay(45, 0, 0, 60);
    });
}

function cockBolt() {
    const sys = SYSTEMS.straightPull;
    if (!sys || !sys.hammer) {
        updateStatus('error', 'No striker found');
        return;
    }

    updateStatus('active', 'Cocking striker...');

    // Pull striker back to x: -0.35
    animatePosition(sys.hammer.mesh, -0.35, 'x', 600, () => {
        sys.hammer.state = 'cocked';
        updateStatus('idle', 'Striker cocked');
        updateForceDisplay(55, 0, 0, 70);
    });

    // Spring stays in place but visually appears compressed (striker pulls away from it)
    // In reality the spring would compress, but we'll show it staying put for clarity
}

function fireSystem() {
    if (currentSystem === 'shotgun') {
        fireShotgun();
    } else if (currentSystem === 'bolt') {
        fireBolt();
    }
}

function fireShotgun() {
    const sys = SYSTEMS.shotgun;
    if (!sys || sys.hammer.state !== 'cocked') {
        updateStatus('error', 'Hammer not cocked');
        return;
    }

    updateStatus('active', 'Releasing hammer...');

    // Hammer falls forward
    animateRotation(sys.hammer.mesh, 0, 'z', 250, () => {
        sys.hammer.state = 'fired';
        updateStatus('idle', 'Hammer fired');
        updateForceDisplay(0, 8.2, 1.68, 0);

        setTimeout(() => {
            updateForceDisplay(0, 0, 0, 0);
        }, 1500);
    });
}

function fireBolt() {
    const sys = SYSTEMS.straightPull;
    if (!sys || sys.hammer.state !== 'cocked') {
        updateStatus('error', 'Striker not cocked');
        return;
    }

    updateStatus('active', 'Releasing striker...');

    // Striker moves forward to rest position
    animatePosition(sys.hammer.mesh, -0.15, 'x', 180, () => {
        sys.hammer.state = 'fired';
        updateStatus('idle', 'Striker released');
        updateForceDisplay(0, 12.5, 3.91, 0);

        setTimeout(() => {
            updateForceDisplay(0, 0, 0, 0);
        }, 1500);
    });
}

function resetSystem() {
    if (currentSystem === 'shotgun') {
        // Reset shotgun
        const sys = SYSTEMS.shotgun;
        if (sys && sys.hammer) {
            sys.hammer.mesh.rotation.z = 0;
            sys.hammer.state = 'at_rest';
        }
    } else if (currentSystem === 'bolt') {
        // Reset bolt striker to rest position
        const sys = SYSTEMS.straightPull;
        if (sys && sys.hammer) {
            sys.hammer.mesh.position.x = -0.15;
            sys.hammer.state = 'at_rest';
        }
    }

    updateStatus('idle', 'System reset');
    updateForceDisplay(0, 0, 0, 0);
}

function clearAll() {
    components.forEach(c => c.remove());
    components = [];
    currentSystem = null;
    SYSTEMS.shotgun = null;
    SYSTEMS.straightPull = null;
    selectedComponent = null;
    updateUI();
    updateForceDisplay(0, 0, 0, 0);
}

// X-Ray / Transparency Mode
let xrayMode = false;

function toggleXRayMode() {
    xrayMode = !xrayMode;
    const btn = document.getElementById('toggle-xray');
    btn.textContent = xrayMode ? 'Normal View' : 'X-Ray View';

    components.forEach(comp => {
        if (!comp.mesh) return;

        comp.mesh.traverse(child => {
            if (child.isMesh) {
                if (xrayMode) {
                    // Make frame/receiver semi-transparent
                    if (comp.type === 'shotgun-frame' || comp.type === 'bolt-frame' || comp.type === 'bolt-body') {
                        child.material.transparent = true;
                        child.material.opacity = 0.2;
                        child.material.depthWrite = false;
                    } else {
                        // Keep internal parts visible
                        child.material.transparent = false;
                        child.material.opacity = 1.0;
                    }
                } else {
                    // Reset to normal
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                    child.material.depthWrite = true;
                }
            }
        });
    });

    updateStatus('idle', xrayMode ? 'X-Ray mode enabled' : 'Normal view restored');
}

// Animation helpers
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

function animatePosition(mesh, targetPos, axis, duration, callback) {
    const startPos = mesh.position[axis];
    const startTime = Date.now();

    function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        mesh.position[axis] = startPos + (targetPos - startPos) * eased;

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

// UI Updates
function updateForceDisplay(springForce, velocity, energy, stress) {
    document.getElementById('spring-force').textContent = `${springForce.toFixed(1)} N`;
    document.getElementById('hammer-velocity').textContent = `${velocity.toFixed(2)} m/s`;
    document.getElementById('impact-energy').textContent = `${energy.toFixed(2)} J`;

    const springBar = document.getElementById('spring-stress');
    springBar.style.width = `${Math.min(stress, 100)}%`;
    springBar.parentElement.nextElementSibling.textContent = `${Math.round(stress)}%`;
}

function updateUI() {
    document.getElementById('component-count').textContent = `Components: ${components.length}`;
    document.getElementById('system-type').textContent = `System: ${currentSystem || 'None'}`;
}

function updateStatus(type, message) {
    const statusEl = document.getElementById('system-status');
    const textEl = document.getElementById('status-text');
    const dotEl = statusEl.querySelector('.status-dot');

    dotEl.className = `status-dot ${type}`;
    textEl.textContent = message;
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
        let clickedMesh = intersects[0].object;

        // Traverse up to find the component
        while (clickedMesh && !clickedMesh.userData.component) {
            clickedMesh = clickedMesh.parent;
        }

        if (clickedMesh && clickedMesh.userData.component) {
            selectedComponent = clickedMesh.userData.component;
            selectedComponent.highlight(true);
            document.getElementById('selected-component').textContent = selectedComponent.type.toUpperCase();
        }
    } else {
        document.getElementById('selected-component').textContent = 'None';
    }
}

function setCameraView(view) {
    const distance = 2.5;

    switch(view) {
        case 'front':
            camera.position.set(0, 0.3, distance);
            break;
        case 'side':
            camera.position.set(distance, 0.3, 0);
            break;
        case 'top':
            camera.position.set(0, distance, 0);
            break;
        case 'iso':
            camera.position.set(distance, distance * 0.7, distance);
            break;
    }

    controls.target.set(0, 0.3, 0);
    controls.update();
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
    renderer.render(scene, camera);
}

// Start
window.addEventListener('DOMContentLoaded', init);
