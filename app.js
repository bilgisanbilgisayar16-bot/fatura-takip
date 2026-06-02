// ─────────────────────────────────────────
//  FaturaTakip — Uygulama Mantığı
// ─────────────────────────────────────────

const DB = {
  get faturalar() { return JSON.parse(localStorage.getItem('ft_faturalar') || '[]'); },
  set faturalar(v) { localStorage.setItem('ft_faturalar', JSON.stringify(v)); },
  get odemeler()  { return JSON.parse(localStorage.getItem('ft_odemeler')  || '[]'); },
  set odemeler(v) { localStorage.setItem('ft_odemeler', JSON.stringify(v)); },
  get musteriler(){ return JSON.parse(localStorage.getItem('ft_musteriler')|| '[]'); },
  set musteriler(v){ localStorage.setItem('ft_musteriler', JSON.stringify(v)); },
  get settings()  { return JSON.parse(localStorage.getItem('ft_settings')  || '{"para":"₺","firma":"FaturaTakip"}'); },
  set settings(v) { localStorage.setItem('ft_settings', JSON.stringify(v)); },
};

let currentPage = 'dashboard';
let editTarget = null;

// ── INIT ──────────────────────────────────
// DOMContentLoaded'da sadece clock başlatılır.
// initApp() Firebase auth sonrası çağrılır.
window.addEventListener('DOMContentLoaded', () => {
  startClock();
});

function initApp() {
  seedDemoData();
  navigate('dashboard');
}

function seedDemoData() {
  if (DB.musteriler.length > 0) return; // zaten veri var
  DB.musteriler = [
    { id: 'm1', ad: 'Ahmet Yılmaz',    email: 'ahmet@sirket.com', tel: '0532 111 2233', adres: 'İstanbul' },
    { id: 'm2', ad: 'Elif Şahin',      email: 'elif@abc.net',     tel: '0544 333 4455', adres: 'Ankara' },
    { id: 'm3', ad: 'Teknoloji A.Ş.',  email: 'info@tek.com',     tel: '0212 555 6677', adres: 'İzmir' },
  ];
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const d = (offset) => { const x = new Date(today); x.setDate(x.getDate()+offset); return fmt(x); };

  DB.faturalar = [
    { id: 'f1', no:'F-001', musteriId:'m1', tutar:4500,  kdv:810,  tarih:d(-20), vade:d(-5),  durum:'gecikti',  notlar:'Web tasarım' },
    { id: 'f2', no:'F-002', musteriId:'m2', tutar:12000, kdv:2160, tarih:d(-15), vade:d(10),  durum:'beklemede', notlar:'Danışmanlık' },
    { id: 'f3', no:'F-003', musteriId:'m3', tutar:8750,  kdv:1575, tarih:d(-10), vade:d(20),  durum:'odendi',   notlar:'Yazılım geliştirme' },
    { id: 'f4', no:'F-004', musteriId:'m1', tutar:3200,  kdv:576,  tarih:d(-5),  vade:d(25),  durum:'beklemede', notlar:'SEO hizmet' },
    { id: 'f5', no:'F-005', musteriId:'m2', tutar:6600,  kdv:1188, tarih:d(-3),  vade:d(27),  durum:'beklemede', notlar:'İçerik yönetimi' },
  ];
  DB.odemeler = [
    { id: 'o1', faturaId:'f3', tutar:8750,  tarih:d(-2), yontem:'havale', notlar:'Tam ödeme' },
    { id: 'o2', faturaId:'f1', tutar:2000,  tarih:d(-8), yontem:'nakit',  notlar:'Kısmi ödeme' },
  ];
}

// ── CLOCK ────────────────────────────────
function startClock() {
  const el = document.getElementById('clock');
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleDateString('tr-TR') + '  ' +
      now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}

// ── NAVIGATION ───────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('pageTitle').textContent = {
    dashboard:'Dashboard', faturalar:'Faturalar', odemeler:'Ödemeler',
    musteriler:'Müşteriler', raporlar:'Raporlar'
  }[page] || page;
  currentPage = page;

  if (page === 'dashboard')   renderDashboard();
  if (page === 'faturalar')   renderFaturalar();
  if (page === 'odemeler')    renderOdemeler();
  if (page === 'musteriler')  renderMusteriler();
  if (page === 'raporlar')    renderRaporlar();

  // close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── HELPERS ──────────────────────────────
const para = (n) => (DB.settings.para || '₺') + Number(n).toLocaleString('tr-TR', {minimumFractionDigits:2, maximumFractionDigits:2});
const uid  = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split('T')[0];
const musteriAd = (id) => DB.musteriler.find(m => m.id === id)?.ad || id || '—';

function durumBadge(d) {
  const map = { beklemede:'Beklemede', odendi:'Ödendi', gecikti:'Gecikti', iptal:'İptal', kismi:'Kısmi' };
  return `<span class="badge badge-${d}">${map[d]||d}</span>`;
}

function geciktiGuncelle() {
  // Vadesi geçmiş + beklemedeki faturaları gecikti yap
  const today_ = today();
  const list = DB.faturalar.map(f => {
    if (f.durum === 'beklemede' && f.vade && f.vade < today_) return { ...f, durum:'gecikti' };
    return f;
  });
  DB.faturalar = list;
}

// ── DASHBOARD ────────────────────────────
function renderDashboard() {
  geciktiGuncelle();
  const faturalar = DB.faturalar;
  const odemeler  = DB.odemeler;

  const toplam     = faturalar.reduce((s,f)=>s+Number(f.tutar||0),0);
  const odenen     = faturalar.filter(f=>f.durum==='odendi').reduce((s,f)=>s+Number(f.tutar||0),0);
  const bekleyen   = faturalar.filter(f=>f.durum==='beklemede').reduce((s,f)=>s+Number(f.tutar||0),0);
  const gecikti    = faturalar.filter(f=>f.durum==='gecikti').reduce((s,f)=>s+Number(f.tutar||0),0);

  document.getElementById('statGrid').innerHTML = [
    { label:'Toplam Fatura', value: para(toplam), sub: faturalar.length + ' fatura', color:'#c9a227' },
    { label:'Tahsil Edilen', value: para(odenen),  sub: faturalar.filter(f=>f.durum==='odendi').length + ' ödendi', color:'#22c55e' },
    { label:'Bekleyen',      value: para(bekleyen),sub: faturalar.filter(f=>f.durum==='beklemede').length + ' fatura', color:'#3b82f6' },
    { label:'Gecikmiş',      value: para(gecikti), sub: faturalar.filter(f=>f.durum==='gecikti').length + ' fatura', color:'#ef4444' },
  ].map(s => `
    <div class="stat-card" style="--accent-color:${s.color}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');

  // Son faturalar
  const son = [...faturalar].sort((a,b)=>b.tarih?.localeCompare(a.tarih)).slice(0,5);
  document.getElementById('recentInvoices').innerHTML = son.length
    ? son.map(f=>`<div class="mini-item">
        <div><div class="mi-name">${musteriAd(f.musteriId)}</div><div class="mi-date">${f.no}</div></div>
        <div class="mi-amt">${para(f.tutar)}</div>
        ${durumBadge(f.durum)}
      </div>`).join('')
    : '<div class="empty-state">Henüz fatura yok</div>';

  // Vadesi yaklaşanlar (30 gün)
  const limit = new Date(); limit.setDate(limit.getDate()+30);
  const yaklaşan = faturalar.filter(f=>f.durum!=='odendi' && f.durum!=='iptal' && f.vade && new Date(f.vade) <= limit)
    .sort((a,b)=>a.vade.localeCompare(b.vade)).slice(0,5);
  document.getElementById('upcomingDue').innerHTML = yaklaşan.length
    ? yaklaşan.map(f=>`<div class="mini-item">
        <div><div class="mi-name">${musteriAd(f.musteriId)}</div><div class="mi-date">Vade: ${f.vade}</div></div>
        <div class="mi-amt">${para(f.tutar)}</div>
      </div>`).join('')
    : '<div class="empty-state">Yaklaşan vade yok</div>';

  renderChart();
}

function renderChart() {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 500, H = 120;
  canvas.width = W; canvas.height = H;

  // Aylık tutar hesapla (son 6 ay)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString('tr-TR',{month:'short'}), year: d.getFullYear(), month: d.getMonth() });
  }

  const data = months.map(m => DB.faturalar
    .filter(f => { const d=new Date(f.tarih); return d.getFullYear()===m.year && d.getMonth()===m.month; })
    .reduce((s,f)=>s+Number(f.tutar||0),0)
  );

  const max = Math.max(...data, 1);
  const pad = { t:10, b:30, l:10, r:10 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const colW = innerW / months.length;

  ctx.clearRect(0, 0, W, H);

  data.forEach((val, i) => {
    const bh = (val / max) * innerH;
    const x = pad.l + i * colW + colW * .15;
    const w = colW * .7;
    const y = pad.t + innerH - bh;

    // Bar
    const grad = ctx.createLinearGradient(0, y, 0, y + bh);
    grad.addColorStop(0, 'rgba(201,162,39,.85)');
    grad.addColorStop(1, 'rgba(201,162,39,.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, bh, 4);
    ctx.fill();

    // Label
    ctx.fillStyle = '#8a9bb5';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(months[i].label, x + w/2, H - 8);
  });
}

// ── FATURALAR ────────────────────────────
function renderFaturalar() {
  geciktiGuncelle();
  const q  = (document.getElementById('searchFatura')?.value || '').toLowerCase();
  const ds = document.getElementById('filterDurum')?.value || '';
  const list = DB.faturalar.filter(f =>
    (!q || f.no?.toLowerCase().includes(q) || musteriAd(f.musteriId).toLowerCase().includes(q)) &&
    (!ds || f.durum === ds)
  ).sort((a,b)=>b.tarih?.localeCompare(a.tarih));

  document.getElementById('faturaBody').innerHTML = list.length
    ? list.map(f => `<tr>
        <td><strong>${f.no}</strong></td>
        <td>${musteriAd(f.musteriId)}</td>
        <td>${para(f.tutar)}</td>
        <td>${f.tarih||'—'}</td>
        <td>${f.vade||'—'}</td>
        <td>${durumBadge(f.durum)}</td>
        <td><div class="action-btns">
          <button class="btn-sm" onclick="editFatura('${f.id}')">Düzenle</button>
          ${f.durum!=='odendi'?`<button class="btn-sm success" onclick="odemeAl('${f.id}')">Ödeme Al</button>`:''}
          <button class="btn-sm danger" onclick="silFatura('${f.id}')">Sil</button>
        </div></td>
      </tr>`).join('')
    : `<tr><td colspan="7"><div class="empty-state"><div class="es-icon">◧</div>Fatura bulunamadı</div></td></tr>`;
}

// ── ÖDEMELER ─────────────────────────────
function renderOdemeler() {
  const q = (document.getElementById('searchOdeme')?.value || '').toLowerCase();
  const y = document.getElementById('filterYontem')?.value || '';
  const list = DB.odemeler.filter(o => {
    const f = DB.faturalar.find(x=>x.id===o.faturaId);
    return (!q || f?.no?.toLowerCase().includes(q) || musteriAd(f?.musteriId).toLowerCase().includes(q)) &&
           (!y || o.yontem === y);
  }).sort((a,b)=>b.tarih?.localeCompare(a.tarih));

  const yMap = { nakit:'Nakit', havale:'Havale/EFT', kredi:'Kredi Kartı', cek:'Çek', diger:'Diğer' };
  document.getElementById('odemeBody').innerHTML = list.length
    ? list.map(o => {
        const f = DB.faturalar.find(x=>x.id===o.faturaId);
        return `<tr>
          <td>${f?.no||o.faturaId}</td>
          <td>${musteriAd(f?.musteriId)}</td>
          <td>${para(o.tutar)}</td>
          <td>${o.tarih||'—'}</td>
          <td>${yMap[o.yontem]||o.yontem}</td>
          <td>${o.notlar||'—'}</td>
          <td><div class="action-btns">
            <button class="btn-sm danger" onclick="silOdeme('${o.id}')">Sil</button>
          </div></td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="7"><div class="empty-state"><div class="es-icon">◫</div>Ödeme bulunamadı</div></td></tr>`;
}

// ── MÜŞTERİLER ───────────────────────────
function renderMusteriler() {
  const q = (document.getElementById('searchMusteri')?.value || '').toLowerCase();
  const list = DB.musteriler.filter(m =>
    !q || m.ad?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
  );

  document.getElementById('musteriGrid').innerHTML = list.length
    ? list.map(m => {
        const faturaları = DB.faturalar.filter(f=>f.musteriId===m.id);
        const topTutar   = faturaları.reduce((s,f)=>s+Number(f.tutar||0),0);
        const odenanTutar= faturaları.filter(f=>f.durum==='odendi').reduce((s,f)=>s+Number(f.tutar||0),0);
        return `<div class="musteri-card">
          <div class="mc-avatar">${m.ad.charAt(0)}</div>
          <div class="mc-name">${m.ad}</div>
          <div class="mc-detail">${m.email||''}</div>
          <div class="mc-detail">${m.tel||''}</div>
          <div class="mc-stats">
            <div class="mc-stat"><span>Faturalar</span><strong>${faturaları.length}</strong></div>
            <div class="mc-stat"><span>Toplam</span><strong>${para(topTutar)}</strong></div>
            <div class="mc-stat"><span>Tahsil</span><strong style="color:var(--green)">${para(odenanTutar)}</strong></div>
          </div>
          <div class="action-btns" style="margin-top:12px">
            <button class="btn-sm" onclick="editMusteri('${m.id}')">Düzenle</button>
            <button class="btn-sm danger" onclick="silMusteri('${m.id}')">Sil</button>
          </div>
        </div>`;
      }).join('')
    : `<div class="empty-state"><div class="es-icon">◻</div>Müşteri bulunamadı</div>`;
}

// ── RAPORLAR ─────────────────────────────
function renderRaporlar() {
  const faturalar = DB.faturalar;
  const odemeler  = DB.odemeler;

  const toplam     = faturalar.reduce((s,f)=>s+Number(f.tutar||0),0);
  const odenen     = faturalar.filter(f=>f.durum==='odendi').reduce((s,f)=>s+Number(f.tutar||0),0);
  const bekleyen   = faturalar.filter(f=>f.durum==='beklemede').reduce((s,f)=>s+Number(f.tutar||0),0);
  const geciktiTutar= faturalar.filter(f=>f.durum==='gecikti').reduce((s,f)=>s+Number(f.tutar||0),0);
  const toplamOdeme = odemeler.reduce((s,o)=>s+Number(o.tutar||0),0);
  const toplamKdv  = faturalar.reduce((s,f)=>s+Number(f.kdv||0),0);

  // Müşteri bazlı
  const musteriRapor = DB.musteriler.map(m => ({
    ad: m.ad,
    toplam: faturalar.filter(f=>f.musteriId===m.id).reduce((s,f)=>s+Number(f.tutar||0),0),
    faturaSayisi: faturalar.filter(f=>f.musteriId===m.id).length,
  })).sort((a,b)=>b.toplam-a.toplam);

  document.getElementById('raporGrid').innerHTML = `
    <div class="rapor-card">
      <h3>Genel Özet</h3>
      <div class="rapor-row"><span class="rr-label">Toplam Fatura Tutarı</span><strong class="rr-val">${para(toplam)}</strong></div>
      <div class="rapor-row"><span class="rr-label">Tahsil Edilen</span><strong class="rr-val" style="color:var(--green)">${para(odenen)}</strong></div>
      <div class="rapor-row"><span class="rr-label">Bekleyen Alacak</span><strong class="rr-val" style="color:var(--blue)">${para(bekleyen)}</strong></div>
      <div class="rapor-row"><span class="rr-label">Gecikmiş Alacak</span><strong class="rr-val" style="color:var(--red)">${para(geciktiTutar)}</strong></div>
      <div class="rapor-row"><span class="rr-label">Toplam Ödeme Girişi</span><strong class="rr-val">${para(toplamOdeme)}</strong></div>
      <div class="rapor-row"><span class="rr-label">Toplam KDV Tutarı</span><strong class="rr-val">${para(toplamKdv)}</strong></div>
      <div class="rapor-row"><span class="rr-label">Tahsilat Oranı</span><strong class="rr-val">${toplam>0?((odenen/toplam)*100).toFixed(1):'0'}%</strong></div>
    </div>
    <div class="rapor-card">
      <h3>Fatura Durumu</h3>
      ${['odendi','beklemede','gecikti','iptal'].map(d=>{
        const sayı = faturalar.filter(f=>f.durum===d).length;
        const tutar = faturalar.filter(f=>f.durum===d).reduce((s,f)=>s+Number(f.tutar||0),0);
        const label = {odendi:'Ödendi', beklemede:'Beklemede', gecikti:'Gecikti', iptal:'İptal'}[d];
        return `<div class="rapor-row">
          <span class="rr-label">${durumBadge(d)} ${label}</span>
          <strong class="rr-val">${sayı} fatura — ${para(tutar)}</strong>
        </div>`;
      }).join('')}
    </div>
    <div class="rapor-card">
      <h3>Müşteri Bazlı Analiz</h3>
      ${musteriRapor.length
        ? musteriRapor.map(m=>`<div class="rapor-row">
            <span class="rr-label">${m.ad} <em style="color:var(--text2);font-size:.75rem">(${m.faturaSayisi} fatura)</em></span>
            <strong class="rr-val">${para(m.toplam)}</strong>
          </div>`).join('')
        : '<div class="empty-state">Müşteri yok</div>'}
    </div>
    <div class="rapor-card">
      <h3>Ödeme Yöntemleri</h3>
      ${['nakit','havale','kredi','cek','diger'].map(y=>{
        const yOd = DB.odemeler.filter(o=>o.yontem===y);
        if (!yOd.length) return '';
        const tutar = yOd.reduce((s,o)=>s+Number(o.tutar||0),0);
        const label = {nakit:'Nakit', havale:'Havale/EFT', kredi:'Kredi Kartı', cek:'Çek', diger:'Diğer'}[y];
        return `<div class="rapor-row"><span class="rr-label">${label}</span><strong class="rr-val">${yOd.length} ödeme — ${para(tutar)}</strong></div>`;
      }).join('') || '<div class="empty-state">Ödeme yok</div>'}
    </div>`;
}

// ── MODAL FORMS ──────────────────────────
function openModal(type, id) {
  editTarget = id || null;
  const overlay = document.getElementById('modalOverlay');
  const title   = document.getElementById('modalTitle');
  const body    = document.getElementById('modalBody');

  overlay.classList.add('open');

  if (type === 'fatura') {
    const f = id ? DB.faturalar.find(x=>x.id===id) : null;
    title.textContent = f ? 'Faturayı Düzenle' : 'Yeni Fatura';
    const mOpts = DB.musteriler.map(m=>`<option value="${m.id}" ${f?.musteriId===m.id?'selected':''}>${m.ad}</option>`).join('');
    body.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Fatura No</label><input id="f_no" value="${f?.no||autoFaturaNo()}" /></div>
        <div class="form-group"><label>Müşteri</label>
          <select id="f_musteri"><option value="">Seçin...</option>${mOpts}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Tutar (KDV hariç)</label><input id="f_tutar" type="number" value="${f?.tutar||''}" placeholder="0.00" /></div>
        <div class="form-group"><label>KDV Tutarı</label><input id="f_kdv" type="number" value="${f?.kdv||''}" placeholder="0.00" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fatura Tarihi</label><input id="f_tarih" type="date" value="${f?.tarih||today()}" /></div>
        <div class="form-group"><label>Vade Tarihi</label><input id="f_vade" type="date" value="${f?.vade||''}" /></div>
      </div>
      <div class="form-group"><label>Durum</label>
        <select id="f_durum">
          <option value="beklemede" ${f?.durum==='beklemede'?'selected':''}>Beklemede</option>
          <option value="odendi"    ${f?.durum==='odendi'   ?'selected':''}>Ödendi</option>
          <option value="gecikti"   ${f?.durum==='gecikti'  ?'selected':''}>Gecikti</option>
          <option value="iptal"     ${f?.durum==='iptal'    ?'selected':''}>İptal</option>
        </select></div>
      <div class="form-group"><label>Notlar</label><textarea id="f_notlar">${f?.notlar||''}</textarea></div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn-primary" onclick="saveFatura()">Kaydet</button>
      </div>`;
  }

  else if (type === 'odeme') {
    const o = id ? DB.odemeler.find(x=>x.id===id) : null;
    title.textContent = 'Ödeme Kaydı';
    const fOpts = DB.faturalar
      .filter(f=>f.durum!=='iptal')
      .map(f=>`<option value="${f.id}" ${o?.faturaId===f.id?'selected':''}>${f.no} — ${musteriAd(f.musteriId)} (${para(f.tutar)})</option>`).join('');
    body.innerHTML = `
      <div class="form-group"><label>Fatura</label>
        <select id="o_fatura"><option value="">Seçin...</option>${fOpts}</select></div>
      <div class="form-row">
        <div class="form-group"><label>Ödeme Tutarı</label><input id="o_tutar" type="number" value="${o?.tutar||''}" placeholder="0.00" /></div>
        <div class="form-group"><label>Tarih</label><input id="o_tarih" type="date" value="${o?.tarih||today()}" /></div>
      </div>
      <div class="form-group"><label>Ödeme Yöntemi</label>
        <select id="o_yontem">
          <option value="nakit"  ${o?.yontem==='nakit' ?'selected':''}>Nakit</option>
          <option value="havale" ${o?.yontem==='havale'?'selected':''}>Havale / EFT</option>
          <option value="kredi"  ${o?.yontem==='kredi' ?'selected':''}>Kredi Kartı</option>
          <option value="cek"    ${o?.yontem==='cek'   ?'selected':''}>Çek</option>
          <option value="diger"  ${o?.yontem==='diger' ?'selected':''}>Diğer</option>
        </select></div>
      <div class="form-group"><label>Not</label><textarea id="o_notlar">${o?.notlar||''}</textarea></div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn-primary" onclick="saveOdeme()">Kaydet</button>
      </div>`;
  }

  else if (type === 'musteri') {
    const m = id ? DB.musteriler.find(x=>x.id===id) : null;
    title.textContent = m ? 'Müşteriyi Düzenle' : 'Yeni Müşteri';
    body.innerHTML = `
      <div class="form-group"><label>Ad / Firma Adı</label><input id="m_ad" value="${m?.ad||''}" /></div>
      <div class="form-row">
        <div class="form-group"><label>E-posta</label><input id="m_email" type="email" value="${m?.email||''}" /></div>
        <div class="form-group"><label>Telefon</label><input id="m_tel" value="${m?.tel||''}" /></div>
      </div>
      <div class="form-group"><label>Adres</label><textarea id="m_adres">${m?.adres||''}</textarea></div>
      <div class="form-group"><label>Vergi No / TC</label><input id="m_vkn" value="${m?.vkn||''}" /></div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="closeModal()">İptal</button>
        <button class="btn-primary" onclick="saveMusteri()">Kaydet</button>
      </div>`;
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editTarget = null;
}

// ── SAVE FUNCTIONS ───────────────────────
function saveFatura() {
  const no       = document.getElementById('f_no').value.trim();
  const musteriId= document.getElementById('f_musteri').value;
  const tutar    = parseFloat(document.getElementById('f_tutar').value) || 0;
  const kdv      = parseFloat(document.getElementById('f_kdv').value) || 0;
  const tarih    = document.getElementById('f_tarih').value;
  const vade     = document.getElementById('f_vade').value;
  const durum    = document.getElementById('f_durum').value;
  const notlar   = document.getElementById('f_notlar').value;

  if (!no || !musteriId || !tutar) { toast('Lütfen gerekli alanları doldurun.','error'); return; }

  const list = DB.faturalar;
  if (editTarget) {
    const i = list.findIndex(x=>x.id===editTarget);
    if (i>-1) list[i] = { ...list[i], no, musteriId, tutar, kdv, tarih, vade, durum, notlar };
  } else {
    list.push({ id: 'f'+uid(), no, musteriId, tutar, kdv, tarih, vade, durum, notlar });
  }
  DB.faturalar = list;
  closeModal();
  toast('Fatura kaydedildi.','success');
  renderFaturalar();
}

function saveOdeme() {
  const faturaId = document.getElementById('o_fatura').value;
  const tutar    = parseFloat(document.getElementById('o_tutar').value) || 0;
  const tarih    = document.getElementById('o_tarih').value;
  const yontem   = document.getElementById('o_yontem').value;
  const notlar   = document.getElementById('o_notlar').value;

  if (!faturaId || !tutar) { toast('Fatura ve tutar zorunludur.','error'); return; }

  const oList = DB.odemeler;
  oList.push({ id: 'o'+uid(), faturaId, tutar, tarih, yontem, notlar });
  DB.odemeler = oList;

  // Fatura tutarı karşılandıysa odendi yap
  const f = DB.faturalar.find(x=>x.id===faturaId);
  if (f) {
    const toplamOdeme = oList.filter(o=>o.faturaId===faturaId).reduce((s,o)=>s+Number(o.tutar||0),0);
    const fList = DB.faturalar.map(x => x.id===faturaId
      ? { ...x, durum: toplamOdeme >= Number(x.tutar) ? 'odendi' : 'beklemede' }
      : x
    );
    DB.faturalar = fList;
  }

  closeModal();
  toast('Ödeme kaydedildi.','success');
  renderOdemeler();
}

function saveMusteri() {
  const ad   = document.getElementById('m_ad').value.trim();
  const email= document.getElementById('m_email').value.trim();
  const tel  = document.getElementById('m_tel').value.trim();
  const adres= document.getElementById('m_adres').value.trim();
  const vkn  = document.getElementById('m_vkn').value.trim();

  if (!ad) { toast('Müşteri adı zorunludur.','error'); return; }

  const list = DB.musteriler;
  if (editTarget) {
    const i = list.findIndex(x=>x.id===editTarget);
    if (i>-1) list[i] = { ...list[i], ad, email, tel, adres, vkn };
  } else {
    list.push({ id: 'm'+uid(), ad, email, tel, adres, vkn });
  }
  DB.musteriler = list;
  closeModal();
  toast('Müşteri kaydedildi.','success');
  renderMusteriler();
}

// ── EDIT / DELETE ────────────────────────
function editFatura(id) { openModal('fatura', id); }
function editMusteri(id){ openModal('musteri', id); }

function odemeAl(faturaId) {
  openModal('odeme');
  setTimeout(() => {
    const sel = document.getElementById('o_fatura');
    if (sel) sel.value = faturaId;
    const f = DB.faturalar.find(x=>x.id===faturaId);
    if (f) {
      const odemeler = DB.odemeler.filter(o=>o.faturaId===faturaId).reduce((s,o)=>s+Number(o.tutar||0),0);
      const kalan = Number(f.tutar) - odemeler;
      const inp = document.getElementById('o_tutar');
      if (inp && kalan>0) inp.value = kalan;
    }
  }, 50);
}

function silFatura(id) {
  if (!confirm('Bu fatura silinsin mi?')) return;
  DB.faturalar = DB.faturalar.filter(x=>x.id!==id);
  DB.odemeler  = DB.odemeler.filter(x=>x.faturaId!==id);
  toast('Fatura silindi.','error');
  renderFaturalar();
}

function silOdeme(id) {
  if (!confirm('Bu ödeme kaydı silinsin mi?')) return;
  DB.odemeler = DB.odemeler.filter(x=>x.id!==id);
  toast('Ödeme silindi.','error');
  renderOdemeler();
}

function silMusteri(id) {
  if (!confirm('Bu müşteri silinsin mi? İlgili faturalar etkilenmez.')) return;
  DB.musteriler = DB.musteriler.filter(x=>x.id!==id);
  toast('Müşteri silindi.','error');
  renderMusteriler();
}

// ── AUTO FATURA NO ────────────────────────
function autoFaturaNo() {
  const list = DB.faturalar;
  const nums = list.map(f=>{
    const m = f.no?.match(/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  const next = Math.max(0, ...nums) + 1;
  return 'F-' + String(next).padStart(3,'0');
}

// ── EXPORT / IMPORT ──────────────────────
function exportData() {
  const data = {
    faturalar: DB.faturalar,
    odemeler:  DB.odemeler,
    musteriler: DB.musteriler,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'fatura-takip-yedek-' + today() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Veriler dışa aktarıldı.','success');
}

function importData() { document.getElementById('importFile').click(); }

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.faturalar)  DB.faturalar  = data.faturalar;
      if (data.odemeler)   DB.odemeler   = data.odemeler;
      if (data.musteriler) DB.musteriler = data.musteriler;
      toast('Veriler içe aktarıldı.','success');
      navigate(currentPage);
    } catch {
      toast('Geçersiz dosya formatı.','error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ── TOAST ────────────────────────────────
let toastTimer;
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
