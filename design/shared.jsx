// ===== ARVELL — shared tokens, icons, chrome, mock data =====

const C = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardHi: '#222222',
  line: '#2A2A2A',
  accent: '#FFD700',
  accentDim: '#3A3413',
  text: '#FFFFFF',
  sub: '#888888',
  sub2: '#AAAAAA',
  green: '#34C759',
  red: '#FF453A',
};

// ---------- Icons (stroke = currentColor) ----------
const Ic = {
  home: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  heart: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 20.5C5.5 16 3 12.5 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 3.7-2.5 7.2-9 11.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/></svg>),
  heartFill: (p) => (<svg viewBox="0 0 24 24" {...p}><path d="M12 20.5C5.5 16 3 12.5 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 3.7-2.5 7.2-9 11.7Z" fill="currentColor"/></svg>),
  chat: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4.5 20c.8-3.7 3.8-6 7.5-6s6.7 2.3 7.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  userFill: (p) => (<svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4.5 20c.8-3.7 3.8-6 7.5-6s6.7 2.3 7.5 6Z" fill="currentColor"/></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.8"/><path d="m8.2 10.9 7.1-3.7M8.2 13.1l7.1 3.7" stroke="currentColor" strokeWidth="1.8"/></svg>),
  shield: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l7 2.5v5.5c0 4.6-3 8-7 9.5-4-1.5-7-4.9-7-9.5V5.5L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m9 12 2 2 4-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  phone: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  more: (p) => (<svg viewBox="0 0 24 24" {...p}><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>),
  clip: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M19 11.5 12 18.5a4 4 0 0 1-6-5.3l7-7a2.7 2.7 0 0 1 4 3.7l-7 7a1.4 1.4 0 0 1-2-2l6.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  send: (p) => (<svg viewBox="0 0 24 24" {...p}><path d="M4 11.5 19 5l-5 14-3.2-6.3L4 11.5Z" fill="currentColor"/></svg>),
  mic: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  image: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><circle cx="8.5" cy="9.5" r="1.7" fill="currentColor"/><path d="m4 18 5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>),
  play: (p) => (<svg viewBox="0 0 24 24" {...p}><path d="M8 5.5 18 12 8 18.5V5.5Z" fill="currentColor"/></svg>),
  pause: (p) => (<svg viewBox="0 0 24 24" {...p}><rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4.2l2.8 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  close: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  camera: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-1.8h6.6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.7"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="m5 12.5 4.5 4.5L19 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  star: (p) => (<svg viewBox="0 0 24 24" {...p}><path d="m12 3 2.6 5.6 6 .7-4.5 4.2 1.2 6L12 16.8 6.7 19.5l1.2-6L3.4 9.3l6-.7L12 3Z" fill="currentColor"/></svg>),
  settings: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  chevron: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>),
  bag: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.7"/></svg>),
  card: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18" stroke="currentColor" strokeWidth="1.7"/></svg>),
  help: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M9.7 9.5a2.3 2.3 0 0 1 4.3 1.1c0 1.5-2 1.7-2 3M12 16.2v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  doc: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  logout: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M14 7V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2M9 12h11m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  chevDown: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  grid: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="4" y="4" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.8"/></svg>),
  receipt: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 3h12v18l-2.5-1.5L13 21l-1.5-1.5L10 21l-2.5-1.5L6 21V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
};

// ---------- Status bar ----------
function StatusBar() {
  return (
    <div style={{height: 50, display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'0 26px 8px', flexShrink:0}}>
      <span style={{fontSize:16, fontWeight:600, letterSpacing:.3}}>9:41</span>
      <div style={{display:'flex', alignItems:'center', gap:7}}>
        <svg width="18" height="12" viewBox="0 0 18 12"><g fill="#fff"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="4.5" y="5" width="3" height="7" rx="1"/><rect x="9" y="2.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1"/></g></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 10.2 8.5 10.2M2 4.2a9 9 0 0 1 13 0M4.6 6.6a5.4 5.4 0 0 1 7.8 0M8.5 9.3a1.5 1.5 0 0 1 0 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8.5" cy="9.6" r="1.1" fill="#fff"/></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="1" y="1.5" width="21" height="10" rx="3" stroke="#fff" strokeWidth="1.2" opacity=".5"/><rect x="2.6" y="3" width="17" height="7" rx="1.6" fill="#fff"/><rect x="23.2" y="4.6" width="1.6" height="3.8" rx=".8" fill="#fff" opacity=".6"/></svg>
      </div>
    </div>
  );
}

// ---------- Tab bar ----------
const TABS = [
  { id:'home', label:'Главная', icon:'home' },
  { id:'catalog', label:'Каталог', icon:'grid' },
  { id:'favorites', label:'Избранное', icon:'heart' },
  { id:'chats', label:'Чат', icon:'chat' },
  { id:'profile', label:'Профиль', icon:'user' },
];
function TabBar({ active, onNav, unread }) {
  return (
    <div style={{height:84, flexShrink:0, display:'flex', justifyContent:'space-around', alignItems:'flex-start', paddingTop:12,
      background:'rgba(10,10,10,.82)', backdropFilter:'blur(20px)', borderTop:`1px solid ${C.line}`}}>
      {TABS.map(t => {
        const on = active === t.id;
        const I = Ic[t.icon];
        return (
          <button key={t.id} onClick={()=>onNav(t.id)} style={{background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, width:64, padding:0, position:'relative', WebkitTapHighlightColor:'transparent'}}>
            <div style={{position:'relative', color: on ? C.accent : C.sub, height:24}}>
              <I width="24" height="24"/>
              {t.id==='chats' && unread>0 && (
                <span style={{position:'absolute', top:-4, right:-7, minWidth:16, height:16, padding:'0 4px', borderRadius:8, background:C.red, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center'}}>{unread}</span>
              )}
            </div>
            <span style={{fontSize:11, fontWeight: on?600:500, color: on ? C.accent : C.sub}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Generic header ----------
function Header({ title, left, right, accentTitle=true }) {
  return (
    <div style={{height:52, flexShrink:0, display:'flex', alignItems:'center', padding:'0 16px', gap:8}}>
      <div style={{width:40, display:'flex', justifyContent:'flex-start'}}>{left}</div>
      <div style={{flex:1, textAlign:'center', fontSize:18, fontWeight:700, color: accentTitle ? C.accent : C.text, letterSpacing:.2}}>{title}</div>
      <div style={{width:40, display:'flex', justifyContent:'flex-end'}}>{right}</div>
    </div>
  );
}

function RoundBtn({ children, onClick, bg=C.card, color=C.text, size=40 }) {
  return (
    <button onClick={onClick} style={{width:size, height:size, borderRadius:size/2, background:bg, color, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', WebkitTapHighlightColor:'transparent', flexShrink:0}}>{children}</button>
  );
}

// ---------- Product image placeholder ----------
// Honest, premium placeholder: soft radial vignette + category glyph + mono label.
function ProductImg({ kind='shoe', label, h=210, radius=12, big=false }) {
  const glyph = {
    shoe: <path d="M12 60c8-2 16-10 26-12 6-1 9 1 14 5 8 6 18 8 30 8 4 0 6 2 6 5v3c0 3-2 5-6 5H16c-3 0-5-2-5-5l1-14Z" fill="none" stroke="#5a5a5a" strokeWidth="2.4" strokeLinejoin="round"/>,
    tee: <path d="M38 16 50 24l12-8 14 8-7 12-7-4v36H32V32l-7 4-7-12 14-8Z" fill="none" stroke="#5a5a5a" strokeWidth="2.4" strokeLinejoin="round"/>,
    hoodie: <path d="M38 14c-8 0-14 5-24 9l5 14 9-4v37h40V33l9 4 5-14c-10-4-16-9-24-9-2 4-4 6-10 6s-8-2-10-6Z" fill="none" stroke="#5a5a5a" strokeWidth="2.4" strokeLinejoin="round"/>,
    jacket: <path d="M30 14 50 22l20-8 8 12-10 6v44H32V32l-10-6 8-12Z" fill="none" stroke="#5a5a5a" strokeWidth="2.4" strokeLinejoin="round"/>,
    shirt: <path d="M34 15 50 22l16-7 10 11-8 8-4-3v40H36V31l-4 3-8-8 10-11Z" fill="none" stroke="#5a5a5a" strokeWidth="2.4" strokeLinejoin="round"/>,
    pants: <path d="M32 14h32l3 56h-14l-3-34-3 34H33l-3-56Z" fill="none" stroke="#5a5a5a" strokeWidth="2.4" strokeLinejoin="round"/>,
    accessory: <circle cx="44" cy="42" r="24" fill="none" stroke="#5a5a5a" strokeWidth="2.4"/>,
    other: <rect x="20" y="18" width="48" height="48" rx="6" fill="none" stroke="#5a5a5a" strokeWidth="2.4"/>,
  }[kind] || null;
  return (
    <div style={{height:h, borderRadius:radius, position:'relative', overflow:'hidden',
      background:`radial-gradient(120% 90% at 50% 30%, #2c2c2c 0%, #161616 60%, #101010 100%)`,
      display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{position:'absolute', inset:0, opacity:.5,
        backgroundImage:`repeating-linear-gradient(135deg, transparent 0 11px, rgba(255,255,255,.018) 11px 12px)`}}/>
      <svg width={big?150:96} height={big?112:72} viewBox="0 0 88 78" style={{opacity:.9}}>{glyph}
        <line x1="44" y1="40" x2="44" y2="44" stroke={C.accent} strokeWidth="5" strokeLinecap="round"/>
      </svg>
      {label && <div style={{position:'absolute', bottom:10, left:0, right:0, textAlign:'center', fontFamily:'ui-monospace, monospace', fontSize:10, letterSpacing:1, color:'#666', textTransform:'uppercase'}}>{label}</div>}
    </div>
  );
}

// ---------- Mock data ----------
const PRODUCTS = [
  { id:'p1', brand:'Nike', model:'Air Max 90', price:8900, kind:'shoe', size:'EUR 42', cond:'Как новое', verified:true, rating:4.9, cat:'men',
    desc:'Оригинал, покупал в официальном магазине. Носился аккуратно.', seller:{name:'Алексей', sales:5} },
  { id:'p2', brand:'Stone Island', model:'Худи', price:12500, kind:'hoodie', size:'L', cond:'Хорошее', verified:true, rating:4.8, cat:'men',
    desc:'Тёплое худи с фирменной нашивкой. Без катышков и затяжек.', seller:{name:'Мария С.', sales:23} },
  { id:'p3', brand:'Carhartt WIP', model:'Футболка', price:3200, kind:'tee', size:'M', cond:'Как новое', verified:false, rating:4.7, cat:'men',
    desc:'Базовая футболка, плотный хлопок. Носилась пару раз.', seller:{name:'Дмитрий К.', sales:11} },
  { id:'p4', brand:'The North Face', model:'Куртка', price:15900, kind:'jacket', size:'M', cond:'Как новое', verified:true, rating:5.0, cat:'women',
    desc:'Утеплённая куртка, идеально для города. Полный комплект.', seller:{name:'Сергей П.', sales:8} },
  { id:'p5', brand:'Adidas', model:'Samba OG', price:7400, kind:'shoe', size:'EUR 43', cond:'Хорошее', verified:true, rating:4.6, cat:'men',
    desc:'Классика. Лёгкие следы носки на подошве.', seller:{name:'Игорь В.', sales:14} },
  { id:'p6', brand:'Carhartt WIP', model:'Худи Hooded', price:9800, kind:'hoodie', size:'L', cond:'Как новое', verified:true, rating:4.9, cat:'women',
    desc:'Плотный флис, фирменная вышивка. Состояние как новое.', seller:{name:'Никита Р.', sales:6} },
  { id:'p7', brand:'Stüssy', model:'Кепка 8-Ball', price:2800, kind:'accessory', size:'One size', cond:'Новое', verified:true, rating:4.8, cat:'accessories',
    desc:'Классическая кепка, минимальные следы носки.', seller:{name:'Олег М.', sales:9} },
  { id:'p8', brand:'Nike', model:'Детские кроссовки', price:3900, kind:'shoe', size:'EUR 32', cond:'Хорошее', verified:true, rating:4.7, cat:'kids',
    desc:'Лёгкие детские кроссовки, удобная посадка.', seller:{name:'Анна К.', sales:18} },
  { id:'p9', brand:'Supreme', model:'Сумка на пояс', price:6400, kind:'jacket', size:'OS', cond:'Как новое', verified:true, rating:4.9, cat:'accessories',
    desc:'Поясная сумка, оригинал, полный комплект.', seller:{name:'Павел Д.', sales:7} },
  { id:'p10', brand:'Champion', model:'Детское худи', price:2600, kind:'hoodie', size:'128', cond:'Как новое', verified:false, rating:4.6, cat:'kids',
    desc:'Мягкое детское худи, без дефектов.', seller:{name:'Елена Т.', sales:12} },
];
const byId = (id) => PRODUCTS.find(p => p.id === id);
const money = (n) => n.toLocaleString('ru-RU').replace(/,/g,' ') + ' ₽';

Object.assign(window, { C, Ic, StatusBar, TabBar, TABS, Header, RoundBtn, ProductImg, PRODUCTS, byId, money });
