/* ===== 데이터 (나중에 데이터베이스 테이블로 옮기기 쉽게 맨 위에 모음) =====
   category = 장르(발라드/재즈/팝송), artist = 가수 — 서로 다른 칸(컬럼)으로 분리 */
const PRODUCTS = [
  { id: 1, name: "밤하늘의 편지", category: "발라드", price: 15000, stock: 30, artist: "이서윤", img: "img/cd1.svg", desc: "잔잔한 피아노와 목소리로 채운 감성 발라드 앨범입니다." },
  { id: 2, name: "겨울이 지나면", category: "발라드", price: 14500, stock: 25, artist: "정하늘", img: "img/cd2.svg", desc: "추운 계절에 어울리는 따뜻한 위로의 노래 10곡." },
  { id: 3, name: "그날의 우리", category: "발라드", price: 16000, stock: 20, artist: "한도윤", img: "img/cd3.svg", desc: "지난 추억을 떠올리게 하는 서정적인 발라드 모음." },
  { id: 4, name: "Midnight Blue Café", category: "재즈", price: 18000, stock: 15, artist: "The Blue Quartet", img: "img/cd4.svg", desc: "늦은 밤 카페에서 듣기 좋은 부드러운 재즈 쿼텟." },
  { id: 5, name: "Sunday Piano", category: "재즈", price: 17000, stock: 18, artist: "Mina Park Trio", img: "img/cd5.svg", desc: "일요일 오후처럼 느긋한 피아노 트리오 연주집." },
  { id: 6, name: "Smoky Lounge", category: "재즈", price: 19500, stock: 10, artist: "Harlan Brooks", img: "img/cd6.svg", desc: "색소폰의 깊은 울림이 매력적인 라운지 재즈." },
  { id: 7, name: "Summer Drive", category: "팝송", price: 13000, stock: 40, artist: "Neon Coast", img: "img/cd7.svg", desc: "창문을 내리고 듣기 좋은 경쾌한 팝 앨범." },
  { id: 8, name: "Pop Parade 2026", category: "팝송", price: 14000, stock: 35, artist: "Various Artists", img: "img/cd8.svg", desc: "올해의 인기 팝송만 모은 컴필레이션 CD." }
];
const GRADES = [
  { level: 1, name: "브론즈", minSpent: 0, rate: 1 },
  { level: 2, name: "실버", minSpent: 50000, rate: 3 },
  { level: 3, name: "골드", minSpent: 150000, rate: 5 },
  { level: 4, name: "VIP", minSpent: 300000, rate: 7 }
];
const SIGNUP_POINTS = 3000;
const CATEGORIES = ["전체", "발라드", "재즈", "팝송"];

/* ===== 저장소 (데이터베이스 연결 전까지 브라우저에 저장) ===== */
const $ = s => document.querySelector(s);
const won = n => n.toLocaleString("ko-KR") + "원";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let users = load("cd_users", []), me = load("cd_me", null), cart = load("cd_cart", []);
let orders = load("cd_orders", []), stockMap = load("cd_stock", {});
let filter = { cat: "전체", artist: "전체", q: "" };

const stockOf = p => (stockMap[p.id] !== undefined ? stockMap[p.id] : p.stock);
const prod = id => PRODUCTS.find(p => p.id === Number(id));
const user = () => users.find(u => u.id === me);
const gradeOf = spent => GRADES.filter(g => spent >= g.minSpent).pop();
const cartTotal = () => cart.reduce((s, c) => s + prod(c.id).price * c.qty, 0);

/* ===== 화면 전환 ===== */
const VIEWS = ["home", "products", "detail", "cart", "checkout", "done", "login", "signup", "mypage"];
function route() {
  const [v, arg] = (location.hash.slice(1) || "home").split("/");
  let view = VIEWS.includes(v) ? v : (v === "product" ? "detail" : "home");
  if (v === "product" && !prod(arg)) view = "products";
  if (["checkout", "mypage"].includes(view) && !user()) { alert("로그인이 필요합니다."); location.hash = "login"; return; }
  VIEWS.forEach(id => { $("#" + id).hidden = id !== view; });
  ({ home: renderHome, products: renderProducts, detail: () => renderDetail(arg), cart: renderCart,
     checkout: renderCheckout, done: () => renderDone(arg), mypage: renderMy }[view] || (() => {}))();
  document.querySelectorAll(".nav a").forEach(a => {
    const on = a.getAttribute("href") === "#" + view && (!a.dataset.cat || (view === "products" && a.dataset.cat === filter.cat));
    a.classList.toggle("active", on);
  });
  updateHeader();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-cat]");
  if (!a) return;
  filter.cat = a.dataset.cat; filter.artist = "전체"; filter.q = ""; $("#searchInput").value = "";
  if (location.hash === "#products") route();
});

function updateHeader() {
  const u = user();
  $("#userLinks").innerHTML = u
    ? `<a href="#mypage">${esc(u.name)}님 (${gradeOf(u.spent).name})</a><button id="logoutBtn" type="button">로그아웃</button>`
    : `<a href="#login">로그인</a><a href="#signup">회원가입</a>`;
  const lo = $("#logoutBtn");
  if (lo) lo.onclick = () => { me = null; save("cd_me", me); location.hash = "home"; route(); };
  $("#cartCount").textContent = cart.reduce((s, c) => s + c.qty, 0);
}

/* ===== 상품 목록 ===== */
const metaHTML = p => `<dl class="meta"><div><dt>장르</dt><dd><span class="tag">${p.category}</span></dd></div><div><dt>가수</dt><dd>${esc(p.artist)}</dd></div></dl>`;
function cardHTML(p) {
  const out = stockOf(p) <= 0;
  return `<article class="card"><a class="thumb" href="#product/${p.id}"><img src="${p.img}" alt="${esc(p.name)} 앨범 그림" loading="lazy"></a>
  <div class="body"><h3>${esc(p.name)}</h3>${metaHTML(p)}
  <span class="price">${won(p.price)}</span>${out ? '<span class="soldout">품절</span>' : ""}
  ${out ? "" : `<button class="btn" type="button" data-add="${p.id}">장바구니 담기</button>`}</div></article>`;
}
function bindAdd(root) {
  root.querySelectorAll("[data-add]").forEach(b => b.onclick = () => addCart(b.dataset.add, 1));
}
function renderHome() {
  $("#homeGrid").innerHTML = PRODUCTS.slice(0, 4).map(cardHTML).join("");
  bindAdd($("#homeGrid"));
  $("#gradeList").innerHTML = GRADES.map(g => `<div class="grade"><b>${g.name}</b><span class="rate">${g.rate}%</span><span class="muted">${g.minSpent ? won(g.minSpent) + " 이상 구매" : "가입 시 시작"}</span></div>`).join("");
}
function renderProducts() {
  $("#chips").innerHTML = CATEGORIES.map(c => `<button type="button" class="${c === filter.cat ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
  $("#chips").querySelectorAll("button").forEach(b => b.onclick = () => { filter.cat = b.dataset.c; filter.artist = "전체"; renderProducts(); });
  const artists = ["전체", ...new Set(PRODUCTS.filter(p => filter.cat === "전체" || p.category === filter.cat).map(p => p.artist))];
  if (!artists.includes(filter.artist)) filter.artist = "전체";
  const sel = $("#artistSelect");
  sel.innerHTML = artists.map(a => `<option value="${esc(a)}"${a === filter.artist ? " selected" : ""}>${esc(a)}</option>`).join("");
  sel.onchange = () => { filter.artist = sel.value; renderProducts(); };
  const q = filter.q.trim().toLowerCase();
  const list = PRODUCTS.filter(p => (filter.cat === "전체" || p.category === filter.cat) && (filter.artist === "전체" || p.artist === filter.artist) && (!q || (p.name + p.artist).toLowerCase().includes(q)));
  $("#listTitle").textContent = filter.cat === "전체" ? "전체 상품" : filter.cat + " CD";
  $("#resultInfo").textContent = (filter.artist !== "전체" ? `가수 ${filter.artist} · ` : "") + (q ? `"${filter.q}" 검색 결과 ` : "") + `${list.length}개`;
  $("#productGrid").innerHTML = list.length ? list.map(cardHTML).join("") : '<p>검색 결과가 없습니다. 다른 검색어를 입력하거나 분류를 바꿔 보세요.</p>';
  bindAdd($("#productGrid"));
}
$("#searchForm").addEventListener("submit", e => {
  e.preventDefault();
  filter.q = $("#searchInput").value; filter.cat = "전체"; filter.artist = "전체";
  if (location.hash === "#products") route(); else location.hash = "products";
});

/* ===== 상품 상세 ===== */
function renderDetail(id) {
  const p = prod(id), st = stockOf(p);
  $("#detailBox").innerHTML = `<div class="detail"><img src="${p.img}" alt="${esc(p.name)} 앨범 그림"><div>
  <h2>${esc(p.name)}</h2>${metaHTML(p)}
  <p>${esc(p.desc)}</p><p class="big">${won(p.price)}</p>
  <p class="muted">재고 ${st > 0 ? st + "개" : "품절"}</p>
  ${st > 0 ? `<div class="qty"><button type="button" id="qm" aria-label="수량 줄이기">−</button><input id="qv" value="1" inputmode="numeric" aria-label="수량"><button type="button" id="qp" aria-label="수량 늘리기">+</button></div>
  <div class="row-btn"><button class="btn" type="button" id="addBtn">장바구니 담기</button><button class="btn sub" type="button" id="buyBtn">바로 구매</button></div>` : '<p class="soldout">품절된 상품입니다.</p>'}
  <p><a href="#products">← 목록으로</a></p></div></div>`;
  if (st <= 0) return;
  const qv = $("#qv"), get = () => Math.min(st, Math.max(1, parseInt(qv.value) || 1));
  $("#qm").onclick = () => qv.value = Math.max(1, get() - 1);
  $("#qp").onclick = () => qv.value = Math.min(st, get() + 1);
  qv.onchange = () => qv.value = get();
  $("#addBtn").onclick = () => addCart(p.id, get());
  $("#buyBtn").onclick = () => { if (addCart(p.id, get(), true)) location.hash = "cart"; };
}

/* ===== 장바구니 ===== */
function addCart(id, qty, silent) {
  const p = prod(id), st = stockOf(p), line = cart.find(c => c.id === p.id);
  const next = (line ? line.qty : 0) + qty;
  if (next > st) { alert(`재고가 부족합니다. (남은 수량 ${st}개)`); return false; }
  if (line) line.qty = next; else cart.push({ id: p.id, qty });
  save("cd_cart", cart); updateHeader();
  if (!silent && confirm(`"${p.name}"을(를) 장바구니에 담았습니다.\n장바구니로 이동할까요?`)) location.hash = "cart";
  return true;
}
function renderCart() {
  const box = $("#cartBox");
  if (!cart.length) { box.innerHTML = '<p>장바구니가 비어 있습니다.</p><a class="btn" href="#products">CD 둘러보기</a>'; return; }
  box.innerHTML = cart.map(c => { const p = prod(c.id); return `<div class="cart-item"><img src="${p.img}" alt="${esc(p.name)}">
  <div class="info"><b>${esc(p.name)}</b><span class="muted">${esc(p.artist)} · ${won(p.price)}</span></div>
  <div class="side"><div class="qty"><button type="button" data-m="${p.id}" aria-label="수량 줄이기">−</button><input value="${c.qty}" data-q="${p.id}" inputmode="numeric" aria-label="수량"><button type="button" data-p="${p.id}" aria-label="수량 늘리기">+</button></div>
  <b>${won(p.price * c.qty)}</b><button class="link-del" type="button" data-d="${p.id}">삭제</button></div></div>`; }).join("") +
  `<div class="sum"><p class="total"><span>합계</span><span>${won(cartTotal())}</span></p></div>
  <div class="row-btn"><a class="btn sub" href="#products">쇼핑 계속하기</a><a class="btn" href="#checkout">주문하기</a></div>`;
  const setQty = (id, q) => {
    const p = prod(id), line = cart.find(c => c.id === p.id);
    if (q > stockOf(p)) { alert(`재고가 부족합니다. (남은 수량 ${stockOf(p)}개)`); q = stockOf(p); }
    line.qty = Math.max(1, q); save("cd_cart", cart); renderCart(); updateHeader();
  };
  box.querySelectorAll("[data-m]").forEach(b => b.onclick = () => setQty(b.dataset.m, cart.find(c => c.id == b.dataset.m).qty - 1));
  box.querySelectorAll("[data-p]").forEach(b => b.onclick = () => setQty(b.dataset.p, cart.find(c => c.id == b.dataset.p).qty + 1));
  box.querySelectorAll("[data-q]").forEach(i => i.onchange = () => setQty(i.dataset.q, parseInt(i.value) || 1));
  box.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { cart = cart.filter(c => c.id != b.dataset.d); save("cd_cart", cart); renderCart(); updateHeader(); });
}

/* ===== 체험 결제 ===== */
function renderCheckout() {
  const u = user(), box = $("#checkoutBox");
  if (!cart.length) { box.innerHTML = '<p>주문할 상품이 없습니다.</p><a class="btn" href="#products">CD 둘러보기</a>'; return; }
  const g = gradeOf(u.spent), total = cartTotal();
  box.innerHTML = `<p class="muted">체험 결제입니다. 실제 결제는 되지 않고 주문 내역만 저장됩니다.</p>
  ${cart.map(c => { const p = prod(c.id); return `<div class="order"><b>${esc(p.name)}</b> × ${c.qty} <span style="float:right">${won(p.price * c.qty)}</span></div>`; }).join("")}
  <form id="payForm" class="form"><label>사용할 포인트 (보유 ${u.points.toLocaleString()}P)<input id="useP" type="number" min="0" max="${Math.min(u.points, total)}" value="0"></label>
  <p class="msg" id="payMsg"></p></form>
  <div class="sum"><p><span>상품 합계</span><span>${won(total)}</span></p><p><span>포인트 사용</span><span id="sUse">0P</span></p>
  <p class="total"><span>결제 금액</span><span id="sPay">${won(total)}</span></p>
  <p><span>적립 예정 (${g.name} ${g.rate}%)</span><span id="sEarn">${Math.floor(total * g.rate / 100).toLocaleString()}P</span></p></div>
  <div class="row-btn"><a class="btn sub" href="#cart">장바구니로</a><button class="btn" id="payBtn" type="button">체험 결제하기</button></div>`;
  const useP = $("#useP"), val = () => Math.min(u.points, total, Math.max(0, parseInt(useP.value) || 0));
  useP.oninput = () => { const use = val(), pay = total - use;
    $("#sUse").textContent = use.toLocaleString() + "P"; $("#sPay").textContent = won(pay);
    $("#sEarn").textContent = Math.floor(pay * g.rate / 100).toLocaleString() + "P"; };
  $("#payBtn").onclick = () => {
    for (const c of cart) { const p = prod(c.id); if (c.qty > stockOf(p)) { $("#payMsg").textContent = `"${p.name}" 재고가 부족합니다.`; return; } }
    const use = val(), pay = total - use, earn = Math.floor(pay * g.rate / 100);
    const order = { no: "CD" + Date.now(), user: u.id, date: new Date().toLocaleString("ko-KR"),
      items: cart.map(c => ({ id: c.id, name: prod(c.id).name, price: prod(c.id).price, qty: c.qty })), total, used: use, paid: pay, earned: earn };
    cart.forEach(c => { stockMap[c.id] = stockOf(prod(c.id)) - c.qty; });
    u.points = u.points - use + earn; u.spent += pay;
    orders.push(order); cart = [];
    save("cd_users", users); save("cd_orders", orders); save("cd_cart", cart); save("cd_stock", stockMap);
    location.hash = "done/" + order.no;
  };
}
function renderDone(no) {
  const o = orders.find(x => x.no === no);
  $("#doneBox").innerHTML = o ? `<h2>주문이 완료되었습니다</h2><p>주문번호 <b>${o.no}</b></p><p>결제 금액 ${won(o.paid)} · 사용 포인트 ${o.used.toLocaleString()}P · 적립 포인트 ${o.earned.toLocaleString()}P</p>
  <p class="muted">체험 결제이므로 실제로 결제되지 않았습니다.</p><div class="row-btn"><a class="btn" href="#mypage">주문 내역 보기</a><a class="btn sub" href="#products">쇼핑 계속하기</a></div>`
    : '<p>주문 정보를 찾을 수 없습니다.</p><a class="btn" href="#home">홈으로</a>';
}

/* ===== 회원 ===== */
$("#signupForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, id = f.id.value.trim(), msg = $("#signupMsg");
  if (id.length < 4) { msg.textContent = "아이디는 4자 이상 입력해 주세요."; return; }
  if (users.some(u => u.id === id)) { msg.textContent = "이미 사용 중인 아이디입니다."; return; }
  if (f.pw.value.length < 4) { msg.textContent = "비밀번호는 4자 이상 입력해 주세요."; return; }
  if (f.pw.value !== f.pw2.value) { msg.textContent = "비밀번호가 서로 다릅니다."; return; }
  users.push({ id, pw: f.pw.value, name: f.name.value.trim(), email: f.email.value.trim(), points: SIGNUP_POINTS, spent: 0, joined: new Date().toLocaleDateString("ko-KR") });
  me = id; save("cd_users", users); save("cd_me", me); f.reset(); msg.textContent = "";
  alert(`가입을 환영합니다! ${SIGNUP_POINTS.toLocaleString()}P가 지급되었습니다.`);
  location.hash = "mypage";
});
$("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, u = users.find(x => x.id === f.id.value.trim() && x.pw === f.pw.value);
  if (!u) { $("#loginMsg").textContent = "아이디 또는 비밀번호가 맞지 않습니다."; return; }
  me = u.id; save("cd_me", me); f.reset(); $("#loginMsg").textContent = "";
  location.hash = cart.length ? "cart" : "mypage";
  if (location.hash === "#login") route();
});
function renderMy() {
  const u = user(), g = gradeOf(u.spent), next = GRADES.find(x => x.minSpent > u.spent);
  const mine = orders.filter(o => o.user === u.id).reverse();
  const pct = next ? Math.min(100, Math.round((u.spent - g.minSpent) / (next.minSpent - g.minSpent) * 100)) : 100;
  $("#mypageBox").innerHTML = `<h2>마이페이지</h2><div class="mybox">
  <div><small>회원 등급</small><strong>${g.name} (${g.rate}% 적립)</strong></div>
  <div><small>보유 포인트</small><strong>${u.points.toLocaleString()}P</strong></div>
  <div><small>누적 구매 금액</small><strong>${won(u.spent)}</strong></div></div>
  <p>${esc(u.name)}님 · ${esc(u.email)} · 아이디 ${esc(u.id)} · 가입일 ${u.joined}</p>
  <div class="bar"><i style="width:${pct}%"></i></div>
  <p class="muted">${next ? `${next.name} 등급까지 ${won(next.minSpent - u.spent)} 남았습니다.` : "최고 등급입니다."}</p>
  <h2 style="margin-top:24px">등급별 적립률</h2><div class="grade-list">${GRADES.map(x => `<div class="grade ${x.level === g.level ? "me" : ""}"><b>${x.name}</b><span class="rate">${x.rate}%</span><span class="muted">${x.minSpent ? won(x.minSpent) + " 이상" : "기본"}</span></div>`).join("")}</div>
  <h2 style="margin-top:24px">주문 내역</h2>${mine.length ? mine.map(o => `<div class="order"><h4>${o.no} · ${o.date}</h4><ul>${o.items.map(i => `<li>${esc(i.name)} × ${i.qty}</li>`).join("")}</ul>
  <p>결제 ${won(o.paid)} · 사용 ${o.used.toLocaleString()}P · 적립 ${o.earned.toLocaleString()}P</p></div>`).join("") : '<p>아직 주문 내역이 없습니다.</p>'}`;
}

/* ===== 첫 화면 슬라이드 (6초마다 교차) ===== */
(function slider() {
  const slides = [...document.querySelectorAll("#slider .slide")], dots = $("#dots");
  let i = 0, timer;
  slides.forEach((_, n) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", (n + 1) + "번 슬라이드"); b.onclick = () => { go(n); restart(); }; dots.appendChild(b); });
  function go(n) { i = n; slides.forEach((s, k) => s.classList.toggle("on", k === i)); [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i)); }
  function restart() { clearInterval(timer); timer = setInterval(() => go((i + 1) % slides.length), 6000); }
  go(0); restart();
})();

route();
