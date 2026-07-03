const WHATSAPP_NEGOCIO = '529511234567'; // Cambia este número por el WhatsApp del restaurante con lada: 52 + número
const OWNER_PASSWORD = '05'; // Cambia esta contraseña para entrar al panel del propietario
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const today = new Date().toISOString().slice(0,10);
const money = n => `$${Number(n).toFixed(2)}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

const menu = [
  {name:'Enfrijoladas Oaxaqueñas',cat:'desayunos',price:160,icon:'🍽️',desc:'Tortillas con pollo, frijol negro, queso fresco y crema.'},
  {name:'Huevos Oaxaqueños',cat:'desayunos',price:135,icon:'🍳',desc:'Huevos al gusto con salsa de la casa, frijoles y pan artesanal.'},
  {name:'Tlayuda Especial',cat:'comida',price:190,icon:'🌮',desc:'Tlayuda con asiento, frijol, quesillo, aguacate y proteína.'},
  {name:'Mole de la casa',cat:'comida',price:210,icon:'🍗',desc:'Mole tradicional con pollo, arroz y tortillas hechas a man.'},
  {name:'Café Americano',cat:'bebidas',price:45,icon:'☕',desc:'Café de altura recién preparado.'},
  {name:'Chocolate Oaxaqueño',cat:'bebidas',price:65,icon:'🍫',desc:'Chocolate artesanal con leche o agua.'},
];
const tablesBase = [
  {id:1,cap:2,zona:'Ventana'}, {id:2,cap:2,zona:'Café'}, {id:3,cap:4,zona:'Centro'}, {id:4,cap:4,zona:'Centro'},
  {id:5,cap:6,zona:'Familiar'}, {id:6,cap:4,zona:'Terraza'}, {id:7,cap:2,zona:'Jardín'}, {id:8,cap:6,zona:'Mirador'}
];
let cart = JSON.parse(localStorage.getItem('ml_cart') || '[]');
let selectedTable = null;
let selectedCat = 'todos';

function store(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
function load(key, fallback){ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
function reservations(){ return load('ml_reservations', []); }
function orders(){ return load('ml_orders', []); }

function getStatus(tableId, date=$('#resDate')?.value || today, time=$('#resTime')?.value || '8:00 AM'){
  const r = reservations().find(x => x.tableId == tableId && x.date === date && x.time === time && x.status !== 'cancelada');
  return r ? r.status : 'disponible';
}
function getReservationForTable(tableId, date=today){
  return reservations().find(x => x.tableId == tableId && x.date === date && x.status !== 'cancelada');
}

function renderMenu(){
  $('#menuGrid').innerHTML = menu.filter(m => selectedCat === 'todos' || m.cat === selectedCat).map(item => `
    <article class="menu-card"><div class="icon">${item.icon}</div><h3>${item.name}</h3><p>${item.desc}</p><div class="price">${money(item.price)}</div><button class="btn primary full" onclick='addItem(${JSON.stringify(item)})'>Agregar al pedido</button></article>
  `).join('');
}
function addItem(item){
  const found = cart.find(x => x.name === item.name);
  if(found) found.qty++; else cart.push({...item, qty:1});
  saveCart(); openCartPanel();
}
function saveCart(){ store('ml_cart', cart); renderCart(); }
function renderCart(){
  $('#cartCount').textContent = cart.reduce((a,b)=>a+b.qty,0); $('#floatCount').textContent = $('#cartCount').textContent;
  $('#cartItems').innerHTML = cart.length ? cart.map((x,i)=>`<div class="cart-item"><div><b>${x.name}</b><br><small>${x.qty} x ${money(x.price)}</small></div><button class="tiny" onclick="removeCart(${i})">Quitar</button></div>`).join('') : '<p class="muted">Tu pedido está vacío.</p>';
  $('#cartTotal').textContent = money(cart.reduce((a,b)=>a + b.price*b.qty,0));
  renderOrderTableOptions();
}
function removeCart(i){ cart.splice(i,1); saveCart(); }
function openCartPanel(){ $('#cartPanel').classList.add('open'); }

function renderTables(){
  const date = $('#resDate').value || today; const time = $('#resTime').value || '8:00 AM';
  $('#tables').innerHTML = tablesBase.map(t => {
    const status = getStatus(t.id,date,time);
    const cls = status === 'confirmada' ? 'busy' : status === 'pendiente' ? 'pending' : '';
    const disabled = status === 'confirmada' ? 'data-disabled="1"' : '';
    return `<div class="table ${cls} ${selectedTable==t.id?'selected':''}" ${disabled} onclick="selectTable(${t.id},'${status}')">Mesa ${t.id}<small>${t.zona} · ${t.cap} pers.</small><small>${status}</small></div>`;
  }).join('');
}
function selectTable(id,status){
  if(status === 'confirmada'){ alert('Esta mesa ya está ocupada para ese horario.'); return; }
  selectedTable = id; renderTables();
}
function createReservation(){
  const form = $('#reservationForm'); if(!form.reportValidity()) return;
  if(!selectedTable){ alert('Selecciona una mesa disponible.'); return; }
  const r = {id:uid(), name:$('#resName').value.trim(), phone:$('#resPhone').value.trim(), date:$('#resDate').value, time:$('#resTime').value, people:$('#resPeople').value, notes:$('#resNotes').value.trim(), tableId:selectedTable, status:'pendiente', createdAt:new Date().toISOString()};
  const all = reservations(); all.push(r); store('ml_reservations', all);
  selectedTable = null; renderAll();
  const msg = `Hola ${r.name}, recibimos tu solicitud de reservación en Mi Legado Cumbre Salamar.\n\nMesa: ${r.tableId}\nFecha: ${r.date}\nHora: ${r.time}\nPersonas: ${r.people}\nEstado: PENDIENTE de confirmación.\n\nEn breve te confirmamos disponibilidad.`;
  window.open(`https://wa.me/${cleanPhone(r.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
}
function cleanPhone(p){
  const digits = String(p).replace(/\D/g,'');
  if(digits.startsWith('52')) return digits;
  return '52' + digits;
}
function confirmReservation(id){
  const all = reservations(); const r = all.find(x=>x.id===id); if(!r) return;
  r.status = 'confirmada'; store('ml_reservations', all); renderAll();
  const msg = `Hola ${r.name}, tu reservación en Mi Legado Cumbre Salamar está CONFIRMADA ✅\n\nMesa: ${r.tableId}\nFecha: ${r.date}\nHora: ${r.time}\nPersonas: ${r.people}\n\nTe esperamos.`;
  window.open(`https://wa.me/${cleanPhone(r.phone)}?text=${encodeURIComponent(msg)}`, '_blank');
}
function cancelReservation(id){
  const all = reservations(); const r = all.find(x=>x.id===id); if(!r) return;
  r.status = 'cancelada'; store('ml_reservations', all); renderAll();
}
function freeReservation(id){
  const all = reservations(); const r = all.find(x=>x.id===id); if(!r) return;
  r.status = 'liberada'; store('ml_reservations', all); renderAll();
}
function renderReservations(){
  const date = $('#adminDate').value || today;
  const rows = reservations().filter(r=>r.date===date && r.status !== 'cancelada').sort((a,b)=>a.time.localeCompare(b.time));
  $('#reservationList').innerHTML = rows.length ? rows.map(r => `<tr><td>${r.time}</td><td>Mesa ${r.tableId}</td><td>${r.name}<br><small>${r.phone}</small></td><td>${r.people}</td><td>${r.status}</td><td><div class="actions"><button class="confirm" onclick="confirmReservation('${r.id}')">Confirmar WhatsApp</button><button class="cancel" onclick="cancelReservation('${r.id}')">Cancelar</button><button class="free" onclick="freeReservation('${r.id}')">Liberar</button></div></td></tr>`).join('') : '<tr><td colspan="6">No hay reservaciones para este día.</td></tr>';
}
function renderOrderTableOptions(){
  const active = reservations().filter(r=>r.status==='confirmada' || r.status==='pendiente');
  $('#orderTable').innerHTML = '<option value="">Sin mesa</option>' + active.map(r=>`<option value="${r.tableId}">Mesa ${r.tableId} - ${r.name}</option>`).join('');
}
function saveOrder(){
  if(!cart.length){ alert('Agrega productos al pedido.'); return; }
  const order = {id:uid(), tableId:$('#orderTable').value || null, type:$('#orderType').value, notes:$('#orderNotes').value.trim(), items:cart, total:cart.reduce((a,b)=>a+b.price*b.qty,0), paid:false, createdAt:new Date().toISOString()};
  const all = orders(); all.push(order); store('ml_orders', all);
  const msg = `Nuevo pedido Mi Legado Cumbre Salamar\n\n${order.tableId ? 'Mesa: '+order.tableId+'\n' : ''}Tipo: ${order.type}\n${order.items.map(i=>`- ${i.qty} ${i.name} ${money(i.price*i.qty)}`).join('\n')}\n\nTotal: ${money(order.total)}\nNotas: ${order.notes || 'Sin notas'}`;
  cart = []; saveCart(); renderAll(); window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(msg)}`,'_blank');
}
function renderOrders(){
  const grouped = {};
  orders().forEach(o => { const key = o.tableId ? `Mesa ${o.tableId}` : 'Sin mesa / Para llevar'; (grouped[key] ||= []).push(o); });
  $('#ordersByTable').innerHTML = Object.keys(grouped).length ? Object.entries(grouped).map(([k,arr])=>`<div class="order-card"><h3>${k}</h3>${arr.map(o=>`<p><b>${new Date(o.createdAt).toLocaleString()}</b><br>${o.items.map(i=>`${i.qty} ${i.name}`).join(', ')}<br><b>Total: ${money(o.total)}</b><br><small>${o.paid ? 'Pagado' : 'Pendiente de pago'}</small></p>`).join('')}</div>`).join('') : '<p class="muted">Todavía no hay pedidos guardados.</p>';
}
function getBillGroups(){
  const grouped = {};
  orders().forEach(o => {
    const key = o.tableId ? `Mesa ${o.tableId}` : 'Sin mesa / Para llevar';
    if(!grouped[key]) grouped[key] = {key, orders:[], total:0, pending:0, paid:0};
    grouped[key].orders.push(o);
    grouped[key].total += Number(o.total || 0);
    if(o.paid) grouped[key].paid += Number(o.total || 0); else grouped[key].pending += Number(o.total || 0);
  });
  return Object.values(grouped);
}
function markBillPaid(key){
  const all = orders().map(o => {
    const k = o.tableId ? `Mesa ${o.tableId}` : 'Sin mesa / Para llevar';
    if(k === key) o.paid = true;
    return o;
  });
  store('ml_orders', all); renderAll();
}
function markOrderPaid(id){
  const all = orders(); const o = all.find(x=>x.id===id); if(o) o.paid = true;
  store('ml_orders', all); renderAll();
}
function sendBillWhatsApp(key){
  const group = getBillGroups().find(g=>g.key===key); if(!group) return;
  const lines = group.orders.flatMap(o => o.items.map(i => `- ${i.qty} ${i.name}: ${money(i.price*i.qty)}`));
  const msg = `Cuenta Mi Legado Cumbre Salamar\n\n${group.key}\n${lines.join('\n')}\n\nTotal: ${money(group.total)}\nPendiente por pagar: ${money(group.pending)}\n\nGracias por tu compra.`;
  window.open(`https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(msg)}`,'_blank');
}
function renderBills(){
  const groups = getBillGroups();
  const total = groups.reduce((a,g)=>a+g.total,0), pending = groups.reduce((a,g)=>a+g.pending,0), paid = groups.reduce((a,g)=>a+g.paid,0);
  $('#billSummary').innerHTML = `<div class="stat-card"><h3>Total vendido</h3><h2>${money(total)}</h2></div><div class="stat-card"><h3>Pagado</h3><h2>${money(paid)}</h2></div><div class="stat-card"><h3>Pendiente por cobrar</h3><h2>${money(pending)}</h2></div>`;
  $('#billList').innerHTML = groups.length ? groups.map(g => `<tr><td><b>${g.key}</b></td><td>${g.orders.map(o=>`<div class="bill-order"><b>${new Date(o.createdAt).toLocaleTimeString()}</b> · ${o.items.map(i=>`${i.qty} ${i.name}`).join(', ')}<br><small>${o.paid ? 'Pagado' : 'Pendiente'} · ${money(o.total)}</small> ${!o.paid ? `<button class="mini-pay" onclick="markOrderPaid('${o.id}')">Pagar este pedido</button>` : ''}</div>`).join('')}</td><td><b>${money(g.total)}</b><br><small>Pendiente: ${money(g.pending)}</small></td><td>${g.pending <= 0 ? 'Pagado' : 'Pendiente'}</td><td><div class="actions"><button class="confirm" onclick="markBillPaid('${g.key}')">Marcar cuenta pagada</button><button class="free" onclick="sendBillWhatsApp('${g.key}')">Enviar cuenta WhatsApp</button></div></td></tr>`).join('') : '<tr><td colspan="5">Todavía no hay cuentas para cobrar.</td></tr>';
}
function renderStats(){
  const rs = reservations(), os = orders();
  const totalVentas = os.reduce((a,b)=>a+b.total,0);
  const pendienteCobro = os.filter(o=>!o.paid).reduce((a,b)=>a+b.total,0);
  const confirmadas = rs.filter(r=>r.status==='confirmada').length;
  const pendientes = rs.filter(r=>r.status==='pendiente').length;
  $('#statsGrid').innerHTML = `<div class="stat-card"><h3>Ventas</h3><h2>${money(totalVentas)}</h2></div><div class="stat-card"><h3>Por cobrar</h3><h2>${money(pendienteCobro)}</h2></div><div class="stat-card"><h3>Reservas confirmadas</h3><h2>${confirmadas}</h2></div><div class="stat-card"><h3>Pendientes</h3><h2>${pendientes}</h2></div>`;
  const prod = {};
  os.flatMap(o=>o.items).forEach(i=>{ prod[i.name]=(prod[i.name]||0)+i.qty; });
  const top = Object.entries(prod).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $('#topProducts').innerHTML = `<h3>Productos más vendidos</h3>${top.length ? top.map(([n,q],idx)=>`<p>${idx+1}. <b>${n}</b> — ${q} vendidos</p>`).join('') : '<p class="muted">Aún no hay datos de ventas.</p>'}`;
}

function showOwnerPanel(){
  $('#ownerLogin').classList.add('hidden');
  $('#adminContent').classList.add('open');
  sessionStorage.setItem('ml_owner_access','yes');
  renderAll();
}
function hideOwnerPanel(){
  $('#adminContent').classList.remove('open');
  $('#ownerLogin').classList.remove('hidden');
  sessionStorage.removeItem('ml_owner_access');
}
function checkOwnerAccess(){
  if(sessionStorage.getItem('ml_owner_access') === 'yes') showOwnerPanel();
}

function renderAll(){ renderTables(); renderReservations(); renderOrders(); renderBills(); renderStats(); renderCart(); }

window.addEventListener('storage', renderAll);
$('#menuToggle').onclick = () => $('#navMenu').classList.toggle('open');
$('#openCart').onclick = openCartPanel; $('#floatingCart').onclick = openCartPanel; $('#closeCart').onclick = () => $('#cartPanel').classList.remove('open');
$$('.filter').forEach(b=>b.onclick=()=>{ $$('.filter').forEach(x=>x.classList.remove('active')); b.classList.add('active'); selectedCat=b.dataset.cat; renderMenu(); });
$$('.pill-group').forEach(g=>g.addEventListener('click',e=>{ if(e.target.classList.contains('pill')){ g.querySelectorAll('.pill').forEach(p=>p.classList.remove('active')); e.target.classList.add('active'); } }));
$$('[data-inc]').forEach(b=>b.onclick=()=>{ const input=$('#'+b.dataset.inc); input.value=Number(input.value)+1; });
$$('[data-dec]').forEach(b=>b.onclick=()=>{ const input=$('#'+b.dataset.dec); input.value=Math.max(1,Number(input.value)-1); });
$('#addCoffee').onclick = () => { const size=$('#coffeeSize'); const tipo=$('[data-group="tipo"] .active').textContent; const tueste=$('[data-group="tueste"] .active').textContent; addItem({name:`Café ${tipo} ${tueste} ${size.value}`,price:Number(size.selectedOptions[0].dataset.price),icon:'☕',desc:'Café artesanal',cat:'cafe',qty:Number($('#coffeeQty').value)}); };
['resDate','resTime'].forEach(id=>$('#'+id).addEventListener('change',()=>{selectedTable=null;renderTables();}));
$('#refreshTables').onclick = renderTables; $('#sendReservation').onclick = createReservation; $('#sendOrder').onclick = saveOrder;
$$('.tab').forEach(b=>b.onclick=()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); $$('.admin-panel').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#'+b.dataset.tab+'Panel').classList.add('active'); });
$('#adminDate').addEventListener('change', renderReservations); $('#clearOld').onclick=()=>{ if(confirm('¿Quieres borrar reservaciones y pedidos guardados en este navegador?')){ localStorage.removeItem('ml_reservations'); localStorage.removeItem('ml_orders'); renderAll(); } };
$('#ownerAccess').onclick = () => { if($('#ownerPassword').value === OWNER_PASSWORD){ showOwnerPanel(); } else { alert('Contraseña incorrecta.'); } };
$('#ownerPassword').addEventListener('keydown', e => { if(e.key === 'Enter') $('#ownerAccess').click(); });
$('#ownerLogout').onclick = hideOwnerPanel;

$('#resDate').value = today; $('#adminDate').value = today;
renderMenu(); renderAll(); checkOwnerAccess();
