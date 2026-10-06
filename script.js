const STORAGE_KEY = 'ayawaso_complaints';
const SESSION_KEY = 'ayawaso_staff_session';

/* Demo staff accounts — client-side only, matches the credentials used
   across the other Ayawaso mini-projects. Swap for a real backend/auth
   service when this app is connected to a server. */
const STAFF_ACCOUNTS = [
  { username: 'admin', password: 'admin123', fullName: 'Assembly Administrator' },
  { username: 'officer', password: 'officer123', fullName: 'Complaints Desk Officer' }
];

function getSession(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){
    return null;
  }
}

function isLoggedIn(){
  return !!getSession();
}

function attemptLogin(username, password){
  const match = STAFF_ACCOUNTS.find(a => a.username === username && a.password === password);
  if(match){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: match.username, fullName: match.fullName }));
    return true;
  }
  return false;
}

function logout(){
  sessionStorage.removeItem(SESSION_KEY);
  updateAuthUI();
  // send them back to the submit tab after logging out
  document.querySelector('.tab-btn[data-view="submit"]').click();
}

function updateAuthUI(){
  const loggedIn = isLoggedIn();
  const loginWrap = document.getElementById('login-wrap');
  const dashboardContent = document.getElementById('dashboard-content');
  const logoutBtn = document.getElementById('btn-logout');

  if(loggedIn){
    loginWrap.style.display = 'none';
    dashboardContent.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    const session = getSession();
    logoutBtn.textContent = 'Log out (' + session.fullName + ')';
  } else {
    loginWrap.style.display = 'flex';
    dashboardContent.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

const CATEGORIES = [
  {id:'waste', label:'Waste & sanitation', icon:'<path d="M6 7h12l-1 13H7L6 7z" stroke="#8F6B22" stroke-width="1.6" fill="none"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke="#8F6B22" stroke-width="1.6" fill="none"/>'},
  {id:'roads', label:'Roads & drains', icon:'<path d="M4 18L10 6h4l6 12" stroke="#8F6B22" stroke-width="1.6" fill="none"/><path d="M11 12h2" stroke="#8F6B22" stroke-width="1.6"/>'},
  {id:'water', label:'Water supply', icon:'<path d="M12 4c3 4 5 7 5 10a5 5 0 01-10 0c0-3 2-6 5-10z" stroke="#8F6B22" stroke-width="1.6" fill="none"/>'},
  {id:'lighting', label:'Street lighting', icon:'<circle cx="12" cy="10" r="5" stroke="#8F6B22" stroke-width="1.6" fill="none"/><path d="M10 18h4M11 20h2" stroke="#8F6B22" stroke-width="1.6"/>'},
  {id:'market', label:'Market & trade', icon:'<path d="M4 9l2-4h12l2 4" stroke="#8F6B22" stroke-width="1.6" fill="none"/><path d="M5 9v9h14V9" stroke="#8F6B22" stroke-width="1.6" fill="none"/>'},
  {id:'other', label:'Other', icon:'<circle cx="12" cy="12" r="8" stroke="#8F6B22" stroke-width="1.6" fill="none"/><path d="M12 16v.01M12 8v4.5" stroke="#8F6B22" stroke-width="1.6" stroke-linecap="round"/>'}
];

let selectedCategory = null;
let allComplaints = [];
let openId = null;
let justSavedId = null;

function catIcon(id){
  const c = CATEGORIES.find(c=>c.id===id) || CATEGORIES[CATEGORIES.length-1];
  return c.icon;
}
function catLabel(id){
  const c = CATEGORIES.find(c=>c.id===id) || CATEGORIES[CATEGORIES.length-1];
  return c.label;
}

function renderCategoryGrid(){
  const grid = document.getElementById('cat-grid');
  grid.innerHTML = CATEGORIES.map(c => `
    <div class="cat-option" data-cat="${c.id}">
      <svg viewBox="0 0 24 24">${c.icon}</svg>
      ${c.label}
    </div>
  `).join('');
  grid.querySelectorAll('.cat-option').forEach(el=>{
    el.addEventListener('click', ()=>{
      grid.querySelectorAll('.cat-option').forEach(o=>o.classList.remove('selected'));
      el.classList.add('selected');
      selectedCategory = el.dataset.cat;
    });
  });

  const filterCat = document.getElementById('filter-category');
  CATEGORIES.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.label;
    filterCat.appendChild(opt);
  });
}

function genId(){
  const n = Math.floor(1000 + Math.random()*9000);
  return 'AYWMA-' + new Date().getFullYear() + '-' + n;
}

/* --- Storage layer (browser localStorage) ---
   Swap the body of these two functions if you later connect a real backend/database. */
function loadComplaints(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    allComplaints = raw ? JSON.parse(raw) : [];
  }catch(e){
    allComplaints = [];
  }
  allComplaints.sort((a,b)=> new Date(b.dateSubmitted) - new Date(a.dateSubmitted));
  renderDashboard();
}

function persistComplaints(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allComplaints));
}

function saveComplaint(c){
  allComplaints.push(c);
  persistComplaints();
}

document.getElementById('btn-submit').addEventListener('click', ()=>{
  const name = document.getElementById('f-name').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const area = document.getElementById('f-area').value.trim();
  const desc = document.getElementById('f-desc').value.trim();

  if(!name){
    alert('Please enter your full name.');
    return;
  }
  if(!phone){
    alert('Please enter your phone number.');
    return;
  }
  if(!area){
    alert('Please enter your community / area.');
    return;
  }
  if(!selectedCategory){
    alert('Please select a category for your complaint.');
    return;
  }
  if(!desc){
    alert('Please describe the issue.');
    return;
  }

  const complaint = {
    id: genId(),
    name, phone,
    area, category: selectedCategory, description: desc,
    status: 'Pending',
    dateSubmitted: new Date().toISOString(),
    dateUpdated: new Date().toISOString()
  };

  saveComplaint(complaint);
  document.getElementById('confirm-id').textContent = complaint.id;
  document.getElementById('confirm-box').style.display = 'block';
  document.getElementById('f-name').value = '';
  document.getElementById('f-phone').value = '';
  document.getElementById('f-area').value = '';
  document.getElementById('f-desc').value = '';
  document.querySelectorAll('.cat-option').forEach(o=>o.classList.remove('selected'));
  selectedCategory = null;
  loadComplaints();
});

function renderStats(){
  const total = allComplaints.length;
  const pending = allComplaints.filter(c=>c.status==='Pending').length;
  const progress = allComplaints.filter(c=>c.status==='In-Progress').length;
  const resolved = allComplaints.filter(c=>c.status==='Resolved').length;

  const catCounts = {};
  allComplaints.forEach(c=>{ catCounts[c.category] = (catCounts[c.category]||0)+1; });
  let topCat = '—';
  let topCount = 0;
  Object.entries(catCounts).forEach(([k,v])=>{ if(v>topCount){topCount=v; topCat=catLabel(k);} });

  document.getElementById('stat-row').innerHTML = `
    <div class="stat"><div class="num">${total}</div><div class="lbl">Total complaints</div></div>
    <div class="stat pending"><div class="num">${pending}</div><div class="lbl">Pending</div></div>
    <div class="stat progress"><div class="num">${progress}</div><div class="lbl">In progress</div></div>
    <div class="stat resolved"><div class="num">${resolved}</div><div class="lbl">Resolved</div></div>
    <div class="stat"><div class="num" style="font-size:16px;">${topCat}</div><div class="lbl">Top category (${topCount})</div></div>
  `;
}

function timeAgo(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
}

function renderList(){
  const statusF = document.getElementById('filter-status').value;
  const catF = document.getElementById('filter-category').value;
  const searchF = document.getElementById('filter-search').value.trim().toLowerCase();

  let list = allComplaints.filter(c=>{
    if(statusF && c.status !== statusF) return false;
    if(catF && c.category !== catF) return false;
    if(searchF && !(c.area.toLowerCase().includes(searchF) || c.description.toLowerCase().includes(searchF))) return false;
    return true;
  });

  document.getElementById('filter-count').textContent = list.length + ' of ' + allComplaints.length + ' shown';

  const container = document.getElementById('complaint-list');
  if(list.length === 0){
    container.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#5B6A5F" stroke-width="1.5"/><path d="M9 10h.01M15 10h.01M9 15c1 1 5 1 6 0" stroke="#5B6A5F" stroke-width="1.5" stroke-linecap="round"/></svg>
      <div>No complaints match these filters yet.</div>
    </div>`;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="complaint-card" data-id="${c.id}">
      <div class="cc-top">
        <div class="cc-left">
          <div class="cc-icon"><svg viewBox="0 0 24 24">${catIcon(c.category)}</svg></div>
          <div>
            <div class="cc-id">${c.id} &middot; ${catLabel(c.category)} &middot; ${c.area}</div>
            <div class="cc-desc">${escapeHtml(c.description)}</div>
            <div class="cc-meta">Filed ${timeAgo(c.dateSubmitted)} by ${escapeHtml(c.name)}${c.assignedTo ? ' &middot; Assigned to <strong>' + escapeHtml(c.assignedTo) + '</strong>' : ' &middot; <span class=\"unassigned-tag\">Not yet assigned</span>'}</div>
          </div>
        </div>
        <span class="pill ${c.status}">${c.status.replace('-', ' ')}</span>
      </div>
      <div class="cc-detail ${openId===c.id ? 'open':''}" id="detail-${c.id}">
        <div class="cc-detail-grid">
          <div><span>Phone</span>${escapeHtml(c.phone)}</div>
          <div><span>Last updated</span>${timeAgo(c.dateUpdated)}</div>
        </div>
        <div class="status-actions">
          <button data-id="${c.id}" data-status="Pending" class="${c.status==='Pending'?'active-status':''}">Mark pending</button>
          <button data-id="${c.id}" data-status="In-Progress" class="${c.status==='In-Progress'?'active-status':''}">Mark in progress</button>
          <button data-id="${c.id}" data-status="Resolved" class="${c.status==='Resolved'?'active-status':''}">Mark resolved</button>
        </div>
        <div class="assign-row">
          <label for="assign-${c.id}">Assigned to</label>
          <div class="assign-input-row">
            <input type="text" id="assign-${c.id}" placeholder="e.g. Waste Management Officer" value="${escapeHtml(c.assignedTo || '')}">
            <button class="btn-secondary assign-save" data-id="${c.id}">Save</button>
          </div>
          ${justSavedId === c.id ? '<div class="assign-saved">&#10003; Assignment saved</div>' : ''}
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.complaint-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      // Don't collapse the card when interacting with form controls inside it
      if(e.target.closest('.status-actions, .assign-row')) return;
      if(['BUTTON','INPUT','TEXTAREA','SELECT','LABEL'].includes(e.target.tagName)) return;
      const id = card.dataset.id;
      openId = openId === id ? null : id;
      renderList();
    });
  });

  container.querySelectorAll('.status-actions button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      const c = allComplaints.find(x=>x.id===id);
      if(!c) return;
      c.status = status;
      c.dateUpdated = new Date().toISOString();
      persistComplaints();
      renderStats();
      renderList();
    });
  });

  container.querySelectorAll('.assign-save').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = btn.dataset.id;
      const input = document.getElementById('assign-' + id);
      const c = allComplaints.find(x=>x.id===id);
      if(!c || !input) return;
      c.assignedTo = input.value.trim();
      c.dateUpdated = new Date().toISOString();
      persistComplaints();
      justSavedId = id;
      renderStats();
      renderList();
      setTimeout(()=>{
        if(justSavedId === id){
          justSavedId = null;
          renderList();
        }
      }, 2500);
    });
  });
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderDashboard(){
  renderStats();
  renderList();
}

document.getElementById('filter-status').addEventListener('change', renderList);
document.getElementById('filter-category').addEventListener('change', renderList);
document.getElementById('filter-search').addEventListener('input', renderList);

/* --- Track my complaint (public) --- */
function findComplaintById(id){
  return allComplaints.find(c => c.id.toLowerCase() === id.toLowerCase());
}

function stepStateFor(status, stepStatus){
  // returns 'done', 'current', or '' for a given step relative to the complaint's actual status
  const order = ['Pending', 'In-Progress', 'Resolved'];
  if(status === 'Resolved'){
    return 'done'; // all three steps show done when resolved
  }
  const currentIdx = order.indexOf(status);
  const stepIdx = order.indexOf(stepStatus);
  if(stepIdx < currentIdx) return 'done';
  if(stepIdx === currentIdx) return 'current';
  return '';
}

function renderProgressStepper(status){
  const steps = [
    { key: 'Pending', label: 'Submitted' },
    { key: 'In-Progress', label: 'In Progress' },
    { key: 'Resolved', label: 'Resolved' }
  ];
  return `<div class="progress-stepper">
    ${steps.map(s => `
      <div class="progress-step ${stepStateFor(status, s.key)}">
        <div class="line"></div>
        <div class="dot">${stepStateFor(status, s.key) === 'done' ? '&#10003;' : ''}</div>
        <div class="step-label">${s.label}</div>
      </div>
    `).join('')}
  </div>`;
}

function renderTrackResult(complaint){
  const resultBox = document.getElementById('track-result');
  const errorBox = document.getElementById('track-error');

  if(!complaint){
    errorBox.style.display = 'block';
    resultBox.innerHTML = '';
    return;
  }
  errorBox.style.display = 'none';

  resultBox.innerHTML = `
    <div class="track-summary">
      <div>
        <div class="cc-id">${complaint.id} &middot; ${catLabel(complaint.category)}</div>
        <h3>${escapeHtml(complaint.area)}</h3>
        <div class="cc-meta">Filed ${timeAgo(complaint.dateSubmitted)}</div>
      </div>
      <span class="pill ${complaint.status}">${complaint.status.replace('-', ' ')}</span>
    </div>

    ${renderProgressStepper(complaint.status)}

    <div class="assignment-status ${complaint.assignedTo ? 'assigned' : 'unassigned'}">
      ${complaint.assignedTo
        ? `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 12l2 2 4-4" stroke="#286B3B" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="#286B3B" stroke-width="1.5" fill="none"/></svg> This complaint has been assigned to <strong>${escapeHtml(complaint.assignedTo)}</strong> at the Assembly.`
        : `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="#8F5A17" stroke-width="1.5" fill="none"/><path d="M12 8v5M12 16v.01" stroke="#8F5A17" stroke-width="2" stroke-linecap="round"/></svg> This complaint has not yet been assigned to a staff member.`
      }
    </div>

    <div class="track-detail-grid">
      <div><span>Reported by</span>${escapeHtml(complaint.name)}</div>
      <div><span>Last updated</span>${timeAgo(complaint.dateUpdated)}</div>
    </div>

    <div class="track-desc-box">
      <span style="display:block; color:var(--ink-soft); font-size:11.5px; margin-bottom:4px;">Description</span>
      ${escapeHtml(complaint.description)}
    </div>
  `;
}

function performTrackSearch(refNo){
  const complaint = findComplaintById(refNo.trim());
  renderTrackResult(complaint);
}

document.getElementById('btn-track-search').addEventListener('click', ()=>{
  performTrackSearch(document.getElementById('track-input').value);
});
document.getElementById('track-input').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') performTrackSearch(document.getElementById('track-input').value);
});

document.getElementById('btn-track-this').addEventListener('click', ()=>{
  const refId = document.getElementById('confirm-id').textContent;
  document.querySelector('.tab-btn[data-view="track"]').click();
  document.getElementById('track-input').value = refId;
  performTrackSearch(refId);
});

document.querySelectorAll('.tab-btn[data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn[data-view]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    if(btn.dataset.view === 'dashboard'){
      updateAuthUI();
      if(isLoggedIn()) loadComplaints();
    }
  });
});

function handleLoginSubmit(){
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorBox = document.getElementById('login-error');

  if(attemptLogin(username, password)){
    errorBox.style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    updateAuthUI();
    loadComplaints();
  } else {
    errorBox.style.display = 'block';
  }
}

document.getElementById('btn-login').addEventListener('click', handleLoginSubmit);
document.getElementById('login-password').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') handleLoginSubmit();
});
document.getElementById('login-username').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') document.getElementById('login-password').focus();
});
document.getElementById('btn-logout').addEventListener('click', logout);

renderCategoryGrid();
updateAuthUI();
loadComplaints();