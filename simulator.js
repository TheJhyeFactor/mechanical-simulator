// Mechanical Interaction Simulator
// Educational state-based constraint solver

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// System States
const STATES = {
    AT_REST: 'at_rest',
    PRELOADED: 'preloaded',
    ENGAGED: 'engaged',
    BLOCKED: 'blocked',
    RELEASED: 'released'
};

// Global State
let systemState = STATES.AT_REST;
let components = [];
let selectedComponent = null;
let draggedComponent = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let engagements = [];
let constraints = [];

// Component Class
class Component {
    constructor(type, x, y) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.state = STATES.AT_REST;
        this.width = 80;
        this.height = 80;
        this.color = this.getColorForType(type);
        this.engaged = false;
        this.blocked = false;
        this.preload = 0;
    }

    getColorForType(type) {
        const colors = {
            'primary-actuator': '#3498db',
            'retention-element': '#2ecc71',
            'stop-surface': '#e74c3c',
            'spring-element': '#f39c12',
            'pivot-point': '#9b59b6'
        };
        return colors[type] || '#95a5a6';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Shadow for depth
        if (this === selectedComponent) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        }

        // Component body
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.blocked ? '#e74c3c' : (this.engaged ? '#2ecc71' : '#34495e');
        ctx.lineWidth = this.engaged || this.blocked ? 4 : 2;

        if (this.type === 'primary-actuator') {
            this.drawActuator();
        } else if (this.type === 'retention-element') {
            this.drawRetention();
        } else if (this.type === 'stop-surface') {
            this.drawStop();
        } else if (this.type === 'spring-element') {
            this.drawSpring();
        } else if (this.type === 'pivot-point') {
            this.drawPivot();
        }

        // State indicator
        if (this.state !== STATES.AT_REST) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.state.toUpperCase(), 0, this.height / 2 + 15);
        }

        ctx.restore();

        // Engagement lines
        if (this.engaged) {
            this.drawEngagementLines();
        }
    }

    drawActuator() {
        // Rotating hammer-like shape
        ctx.beginPath();
        ctx.moveTo(-30, -10);
        ctx.lineTo(30, -10);
        ctx.lineTo(40, 0);
        ctx.lineTo(30, 10);
        ctx.lineTo(-30, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rotation indicator
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
        ctx.stroke();
    }

    drawRetention() {
        // Hook-like retention shape
        ctx.beginPath();
        ctx.moveTo(-20, -30);
        ctx.lineTo(-20, 20);
        ctx.lineTo(0, 30);
        ctx.lineTo(20, 20);
        ctx.lineTo(20, -20);
        ctx.lineTo(10, -30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawStop() {
        // Hard stop surface
        ctx.fillRect(-35, -5, 70, 10);
        ctx.strokeRect(-35, -5, 70, 10);

        // Warning stripes
        ctx.fillStyle = '#c0392b';
        for (let i = -30; i < 30; i += 15) {
            ctx.fillRect(i, -5, 7, 10);
        }
    }

    drawSpring() {
        // Spring coil
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = -25; i <= 25; i += 2) {
            const y = Math.sin(i * 0.5) * 15;
            if (i === -25) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        ctx.stroke();

        // End caps
        ctx.fillStyle = this.color;
        ctx.fillRect(-30, -5, 5, 10);
        ctx.fillRect(25, -5, 5, 10);
    }

    drawPivot() {
        // Pivot point
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#2c3e50';
        ctx.fill();
    }

    drawEngagementLines() {
        // Draw lines to engaged components
        engagements.forEach(eng => {
            if (eng.from === this.id || eng.to === this.id) {
                const other = components.find(c =>
                    c.id === (eng.from === this.id ? eng.to : eng.from)
                );
                if (other) {
                    ctx.save();
                    ctx.strokeStyle = '#2ecc71';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        });
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.abs(dx) < this.width / 2 && Math.abs(dy) < this.height / 2;
    }

    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.width + other.width) / 2;
    }
}

// Initialize
function init() {
    setupEventListeners();
    updateUI();
    animate();
}

function setupEventListeners() {
    // Component library drag
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
    });

    // Canvas interactions
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);

    // Control buttons
    document.getElementById('apply-input').addEventListener('click', applyInputForce);
    document.getElementById('release-input').addEventListener('click', releaseInput);
    document.getElementById('run-analysis').addEventListener('click', runAnalysis);
    document.getElementById('clear-workspace').addEventListener('click', clearWorkspace);
    document.getElementById('reset-states').addEventListener('click', resetStates);
    document.getElementById('example-config').addEventListener('click', loadExample);
}

function handleDragStart(e) {
    e.dataTransfer.setData('componentType', e.currentTarget.dataset.type);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const type = e.dataTransfer.getData('componentType');

    const component = new Component(type, x, y);
    components.push(component);
    updateUI();
}

function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    selectedComponent = components.find(c => c.contains(x, y));

    if (selectedComponent) {
        isDragging = true;
        dragOffset.x = x - selectedComponent.x;
        dragOffset.y = y - selectedComponent.y;
    }
}

function handleCanvasMouseMove(e) {
    if (isDragging && selectedComponent) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        selectedComponent.x = x - dragOffset.x;
        selectedComponent.y = y - dragOffset.y;

        checkConstraints();
    }
}

function handleCanvasMouseUp(e) {
    isDragging = false;
    evaluateEngagements();
}

function handleCanvasClick(e) {
    if (selectedComponent) {
        // Right click or ctrl+click to rotate
        if (e.ctrlKey || e.button === 2) {
            selectedComponent.rotation += Math.PI / 8;
        }
    }
}

// State Machine
function applyInputForce() {
    const actuator = components.find(c => c.type === 'primary-actuator');

    if (!actuator) {
        updateSystemStatus('error', 'No Primary Actuator found');
        return;
    }

    // Check if blocked
    if (checkIfBlocked(actuator)) {
        systemState = STATES.BLOCKED;
        actuator.state = STATES.BLOCKED;
        actuator.blocked = true;
        updateSystemStatus('error', 'Motion BLOCKED by constraint');
        return;
    }

    // Check for retention engagement
    const retention = components.find(c =>
        c.type === 'retention-element' && c.checkCollision(actuator)
    );

    if (retention) {
        systemState = STATES.ENGAGED;
        actuator.state = STATES.ENGAGED;
        retention.state = STATES.ENGAGED;
        actuator.engaged = true;
        retention.engaged = true;

        engagements.push({
            from: actuator.id,
            to: retention.id,
            type: 'retention'
        });

        // Animate rotation
        animateRotation(actuator, Math.PI / 3);
        updateSystemStatus('active', 'Engagement SUCCESSFUL');
    } else {
        systemState = STATES.PRELOADED;
        actuator.state = STATES.PRELOADED;
        animateRotation(actuator, Math.PI / 6);
        updateSystemStatus('active', 'Input Applied - No Engagement');
    }

    calculateStress();
    updateUI();
}

function releaseInput() {
    components.forEach(c => {
        if (c.state === STATES.ENGAGED || c.state === STATES.PRELOADED) {
            c.state = STATES.RELEASED;
            animateRotation(c, 0);

            setTimeout(() => {
                c.state = STATES.AT_REST;
                c.engaged = false;
                c.blocked = false;
                updateUI();
            }, 500);
        }
    });

    systemState = STATES.RELEASED;
    engagements = [];
    updateSystemStatus('idle', 'System RELEASED');

    setTimeout(() => {
        systemState = STATES.AT_REST;
        updateSystemStatus('idle', 'System IDLE');
    }, 600);
}

function checkIfBlocked(component) {
    const stopSurface = components.find(c =>
        c.type === 'stop-surface' && c.checkCollision(component)
    );
    return stopSurface !== undefined;
}

function animateRotation(component, targetRotation) {
    const startRotation = component.rotation;
    const duration = 500;
    const startTime = Date.now();

    function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        component.rotation = startRotation + (targetRotation - startRotation) * easeOutCubic(progress);

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    step();
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Constraint Checking
function checkConstraints() {
    constraints = [];

    components.forEach((comp, i) => {
        components.slice(i + 1).forEach(other => {
            if (comp.checkCollision(other)) {
                const constraint = {
                    type: 'collision',
                    components: [comp.id, other.id],
                    satisfied: false,
                    message: `${comp.type} overlaps ${other.type}`
                };
                constraints.push(constraint);
            }
        });
    });

    updateUI();
}

function evaluateEngagements() {
    const actuator = components.find(c => c.type === 'primary-actuator');
    const retention = components.find(c => c.type === 'retention-element');

    if (actuator && retention && actuator.checkCollision(retention)) {
        // Potential engagement detected
        console.log('Engagement possible');
    }
}

// Analysis
function runAnalysis() {
    updateSystemStatus('active', 'Running Analysis...');

    setTimeout(() => {
        calculateStress();
        identifyFailurePoints();
        updateSystemStatus('idle', 'Analysis Complete');
    }, 1000);
}

function calculateStress() {
    const actuator = components.find(c => c.type === 'primary-actuator');
    const spring = components.find(c => c.type === 'spring-element');
    const retention = components.find(c => c.type === 'retention-element');

    let rotationStress = 0;
    let frictionStress = 0;
    let massStress = 0;
    let contactStress = 0;

    if (actuator) {
        rotationStress = Math.abs(actuator.rotation) / Math.PI * 100;
        frictionStress = components.length * 5;
    }

    if (spring) {
        massStress = Math.min(components.length * 15, 100);
    }

    if (retention && actuator && retention.checkCollision(actuator)) {
        contactStress = 75;
    }

    // Update stress bars
    updateStressBar('rotation-stress', rotationStress);
    updateStressBar('friction-stress', frictionStress);
    updateStressBar('mass-stress', massStress);
    updateStressBar('contact-stress', contactStress);
}

function updateStressBar(id, value) {
    const bar = document.getElementById(id);
    const valueDisplay = bar.parentElement.nextElementSibling;

    if (bar) {
        bar.style.width = `${Math.min(value, 100)}%`;
        valueDisplay.textContent = `${Math.round(value)}%`;
    }
}

function identifyFailurePoints() {
    const failures = [];

    components.forEach(comp => {
        if (comp.type === 'retention-element') {
            const stress = Math.abs(comp.rotation) * 50;
            if (stress > 30) {
                failures.push({
                    component: comp.type,
                    reason: 'Excessive rotation stress',
                    severity: stress > 70 ? 'HIGH' : 'MEDIUM'
                });
            }
        }

        if (comp.type === 'spring-element') {
            const collisions = components.filter(c => c !== comp && c.checkCollision(comp)).length;
            if (collisions > 1) {
                failures.push({
                    component: comp.type,
                    reason: 'Multiple contact points',
                    severity: 'MEDIUM'
                });
            }
        }
    });

    // Check for missing critical components
    const hasActuator = components.some(c => c.type === 'primary-actuator');
    const hasRetention = components.some(c => c.type === 'retention-element');

    if (hasActuator && !hasRetention) {
        failures.push({
            component: 'system',
            reason: 'No retention element present',
            severity: 'HIGH'
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
        <div style="margin-bottom: 10px; padding: 8px; background: var(--bg-primary); border-radius: 4px; border-left: 3px solid ${f.severity === 'HIGH' ? '#e74c3c' : '#f39c12'};">
            <div style="font-weight: 600; color: ${f.severity === 'HIGH' ? '#e74c3c' : '#f39c12'};">${f.severity}</div>
            <div style="font-size: 0.85em;">${f.component}</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">${f.reason}</div>
        </div>
    `).join('');
}

// UI Updates
function updateUI() {
    // Component count
    document.getElementById('component-count').textContent = `Components: ${components.length}`;

    // Current state
    document.getElementById('current-state').textContent = systemState;

    // Engagements
    const engagementList = document.getElementById('engagement-list');
    if (engagements.length === 0) {
        engagementList.innerHTML = '<div class="engagement-item"><span class="engagement-label">No engagements</span></div>';
    } else {
        engagementList.innerHTML = engagements.map(e => {
            const from = components.find(c => c.id === e.from);
            const to = components.find(c => c.id === e.to);
            return `<div class="engagement-item" style="border-left: 3px solid #2ecc71;">
                <span class="engagement-label">${from?.type} ↔ ${to?.type}</span>
            </div>`;
        }).join('');
    }

    // Constraints
    const constraintList = document.getElementById('constraint-list');
    if (constraints.length === 0) {
        constraintList.innerHTML = '<div class="constraint-item neutral"><span class="constraint-icon">○</span><span>No constraints active</span></div>';
    } else {
        constraintList.innerHTML = constraints.map(c =>
            `<div class="constraint-item violated">
                <span class="constraint-icon">⚠</span>
                <span>${c.message}</span>
            </div>`
        ).join('');
    }

    // Constraint status
    document.getElementById('constraint-status').textContent =
        constraints.length === 0 ? 'Constraints: Satisfied' : `Constraints: ${constraints.length} Violation(s)`;
}

function updateSystemStatus(status, message) {
    const statusIndicator = document.getElementById('system-status');
    const dot = statusIndicator.querySelector('.status-dot');

    dot.className = `status-dot ${status}`;
    statusIndicator.innerHTML = `<span class="status-dot ${status}"></span> System: ${message}`;
}

// Utility Functions
function clearWorkspace() {
    if (confirm('Clear all components?')) {
        components = [];
        engagements = [];
        constraints = [];
        systemState = STATES.AT_REST;
        updateUI();
        updateSystemStatus('idle', 'Workspace Cleared');
    }
}

function resetStates() {
    components.forEach(c => {
        c.state = STATES.AT_REST;
        c.engaged = false;
        c.blocked = false;
        c.rotation = 0;
    });

    engagements = [];
    systemState = STATES.AT_REST;
    updateUI();
    updateSystemStatus('idle', 'States Reset');
}

function loadExample() {
    clearWorkspace();

    // Create example configuration
    components = [
        new Component('pivot-point', 300, 350),
        new Component('primary-actuator', 300, 350),
        new Component('retention-element', 450, 350),
        new Component('spring-element', 300, 250),
        new Component('stop-surface', 550, 350)
    ];

    updateUI();
    updateSystemStatus('idle', 'Example Loaded');
}

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all components
    components.forEach(c => c.draw());

    requestAnimationFrame(animate);
}

// Start
init();
