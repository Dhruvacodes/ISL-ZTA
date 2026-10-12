// ZT-Arbiter Interactive Dashboard Application

let currentEventSource = null;
let theaterChart = null;
let chartLabels = [];
let chartDataPoints = [];

// Action colors
const ACTION_COLORS = {
  ALLOW: '#10b981',
  MFA: '#f59e0b',
  RESTRICT: '#3b82f6',
  DENY: '#ef4444',
  QUARANTINE: '#8b5cf6',
};

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupTheater();
  setupShowdown();
  setupAudit();
  loadResults();
});

// Tab navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'tab-audit') {
        loadAuditLog();
      } else if (targetId === 'tab-results') {
        loadResults();
      }
    });
  });
}

// VIEW A: THEATER
function setupTheater() {
  const startBtn = document.getElementById('btn-start-theater');
  startBtn.addEventListener('click', startTheaterStream);
  initTheaterChart();
}

function initTheaterChart() {
  const ctx = document.getElementById('theater-chart');
  if (typeof Chart !== 'undefined' && ctx) {
    theaterChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Cumulative Malicious Volume Exfiltrated',
          data: chartDataPoints,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.2,
          pointRadius: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Episode Hours' }, grid: { color: 'rgba(75, 85, 99, 0.2)' } },
          y: { title: { display: true, text: 'Data Volume (Normalized)' }, beginAtZero: true, grid: { color: 'rgba(75, 85, 99, 0.2)' } },
        },
        plugins: { legend: { display: false } },
      }
    });
  }
}

function startTheaterStream() {
  if (currentEventSource) {
    currentEventSource.close();
  }

  const scenario = document.getElementById('scenario-select').value;
  const speed = document.getElementById('speed-select').value;
  const feed = document.getElementById('theater-log');
  feed.innerHTML = '';

  chartLabels.length = 0;
  chartDataPoints.length = 0;
  if (theaterChart) {
    theaterChart.update();
  }

  const btn = document.getElementById('btn-start-theater');
  btn.textContent = '⏹ Streaming...';

  currentEventSource = new EventSource(`/api/stream/${scenario}?speed=${speed}`);

  currentEventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateTheaterUI(data);
  };

  currentEventSource.onerror = () => {
    btn.textContent = '▶ Start Live Stream';
    currentEventSource.close();
    currentEventSource = null;
  };
}

function updateTheaterUI(data) {
  // Budget & Risk Gauges
  const bVal = document.getElementById('budget-val');
  const bFill = document.getElementById('budget-fill');
  bVal.textContent = `${data.budget.toFixed(1)} / 100.0`;
  bFill.style.width = `${Math.max(0, Math.min(100, data.budget))}%`;

  const rVal = document.getElementById('risk-val');
  const rFill = document.getElementById('risk-fill');
  rVal.textContent = data.risk_score.toFixed(3);
  rFill.style.width = `${data.risk_score * 100}%`;

  // Status Cards
  document.getElementById('req-res').textContent = `${data.resource} (${data.operation})`;
  
  // Mask pills
  const pills = document.querySelectorAll('#mask-pills .mask-pill');
  const actions = ['ALLOW', 'MFA', 'RESTRICT', 'DENY', 'QUARANTINE'];
  actions.forEach((act, idx) => {
    if (data.mask[idx] === 1) {
      pills[idx].classList.add('lit');
    } else {
      pills[idx].classList.remove('lit');
    }
  });

  // Badges
  const pBadge = document.getElementById('prop-badge');
  pBadge.innerHTML = `<span class="action-chip ${data.proposed}">${data.proposed}</span>`;
  
  const eBadge = document.getElementById('exec-badge');
  eBadge.innerHTML = `<span class="action-chip ${data.executed}">${data.executed}</span>`;

  // Shield Alert
  const alertBox = document.getElementById('shield-alert-box');
  const alertText = document.getElementById('shield-alert-text');
  if (data.overridden) {
    alertBox.style.display = 'block';
    alertText.textContent = `🛡️ ${data.veto_reason}`;
  } else {
    alertBox.style.display = 'none';
  }

  // Log Feed
  const feed = document.getElementById('theater-log');
  const item = document.createElement('div');
  item.className = `feed-item ${data.overridden ? 'shield-vetoed' : ''}`;
  const tagColor = data.is_attack ? 'var(--color-deny)' : 'var(--color-allow)';
  const tagLabel = data.is_attack ? '[ATTACK]' : '[BENIGN]';
  
  item.innerHTML = `
    <div>
      <span style="color: ${tagColor}; font-weight: 700; margin-right: 0.5rem;">${tagLabel}</span>
      <span style="color: var(--text-secondary); margin-right: 0.5rem;">[${data.timestamp}h]</span>
      <strong>${data.resource}</strong>
      <span style="color: var(--text-muted); font-size: 0.75rem;"> (vol: ${data.volume}, ρ: ${data.risk_score})</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span class="action-chip ${data.proposed}" style="font-size: 0.65rem;">${data.proposed}</span>
      <span>→</span>
      <span class="action-chip ${data.executed}" style="font-size: 0.65rem;">${data.executed}</span>
    </div>
  `;
  feed.prepend(item);

  // Update Line Chart
  if (theaterChart) {
    chartLabels.push(`${data.timestamp}h`);
    chartDataPoints.push(data.cum_malicious_volume);
    if (chartLabels.length > 50) {
      chartLabels.shift();
      chartDataPoints.shift();
    }
    theaterChart.update();
  }
}

// VIEW B: SHOWDOWN
function setupShowdown() {
  const btn = document.getElementById('btn-run-showdown');
  btn.addEventListener('click', runShowdown);
}

async function runShowdown() {
  const scenario = document.getElementById('showdown-scenario').value;
  const grid = document.getElementById('showdown-grid');
  grid.innerHTML = '<div style="color: var(--text-muted); grid-column: span 5; text-align: center;">Running synchronized simulation across 5 controllers...</div>';

  try {
    const res = await fetch('/api/showdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    const data = await res.json();
    renderShowdown(data);
  } catch (err) {
    grid.innerHTML = `<div style="color: var(--color-deny); grid-column: span 5;">Error: ${err}</div>`;
  }
}

function renderShowdown(data) {
  const grid = document.getElementById('showdown-grid');
  grid.innerHTML = '';

  const ctrls = Object.keys(data.stats);
  ctrls.forEach(cname => {
    const s = data.stats[cname];
    const card = document.createElement('div');
    card.className = 'showdown-card';
    card.innerHTML = `
      <div class="showdown-header">${cname}</div>
      <div class="stat-item">
        <span class="stat-label">Exfiltrated Loss:</span>
        <span class="stat-val" style="color: ${s.exfiltrated_volume > 0.1 ? 'var(--color-deny)' : 'var(--color-allow)'};">${s.exfiltrated_volume}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Legit Friction Events:</span>
        <span class="stat-val">${s.friction_events}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Containment Time:</span>
        <span class="stat-val">${s.contained_time_hr === 'Never' ? 'Never' : s.contained_time_hr + 'h'}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  const winnerBox = document.getElementById('showdown-winner-box');
  winnerBox.innerHTML = data.caption;
}

// VIEW C: BREAK-IT
async function triggerBreakIt(actionName) {
  const resBox = document.getElementById('breakit-result');
  resBox.style.display = 'block';
  resBox.style.background = 'rgba(31, 41, 55, 0.8)';
  resBox.innerHTML = 'Testing invariant condition...';

  try {
    const resp = await fetch(`/api/breakit/${actionName}`, { method: 'POST' });
    const data = await resp.json();
    const isPassed = data.result === 'PASSED';
    resBox.style.border = `1px solid ${isPassed ? 'var(--color-allow)' : 'var(--color-deny)'}`;
    resBox.style.background = isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    resBox.innerHTML = `
      <div style="font-weight: 700; color: ${isPassed ? 'var(--color-allow)' : 'var(--color-deny)'}; margin-bottom: 0.3rem;">
        [${data.result}] ${data.title}
      </div>
      <div style="color: var(--text-primary);">${data.message}</div>
    `;
  } catch (err) {
    resBox.innerHTML = `<span style="color: var(--color-deny);">Request failed: ${err}</span>`;
  }
}

// VIEW D: AUDIT EXPLORER
function setupAudit() {
  document.getElementById('btn-verify-audit').addEventListener('click', verifyAuditChain);
  document.getElementById('btn-refresh-audit').addEventListener('click', loadAuditLog);
}

async function loadAuditLog() {
  const tbody = document.getElementById('audit-table-body');
  try {
    const res = await fetch('/api/audit');
    const records = await res.json();
    tbody.innerHTML = '';
    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No records logged yet. Run requests or Theater first.</td></tr>';
      return;
    }
    records.slice().reverse().forEach(rec => {
      const actions = ['ALLOW', 'MFA', 'RESTRICT', 'DENY', 'QUARANTINE'];
      const pName = actions[rec.proposed_action] || 'DENY';
      const eName = actions[rec.executed_action] || 'DENY';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${rec.record_id}</td>
        <td><code>${rec.pseudonymous_principal}</code></td>
        <td><code>${rec.request_id.slice(0, 8)}...</code></td>
        <td><span class="action-chip ${pName}" style="font-size:0.65rem;">${pName}</span></td>
        <td><span class="action-chip ${eName}" style="font-size:0.65rem;">${eName}</span></td>
        <td>${rec.risk_score.toFixed(3)}</td>
        <td>${rec.budget_before.toFixed(1)} → ${rec.budget_after.toFixed(1)}</td>
        <td><span style="color:var(--color-allow); font-weight:600;">${rec.enforcement_status}</span></td>
        <td><code title="${rec.entry_hash}">${rec.entry_hash.slice(0, 10)}...</code></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="color:var(--color-deny);">Error loading audit records: ${err}</td></tr>`;
  }
}

async function verifyAuditChain() {
  const badge = document.getElementById('audit-status-badge');
  badge.innerHTML = 'Verifying SHA-256 hash chain and Merkle roots...';
  try {
    const res = await fetch('/api/audit/verify', { method: 'POST' });
    const data = await res.json();
    if (data.valid) {
      badge.innerHTML = `
        <div style="padding:0.75rem; background:rgba(16, 185, 129, 0.15); border:1px solid var(--color-allow); border-radius:6px; color:var(--color-allow);">
          ✓ <strong>SHA-256 Hash Chain Valid</strong>: Zero tampering detected across all decision entries. Audit Completeness: ${(data.completeness_score * 100).toFixed(1)}%.
        </div>
      `;
    } else {
      badge.innerHTML = `
        <div style="padding:0.75rem; background:rgba(239, 68, 68, 0.15); border:1px solid var(--color-deny); border-radius:6px; color:var(--color-deny);">
          ✗ <strong>TAMPER DETECTED</strong> at Record #${data.record_id}: ${data.error}
        </div>
      `;
    }
  } catch (err) {
    badge.innerHTML = `<span style="color:var(--color-deny);">Verification failed: ${err}</span>`;
  }
}

// VIEW E: RESULTS
async function loadResults() {
  const tbody = document.getElementById('results-table-body');
  try {
    const res = await fetch('/api/results');
    const data = await res.json();
    if (data.controllers) {
      renderResultsTable(data);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">${data.status || 'Results pending.'}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--color-deny);">Error loading results: ${err}</td></tr>`;
  }
}

function renderResultsTable(data) {
  const tbody = document.getElementById('results-table-body');
  tbody.innerHTML = '';
  
  const ctrls = Object.keys(data.controllers);
  ctrls.forEach(cname => {
    const c = data.controllers[cname];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${cname}</strong></td>
      <td>${c.useful_work.mean} [${c.useful_work.ci95[0]}, ${c.useful_work.ci95[1]}]</td>
      <td>${c.attack_loss.mean} [${c.attack_loss.ci95[0]}, ${c.attack_loss.ci95[1]}]</td>
      <td>${(c.attack_success_rate.mean * 100).toFixed(1)}%</td>
      <td><span style="color:${c.pvr_percent === 0 ? 'var(--color-allow)' : 'var(--color-deny)'}; font-weight:700;">${c.pvr_percent.toFixed(2)}%</span></td>
      <td>${c.latency_p50_ms.toFixed(3)} ms / ${c.latency_p95_ms.toFixed(3)} ms</td>
    `;
    tbody.appendChild(tr);
  });

  // Render Ablations
  const abDiv = document.getElementById('ablations-content');
  if (data.ablations) {
    let abHtml = '<table class="data-table"><thead><tr><th>Variant</th><th>Attack Loss</th><th>PVR</th></tr></thead><tbody>';
    for (const [vname, vdata] of Object.entries(data.ablations)) {
      abHtml += `<tr><td>${vname}</td><td>${vdata.mean_attack_loss}</td><td>${vdata.pvr_percent}%</td></tr>`;
    }
    abHtml += '</tbody></table>';
    abDiv.innerHTML = abHtml;
  }

  // Render Sensitivity
  const senDiv = document.getElementById('sensitivity-content');
  if (data.sensitivity) {
    let senHtml = '<p><strong>Budget Capacity (B_max):</strong></p><ul style="padding-left:1rem; margin-bottom:0.5rem;">';
    for (const [k, v] of Object.entries(data.sensitivity.budget_capacity || {})) {
      senHtml += `<li>${k}: Loss = ${v}</li>`;
    }
    senHtml += '</ul><p><strong>Refill Rate (η):</strong></p><ul style="padding-left:1rem; margin-bottom:0.5rem;">';
    for (const [k, v] of Object.entries(data.sensitivity.refill_rate || {})) {
      senHtml += `<li>${k}: Loss = ${v}</li>`;
    }
    senHtml += '</ul><p><strong>Risk Exponent (p):</strong></p><ul style="padding-left:1rem;">';
    for (const [k, v] of Object.entries(data.sensitivity.risk_exponent_p || {})) {
      senHtml += `<li>${k}: Loss = ${v}</li>`;
    }
    senHtml += '</ul>';
    senDiv.innerHTML = senHtml;
  }
}
