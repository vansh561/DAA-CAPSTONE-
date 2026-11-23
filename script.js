const $ = (id) => document.getElementById(id);
let graphData = {nodes: [], edges: []};

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {"Content-Type": "application/json"},
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function notify(message, isError = false) {
  $("notice").textContent = message;
  $("notice").style.color = isError ? "#b34b58" : "#79739d";
  $("notice").style.background = isError ? "#fff1f2" : "#f7f6ff";
}
function populateSelects() {
  const names = graphData.nodes.map(n => n.id);
  ["connect-a","connect-b","start-user","target-user"].forEach(id => {
    const select = $(id), previous = select.value;
    select.innerHTML = "";
    names.forEach(name => {
      const option = document.createElement("option");
      option.value = name; option.textContent = name;
      select.appendChild(option);
    });
    if (names.includes(previous)) select.value = previous;
  });
  if ($("connect-b").options.length > 1 && $("connect-b").value === $("connect-a").value) {
    $("connect-b").selectedIndex = 1;
  }
}
function renderGraph() {
  const svg = $("network-graph");
  const nodes = graphData.nodes;
  svg.innerHTML = "";
  if (!nodes.length) {
    svg.innerHTML = '<text x="380" y="210" text-anchor="middle" fill="#969bad">Add users to build your network</text>';
    return;
  }
  const cx = 380, cy = 210, rx = 265, ry = 145;
  const positions = {};
  nodes.forEach((node, i) => {
    const angle = -Math.PI/2 + (2*Math.PI*i/nodes.length);
    positions[node.id] = {x: cx + rx*Math.cos(angle), y: cy + ry*Math.sin(angle)};
  });
  graphData.edges.forEach(edge => {
    const a = positions[edge.source], b = positions[edge.target];
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1",a.x); line.setAttribute("y1",a.y);
    line.setAttribute("x2",b.x); line.setAttribute("y2",b.y);
    line.setAttribute("class","edge"); svg.appendChild(line);
  });
  nodes.forEach(node => {
    const p = positions[node.id], group = document.createElementNS("http://www.w3.org/2000/svg","g");
    group.setAttribute("class","node");
    const circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
    circle.setAttribute("cx",p.x); circle.setAttribute("cy",p.y); circle.setAttribute("r",25);
    const text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("x",p.x); text.setAttribute("y",p.y+1);
    text.textContent = node.id.length > 9 ? node.id.slice(0,8)+"…" : node.id;
    group.append(circle,text); svg.appendChild(group);
  });
  $("graph-count").textContent = `${nodes.length} users · ${graphData.edges.length} connections`;
}
async function refresh() {
  const [data, stats] = await Promise.all([api("/api/graph"), api("/api/stats")]);
  graphData = data;
  $("stat-users").textContent = stats.users;
  $("stat-connections").textContent = stats.connections;
  $("stat-average").textContent = stats.average_degree;
  $("stat-popular").textContent = stats.most_connected || "—";
  populateSelects(); renderGraph();
}
$("add-user-form").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const name = $("new-user").value.trim();
    const result = await api("/api/users",{method:"POST",body:JSON.stringify({name})});
    $("new-user").value = ""; notify(result.message); await refresh();
  } catch(err) { notify(err.message,true); }
});
$("add-connection-form").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const result = await api("/api/connections",{method:"POST",body:JSON.stringify({user1:$("connect-a").value,user2:$("connect-b").value})});
    notify(result.message); await refresh();
  } catch(err) { notify(err.message,true); }
});
document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", async () => {
    const box = $("result-box");
    box.innerHTML = '<div class="result-placeholder"><span class="result-symbol">…</span><div><strong>Running algorithm</strong><p>Analysing your network.</p></div></div>';
    try {
      const result = await api("/api/analyze",{method:"POST",body:JSON.stringify({
        action:button.dataset.action,start:$("start-user").value,target:$("target-user").value
      })});
      const chips = result.result.length
        ? result.result.map((name,i)=>`${i?'<span class="chip-arrow">→</span>':""}<span class="chip">${escapeHtml(name)}</span>`).join("")
        : '<span class="muted">No mutual friends found.</span>';
      box.innerHTML = `<div class="result-title">${escapeHtml(result.title)}</div><div class="result-description">${escapeHtml(result.description)}</div><div class="chips">${chips}</div>`;
    } catch(err) {
      box.innerHTML = `<div class="result-description" style="color:#b34b58">${escapeHtml(err.message)}</div>`;
    }
  });
});
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
refresh().catch(err => notify(err.message,true));
