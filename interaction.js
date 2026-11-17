const sample = document.querySelector("#sample");
const sc = sample.getContext("2d");
const status = document.querySelector("#status");
let hover = null, selected = null, holding = false, painting = false;
function cellAt(e) {
    let b = c.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width - X, y = (e.clientY - b.top) * H / b.height - Y;
    return x >= 0 && x < AW && y >= 0 && y < AH ? Math.floor(y / CH) * C + Math.floor(x / CW) : null;
}
function select(i) {
    selected = i;
    document.querySelector("#panel").hidden = i === null;
    holding = false;
    painting = false;
    if (i !== null) {
        status.textContent = "Paint the selected section to restore its original colors.";
        preview();
    }
    else
        status.textContent = "Select a weathered area to restore its colors.";
}
function preview() {
    if (selected === null)
        return;
    sc.fillStyle = "#c6bfb3";
    sc.fillRect(0, 0, 78, 78);
    let ox = X + (selected % C) * CW, oy = Y + Math.floor(selected / C) * CH;
    for (let p of cells[selected]) {
        sc.fillStyle = p.color;
        sc.globalAlpha = p.state === 0 || p.state === 3 ? 1 : 0.12;
        sc.fillRect((p.x - ox) * 78 / CW - 2, (p.y - oy) * 78 / CH - 2, 4, 4);
    }
    sc.globalAlpha = 1;
}
function restore(p) {
    if (p.state === 0 || p.state === 3)
        return;
    if (p.state === 2) {
        p.px = p.x + (Math.random() - 0.5) * 120;
        p.py = p.y + 60 + Math.random() * 160;
        active.push(p);
    }
    p.state = 3;
    p.age = 0;
    p.protect = 15;
}
function paint(e) {
    if (selected === null)
        return;
    let b = sample.getBoundingClientRect(), x = X + (selected % C) * CW + (e.clientX - b.left) * CW / b.width, y = Y + Math.floor(selected / C) * CH + (e.clientY - b.top) * CH / b.height;
    for (let p of cells[selected])
        if (Math.hypot(p.x - x, p.y - y) < 22)
            restore(p);
    preview();
}
c.onpointermove = e => hover = cellAt(e);
c.onpointerleave = () => hover = null;
c.onpointerdown = e => {
    let i = cellAt(e);
    if (particles.length && i !== null)
        select(i);
};
sample.onpointerdown = e => {
    painting = true;
    sample.setPointerCapture(e.pointerId);
    paint(e);
};
sample.onpointermove = e => {
    if (painting)
        paint(e);
};
sample.onpointerup = sample.onpointercancel = () => painting = false;
let rb = document.querySelector("#restore");
rb.onpointerdown = e => {
    holding = true;
    rb.setPointerCapture(e.pointerId);
};
rb.onpointerup = rb.onpointercancel = () => holding = false;
rb.onclick = e => {
    if (e.detail === 0 && selected !== null)
        cells[selected].forEach(restore);
};
document.querySelector("#cancel").onclick = () => select(null);
document.querySelector("#weather").onclick = () => {
    if (particles.length)
        for (let i = 0; i < 7; i++)
            patch();
};
document.querySelector("#reset").onclick = () => {
    if (!particles.length)
        return;
    init();
    select(null);
};
document.querySelector("#speed").oninput = e => speed = +e.target.value;
document.querySelector("#pause").onclick = e => {
    paused = !paused;
    e.target.textContent = paused ? "Resume" : "Pause";
};
document.querySelector("#gallery").onclick = () => {
    document.body.classList.add("gallery");
    select(null);
};
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.body.classList.remove("gallery");
        select(null);
    }
    if (e.key === " " && document.body.classList.contains("gallery"))
        paused = !paused;
});
function updateRestoration(dt) {
    if (holding && selected !== null) {
        for (let p of cells[selected])
            if (Math.random() < dt * 2.8)
                restore(p);
        preview();
    }
}
function drawInteractionOverlay() {
    if (document.querySelector("#grid").checked && !document.body.classList.contains("gallery")) {
        ctx.strokeStyle = "rgba(255,255,255,.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= C; i++) {
            ctx.moveTo(X + i * CW, Y);
            ctx.lineTo(X + i * CW, Y + AH);
        }
        for (let i = 0; i <= R; i++) {
            ctx.moveTo(X, Y + i * CH);
            ctx.lineTo(X + AW, Y + i * CH);
        }
        ctx.stroke();
    }
    for (let i of [hover, selected])
        if (i !== null) {
            ctx.strokeStyle = i === selected ? "#fff5d1" : "rgba(255,255,255,.8)";
            ctx.lineWidth = i === selected ? 3 : 1;
            ctx.strokeRect(X + i % C * CW, Y + Math.floor(i / C) * CH, CW, CH);
        }
}
const img = new Image();
img.onload = () => {
    g.drawImage(img, 0, 0, AW, AH);
    init();
    select(null);
    requestAnimationFrame(frame);
};
img.src = "assets/artwork.jpg";
