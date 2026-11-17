const c = document.querySelector("#art"), ctx = c.getContext("2d");
const W = 1200, H = 1040, X = 60, Y = 16, AW = 1080, AH = 810, S = 5, C = 12, R = 9, CW = 90, CH = 90;
let particles = [], active = [], patches = [], dust = [], paused = false, speed = 0.05, last = 0, clock = 0;
let src = document.createElement("canvas");
src.width = AW;
src.height = AH;
let g = src.getContext("2d", { willReadFrequently: true });
let layer = document.createElement("canvas");
layer.width = W;
layer.height = H;
let l = layer.getContext("2d");
let cells = Array.from({ length: C * R }, () => []);
function drawOne(p) {
    l.fillStyle = p.color;
    l.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
}
function init() {
    particles = [];
    active = [];
    patches = [];
    dust = [];
    clock = 0;
    cells = Array.from({ length: C * R }, () => []);
    l.clearRect(0, 0, W, H);
    const d = g.getImageData(0, 0, AW, AH).data;
    for (let y = 2; y < AH; y += S)
        for (let x = 2; x < AW; x += S) {
            let k = (y * AW + x) * 4;
            let p = { x: X + x, y: Y + y, px: X + x, py: Y + y, color: `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`, state: 0, size: 4.5, seed: Math.random(), cell: Math.floor(y / CH) * C + Math.floor(x / CW), protect: 0 };
            particles.push(p);
            cells[p.cell].push(p);
            drawOne(p);
        }
    for (let i = 0; i < 5; i++)
        patch();
}
function patch() {
    let p = particles[Math.floor(Math.random() * particles.length)];
    for (let i = 0; i < 40 && (p.state !== 0 || p.protect > 0); i++)
        p = particles[Math.floor(Math.random() * particles.length)];
    if (p.state !== 0)
        return;
    patches.push({ x: p.x, y: p.y, r: 3, target: 25 + Math.random() * 65, phase: Math.random() * 6.28, stretch: 0.6 + Math.random() * 0.8 });
}
function release(p) {
    p.state = 1;
    p.px = p.x;
    p.py = p.y;
    p.vx = (Math.random() - 0.5) * 40;
    p.vy = -10 + Math.random() * 30;
    p.age = 0;
    p.a = Math.random() * 6;
    p.spin = (Math.random() - 0.5) * 4;
    l.clearRect(p.x - S / 2, p.y - S / 2, S, S);
    active.push(p);
}
function frame(t) {
    let dt = Math.min(0.04, (t - last) / 1000 || 0.016);
    last = t;
    if (!paused) {
        clock += dt * speed;
        if (clock > 1.5) {
            if (particles.filter(p => p.state === 0).length > particles.length * 0.15)
                patch();
            clock = 0;
        }
        for (let p of particles)
            if (p.protect > 0)
                p.protect -= dt;
        for (let a of patches) {
            a.r += dt * speed * 8;
            let c0 = Math.max(0, Math.floor((a.x - X - a.r * 2) / CW)), c1 = Math.min(C - 1, Math.floor((a.x - X + a.r * 2) / CW)), r0 = Math.max(0, Math.floor((a.y - Y - a.r * 2) / CH)), r1 = Math.min(R - 1, Math.floor((a.y - Y + a.r * 2) / CH));
            for (let r = r0; r <= r1; r++)
                for (let q = c0; q <= c1; q++)
                    for (let p of cells[r * C + q]) {
                        if (p.state !== 0 || p.protect > 0)
                            continue;
                        let dx = p.x - a.x, dy = (p.y - a.y) / a.stretch, ang = Math.atan2(dy, dx), edge = a.r * (1 + 0.22 * Math.sin(ang * 5 + a.phase) + 0.14 * Math.cos(ang * 9 - a.phase));
                        if (dx * dx + dy * dy < edge * edge && Math.random() < dt * speed * 3)
                            release(p);
                    }
        }
        patches = patches.filter(a => a.r < a.target);
        updateRestoration(dt);
        for (let p of active) {
            p.age += dt;
            if (p.state === 1) {
                p.vy += dt * 38;
                p.px += (p.vx + Math.sin(p.age * 2.4 + p.seed * 20) * 20) * dt;
                p.py += p.vy * dt;
                p.a += p.spin * dt;
                if (p.py > H - 20 - Math.random() * 12) {
                    p.state = 2;
                    dust.push({ x: p.px, y: Math.min(H - 10, p.py), color: p.color, a: p.a });
                    if (dust.length > 3000)
                        dust.shift();
                }
            }
            else if (p.state === 3) {
                let k = 1 - Math.exp(-dt * 5);
                p.px += (p.x - p.px) * k;
                p.py += (p.y - p.py) * k;
                if (Math.hypot(p.px - p.x, p.py - p.y) < 0.8) {
                    p.state = 0;
                    drawOne(p);
                }
            }
        }
        active = active.filter(p => p.state === 1 || p.state === 3);
    }
    ctx.fillStyle = "#e8e5df";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c7c0b5";
    ctx.fillRect(X, Y, AW, AH);
    ctx.drawImage(layer, 0, 0);
    for (let p of dust) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(p.x, p.y, 3, 2);
    }
    ctx.globalAlpha = 1;
    for (let p of active) {
        ctx.save();
        ctx.translate(p.px, p.py);
        ctx.rotate(p.state === 1 ? p.a : 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
        ctx.restore();
    }
    drawInteractionOverlay();
    requestAnimationFrame(frame);
}
