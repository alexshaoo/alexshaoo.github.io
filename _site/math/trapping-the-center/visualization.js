export function createInteractiveCircle(canvas, n, initialMode = "even") {
  const ctx = canvas.getContext("2d");
  const radius = 150;
  const center = { x: canvas.width / 2, y: canvas.height / 2 };
  let points = [];
  let draggedIdx = null;

  // Theme detection
  const isDarkMode = () => document.body.classList.contains('quarto-dark') || 
                           window.matchMedia('(prefers-color-scheme: dark)').matches;

  function initPoints(mode) {
    points = [];
    for (let i = 0; i < n; i++) {
      const angle = mode === "even" ? (i * 2 * Math.PI) / n : Math.random() * 2 * Math.PI;
      points.push({ angle: normalize(angle) });
    }
    points.sort((a, b) => a.angle - b.angle);
  }

  function normalize(a) {
    while (a < 0) a += Math.PI * 2;
    while (a > Math.PI * 2) a -= Math.PI * 2;
    return a;
  }

  function getXY(angle) {
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dark = isDarkMode();
    
    // Check if center is trapped (no gap > PI)
    let isInside = true;
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length;
      let gap = points[next].angle - points[i].angle;
      if (gap < 0) gap += Math.PI * 2;
      if (gap > Math.PI) isInside = false;
    }

    const colors = {
      circle: dark ? "#444" : "#ddd",
      text: dark ? "#eee" : "#333",
      fill: isInside ? "rgba(76, 175, 80, 0.25)" : "rgba(244, 67, 54, 0.25)",
      stroke: isInside ? "#4CAF50" : "#F44336"
    };

    // Draw Circle
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = colors.circle;
    ctx.stroke();

    // Draw Polygon
    ctx.beginPath();
    if (points.length > 0) {
      const start = getXY(points[0].angle);
      ctx.moveTo(start.x, start.y);
      points.forEach((p, i) => {
        if (i === 0) return;
        const pos = getXY(p.angle);
        ctx.lineTo(pos.x, pos.y);
      });
      ctx.closePath();
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw Center
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.text;
    ctx.fill();

    // Draw Points
    points.forEach(p => {
      const pos = getXY(p.angle);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = dark ? "#222" : "#fff";
      ctx.fill();
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Event Handlers
  const onMouseDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    points.forEach((p, i) => {
      const pos = getXY(p.angle);
      if (Math.hypot(pos.x - mx, pos.y - my) < 15) draggedIdx = i;
    });
  };

  const onMouseMove = (e) => {
    if (draggedIdx === null) return;
    const rect = canvas.getBoundingClientRect();
    const angle = normalize(Math.atan2(e.clientY - rect.top - center.y, e.clientX - rect.left - center.x));

    const prev = points[(draggedIdx - 1 + points.length) % points.length].angle;
    const next = points[(draggedIdx + 1) % points.length].angle;

    // Constraint: Point cannot cross its neighbors
    let canMove = false;
    if (prev < next) {
      if (angle > prev && angle < next) canMove = true;
    } else {
      if (angle > prev || angle < next) canMove = true;
    }

    if (canMove) {
      points[draggedIdx].angle = angle;
      draw();
    }
  };

  const onMouseUp = () => draggedIdx = null;

  // Attach Listeners
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  initPoints(initialMode);
  draw();

  return { 
    randomize: () => { initPoints("random"); draw(); },
    // REQUIRED: Cleans up listeners when we destroy the canvas
    dispose: () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
  };
}