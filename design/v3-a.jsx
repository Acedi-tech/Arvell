// ===== ARVELL v3 — shared UI + product, seller, reviews, deals =====
const vMono = { fontFamily:"'IBM Plex Mono', ui-monospace, monospace", textTransform:'uppercase', letterSpacing:.5 };
const vWide = { fontFamily:"'Archivo', sans-serif", fontStretch:'125%' };
const vBtn = { height:48, whiteSpace:'nowrap', border:'1px solid transparent', fontSize:13, fontWeight:600, cursor:'pointer', ...vMono, letterSpacing:.8, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'0 14px' };
const vPrimary = { ...vBtn, background:C.accent, color:'#000', borderColor:C.accent };
const vGhost = { ...vBtn, background:'transparent', color:C.text, borderColor:C.text };
const vLbl = { ...vMono, fontSize:10.5, color:C.sub, marginBottom:8 };
const vField = { width:'100%', minHeight:48, background:C.card, border:`1px solid ${C.line}`, padding:'0 14px', display:'flex', alignItems:'center', gap:10 };
const vInput = { flex:1, background:'none', border:'none', outline:'none', color:C.text, fontSize:15, fontFamily:'inherit', minWidth:0 };

const SHOP_OF = { 'Алексей':'Alexey Kicks', 'Мария С.':'Maria Archive', 'Дмитрий К.':'DK Workwear', 'Сергей П.':'North Room', 'Игорь В.':'Igor Sneakers', 'Никита Р.':'Nikita Vintage', 'Олег М.':'Oleg Caps', 'Анна К.':'Anna Kids', 'Павел Д.':'Pavel Store', 'Елена Т.':'Elena Shop' };
const shopOf = (p) => SHOP_OF[p.seller.name] || p.seller.name;
const COND_MAP = { 'Отлично':'Как новое', 'Хорошо':'Хорошее', 'Средне':'Среднее' };
const condOf = (p) => COND_MAP[p.cond] || p.cond;
const PHOTO_COUNT = { p1:5, p2:4, p3:3, p4:5, p5:3, p6:4 };

const initialReviews = () => ({
  p1:[ { id:'r1', name:'Марина К.', rating:5, date:'12.10', text:'Всё как в описании. Встретились у метро, продавец дал примерить, оригинал без вопросов.' },
       { id:'r2', name:'Тимур А.', rating:5, date:'28.09', text:'Быстро договорились, кроссовки в отличном состоянии, коробка на месте.' },
       { id:'r3', name:'Ольга В.', rating:4, date:'03.09', text:'Хорошее состояние, но на встречу пришлось подождать минут 15.' } ],
  p2:[ { id:'r4', name:'Илья Н.', rating:5, date:'14.10', text:'Худи как новое, бирки на месте. Продавец показал чек.' },
       { id:'r5', name:'Ксения Л.', rating:5, date:'01.10', text:'Приятная встреча, всё честно. Рекомендую.' } ],
  p4:[ { id:'r6', name:'Глеб С.', rating:5, date:'20.09', text:'Куртка тёплая, без дефектов. Сергей на связи, встретились в центре.' } ],
  p5:[ { id:'r7', name:'Артём Б.', rating:4, date:'11.09', text:'Следы носки чуть заметнее, чем на фото, но цена честная.' } ],
});
const avg = (arr) => arr.length ? Math.round(arr.reduce((s,r)=>s+r.rating,0)/arr.length*10)/10 : 0;
const sellerReviews = (reviews, sellerName) => PRODUCTS.filter(p=>p.seller.name===sellerName).flatMap(p => (reviews[p.id]||[]).map(r=>({...r, product:`${p.brand} ${p.model}`})));
const plural = (n, a, b, c) => { const m10=n%10, m100=n%100; return m10===1&&m100!==11?a:(m10>=2&&m10<=4&&(m100<10||m100>=20)?b:c); };
const reviewsWord = (n) => `${n} ${plural(n,'отзыв','отзыва','отзывов')}`;

function VBack({ onClick }) {
  return <button onClick={onClick} style={{width:36, height:36, border:'none', background:'transparent', color:C.text, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:-8}}><Ic.back width="22" height="22"/></button>;
}
function VHeader({ title, sub, onBack, right }) {
  return (
    <div style={{flexShrink:0, display:'flex', alignItems:'center', gap:8, padding:'4px 16px 10px', borderBottom:`1px solid ${C.line}`, minHeight:52}}>
      <div style={{width:36}}>{onBack && <VBack onClick={onBack}/>}</div>
      <div style={{flex:1, textAlign:'center', minWidth:0}}>
        <div style={{fontSize:16, fontWeight:800, color:C.accent, ...vWide, letterSpacing:-.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{title}</div>
        {sub && <div style={{fontSize:12, color:C.sub, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{sub}</div>}
      </div>
      <div style={{width:36, display:'flex', justifyContent:'flex-end'}}>{right}</div>
    </div>
  );
}
function VStars({ value, size=12, gap=2 }) {
  return <div style={{display:'flex', gap}}>{[1,2,3,4,5].map(k => <Ic.star key={k} width={size} height={size} style={{color: k<=Math.round(value)?C.accent:'#3a3a3a'}}/>)}</div>;
}
function VReview({ r, last }) {
  return (
    <div style={{padding:'14px 0', borderBottom: last?'none':`1px solid ${C.line}`}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
        <Avatar name={r.name} size={32}/>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:14, fontWeight:600}}>{r.name}</div>
          <div style={{marginTop:3}}><VStars value={r.rating} size={11}/></div>
        </div>
        <span style={{fontSize:12, color:C.sub}}>{r.date}</span>
      </div>
      {r.text && <div style={{fontSize:13.5, color:C.sub2, lineHeight:1.5}}>{r.text}</div>}
      {r.product && <div style={{...vMono, fontSize:9.5, color:C.sub, marginTop:7}}>{r.product}</div>}
    </div>
  );
}
// Dialog (centered, editorial)
function VDialog({ title, text, cancel='Отмена', ok, danger, onCancel, onOk }) {
  return (
    <div style={{position:'absolute', inset:0, zIndex:80, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, animation:'fade .18s ease'}}>
      <div style={{width:'100%', background:C.cardHi, border:`1px solid ${C.line}`, padding:'20px 18px 16px'}}>
        <div style={{fontSize:17, fontWeight:800, marginBottom:8}}>{title}</div>
        {text && <div style={{fontSize:14, color:C.sub2, lineHeight:1.5, marginBottom:18}}>{text}</div>}
        <div style={{display:'flex', gap:8}}>
          <button onClick={onCancel} style={{...vGhost, flex:1, borderColor:C.line}}>{cancel}</button>
          <button onClick={onOk} style={{...vPrimary, flex:1, ...(danger?{background:C.red, borderColor:C.red, color:'#fff'}:{})}}>{ok}</button>
        </div>
      </div>
    </div>
  );
}
// Bottom sheet
function VSheet({ onClose, children }) {
  return (
    <div style={{position:'absolute', inset:0, zIndex:70, display:'flex', flexDirection:'column', justifyContent:'flex-end'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(0,0,0,.6)', animation:'fade .18s ease'}}/>
      <div style={{position:'relative', background:C.cardHi, borderTop:`1px solid ${C.line}`, padding:'14px 16px 26px', animation:'sheetUp .25s cubic-bezier(.16,1,.3,1)', maxHeight:'80%', overflowY:'auto'}} className="scroll">
        <div style={{width:36, height:4, background:'#444', margin:'0 auto 14px'}}/>
        {children}
      </div>
    </div>
  );
}
// Animated success (ring draws, check appears)
function VSuccess({ title, text, cta='Готово', onDone }) {
  return (
    <div style={{position:'absolute', inset:0, zIndex:75, background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center'}}>
      <svg width="104" height="104" viewBox="0 0 104 104" style={{marginBottom:26}}>
        <circle cx="52" cy="52" r="46" fill="none" stroke={C.accent} strokeWidth="4" strokeDasharray="290" strokeDashoffset="290" transform="rotate(-90 52 52)" style={{animation:'ringDraw .6s ease forwards'}}/>
        <path d="M33 53 L46 66 L72 39" fill="none" stroke={C.accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60" style={{animation:'checkDraw .35s ease .55s forwards'}}/>
      </svg>
      <div style={{fontSize:23, fontWeight:800, ...vWide, letterSpacing:-.4, marginBottom:10, opacity:0, animation:'fadeUp .4s ease .7s forwards'}}>{title}</div>
      {text && <div style={{fontSize:14.5, color:C.sub2, lineHeight:1.5, maxWidth:290, marginBottom:30, opacity:0, animation:'fadeUp .4s ease .8s forwards'}}>{text}</div>}
      <button onClick={onDone} style={{...vPrimary, width:'100%', maxWidth:300, opacity:0, animation:'fadeUp .4s ease .9s forwards'}}>{cta}</button>
    </div>
  );
}
function VIconOnImg({ children, onClick }) {
  return <button onClick={onClick} style={{width:36, height:36, borderRadius:18, border:'none', background:'rgba(0,0,0,.55)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>{children}</button>;
}
function VMoreIcon(p) { return <Ic.more {...p}/>; }

// ---------------- 4/5. PRODUCT ----------------
function V3Product({ id, go, favs, toggleFav, startBuy, isSeller, reviews, canReview, listing, setListing }) {
  const p = byId(id);
  const [photo, setPhoto] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const n = PHOTO_COUNT[p.id] || 1;
  const list = reviews[p.id] || [];
  const sRev = sellerReviews(reviews, p.seller.name);
  const off = listing[p.id]==='off';
  const fav = favs[p.id];
  const share = () => {
    const url = `https://arvell.app/item/${p.id}`;
    if (navigator.share) navigator.share({ title:`${p.brand} ${p.model} — ARVELL`, url }).catch(()=>{});
    else { try { navigator.clipboard.writeText(url); } catch(e){} setCopied(true); setTimeout(()=>setCopied(false), 1600); }
  };
  const showReviews = list.length>0 || (!isSeller && canReview!=='none');
  return (
    <>
      <div style={{flex:1, overflowY:'auto'}} className="scroll">
        <div style={{position:'relative'}}>
          <div className="scroll" onScroll={e=>{const el=e.currentTarget; setPhoto(Math.round(el.scrollLeft/el.clientWidth));}} style={{display:'flex', overflowX:'auto', scrollSnapType:'x mandatory'}}>
            {Array.from({length:n}).map((_,i) => <div key={i} style={{flex:'0 0 100%', scrollSnapAlign:'start'}}><ProductImg kind={p.kind} h={380} radius={0} big label={`product photo ${i+1}`}/></div>)}
          </div>
          <div style={{position:'absolute', top:10, left:14, right:14, display:'flex', justifyContent:'space-between'}}>
            <VIconOnImg onClick={()=>go({back:true})}><Ic.back width="20" height="20"/></VIconOnImg>
            <div style={{display:'flex', gap:8, position:'relative'}}>
              <VIconOnImg onClick={share}><Ic.share width="18" height="18"/></VIconOnImg>
              {isSeller && <VIconOnImg onClick={()=>setMenu(m=>!m)}><VMoreIcon width="20" height="20"/></VIconOnImg>}
              {copied && <div style={{position:'absolute', top:44, right:0, background:C.cardHi, border:`1px solid ${C.line}`, padding:'7px 12px', fontSize:12.5, whiteSpace:'nowrap'}}>Ссылка скопирована</div>}
              {menu && (
                <div style={{position:'absolute', top:44, right:0, zIndex:10, background:C.cardHi, border:`1px solid ${C.line}`, minWidth:210}}>
                  <button onClick={()=>{ setListing(p.id, off?'active':'off'); setMenu(false); }} style={menuItem}>{off ? 'Вернуть в продажу' : 'Снять с продажи'}</button>
                  <button onClick={()=>{ setMenu(false); setConfirmDel(true); }} style={{...menuItem, color:C.red, borderBottom:'none'}}><Ic.trash width="16" height="16"/> Удалить объявление</button>
                </div>
              )}
            </div>
          </div>
          <div style={{position:'absolute', top:58, left:14, background:C.accent, color:'#000', padding:'6px 9px', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', ...vMono, fontSize:10.5, fontWeight:600}}>
            <Ic.shield width="14" height="14"/> Проверено ARVELL
          </div>
          {n>1 && <div style={{position:'absolute', bottom:12, right:14, background:'rgba(0,0,0,.6)', color:'#fff', padding:'4px 8px', whiteSpace:'nowrap', ...vMono, fontSize:10.5}}>{photo+1} / {n}</div>}
        </div>

        <div style={{padding:'16px 16px 0'}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <span style={{flex:1, fontSize:15, fontWeight:800, textDecoration:'underline', textUnderlineOffset:3}}>{p.brand}</span>
            {!isSeller && <button onClick={()=>toggleFav(p.id)} style={{background:'none', border:'none', padding:0, cursor:'pointer', color: fav?C.accent:C.text, display:'flex'}}>{fav ? <Ic.heartFill width="22" height="22"/> : <Ic.heart width="22" height="22"/>}</button>}
          </div>
          <div style={{fontSize:16, marginTop:4}}>{p.brand} {p.model}</div>
          <div style={{fontSize:13, color:C.sub, marginTop:4}}>{p.size} · {condOf(p)}</div>
          <div style={{fontSize:26, fontWeight:800, marginTop:12, ...vWide, letterSpacing:-.5, color:C.accent}}>{money(p.price)}</div>
          <div style={{fontSize:12.5, color:C.sub, marginTop:6}}>Оплата и передача товара — при встрече с продавцом</div>

          <div style={{height:1, background:C.line, margin:'18px 0'}}/>
          <div style={vLbl}>Описание</div>
          <div style={{fontSize:14.5, color:C.sub2, lineHeight:1.55}}>{p.desc}</div>

          {showReviews && (
            <>
              <div style={{height:1, background:C.line, margin:'18px 0 14px'}}/>
              <div style={{display:'flex', alignItems:'center'}}>
                <div style={{...vLbl, flex:1, marginBottom:0}}>Отзывы о товаре</div>
                {list.length>0 && <button onClick={()=>go({s:'reviews', productId:p.id})} style={{background:'none', border:'none', color:C.accent, cursor:'pointer', ...vMono, fontSize:11, fontWeight:600}}>Все</button>}
              </div>
              {list.length>0 ? (
                <>
                  <div style={{display:'flex', alignItems:'center', gap:8, margin:'10px 0 2px'}}><VStars value={avg(list)} size={14}/><span style={{fontSize:13.5, fontWeight:600}}>{avg(list).toFixed(1)}</span><span style={{fontSize:13, color:C.sub}}>· {reviewsWord(list.length)}</span></div>
                  {list.slice(0,2).map((r,i,a) => <VReview key={r.id} r={r} last={i===a.length-1}/>)}
                </>
              ) : <div style={{fontSize:13.5, color:C.sub, margin:'10px 0 4px'}}>Отзывов пока нет</div>}
              {!isSeller && canReview==='can' && <button onClick={()=>go({s:'reviewForm', productId:p.id})} style={{...vGhost, width:'100%', borderColor:C.accent, color:C.accent, marginTop:10}}>Оставить отзыв</button>}
              {!isSeller && canReview==='done' && <div style={{fontSize:13, color:C.sub, marginTop:10}}>Вы уже оставили отзыв на этот товар</div>}
            </>
          )}

          <div style={{height:1, background:C.line, margin:'18px 0 14px'}}/>
          <button onClick={()=>go({s:'sellerProfile', id:p.id})} style={{display:'flex', alignItems:'center', gap:12, width:'100%', background:'none', border:'none', cursor:'pointer', padding:'0 0 22px', color:C.text}}>
            <Avatar name={shopOf(p)} size={44}/>
            <div style={{flex:1, textAlign:'left'}}>
              <div style={{fontSize:15, fontWeight:700}}>{shopOf(p)}</div>
              <div style={{fontSize:13, color:C.sub, marginTop:3, display:'flex', alignItems:'center', gap:5}}>
                {sRev.length ? <><Ic.star width="12" height="12" style={{color:C.accent}}/> {avg(sRev).toFixed(1)} · {reviewsWord(sRev.length)}</> : 'Пока нет отзывов'}
              </div>
            </div>
            <Ic.chevron width="20" height="20" style={{color:C.sub}}/>
          </button>
        </div>
      </div>

      <div style={{flexShrink:0, padding:'10px 16px 18px', borderTop:`1px solid ${C.line}`, background:C.bg, display:'flex', flexDirection:'column', gap:8}}>
        {isSeller ? (
          <>
            {off && <div style={{...vBtn, height:34, background:C.card, color:C.sub, fontSize:11}}>Снято с продажи</div>}
            <button onClick={()=>go({s:'addProduct', editId:p.id})} style={vPrimary}>Редактировать</button>
          </>
        ) : (
          <div style={{display:'flex', gap:8}}>
            <button onClick={()=>startBuy(p.id, false)} style={{...vGhost, flex:1}}>Написать</button>
            <button onClick={()=>startBuy(p.id, true)} style={{...vPrimary, flex:1}}>Купить</button>
          </div>
        )}
      </div>
      {confirmDel && <VDialog title="Удалить объявление?" text="Объявление исчезнет из ленты и каталога. Это действие нельзя отменить." ok="Удалить" danger onCancel={()=>setConfirmDel(false)} onOk={()=>{ setConfirmDel(false); go({back:true}); }}/>}
    </>
  );
}
const menuItem = { width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', borderBottom:`1px solid ${C.line}`, padding:'13px 14px', color:C.text, fontSize:14, cursor:'pointer', textAlign:'left', fontFamily:'inherit' };

// ---------------- 6. SELLER PROFILE ----------------
function V3SellerProfile({ id, go, reviews }) {
  const p = byId(id);
  const listings = PRODUCTS.filter(x => x.seller.name===p.seller.name);
  const rev = sellerReviews(reviews, p.seller.name);
  return (
    <>
      <VHeader title="Профиль продавца" onBack={()=>go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'18px 16px 20px'}} className="scroll">
        <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:22}}>
          <Avatar name={shopOf(p)} size={72} ring/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:19, fontWeight:800, ...vWide, letterSpacing:-.3}}>{shopOf(p)}</div>
            <button onClick={()=>rev.length && go({s:'reviews', seller:p.seller.name, productId:p.id})} style={{display:'flex', alignItems:'center', gap:6, marginTop:5, background:'none', border:'none', padding:0, color:C.text, cursor: rev.length?'pointer':'default', fontFamily:'inherit'}}>
              <Ic.star width="14" height="14" style={{color:C.accent}}/>
              <span style={{fontSize:14, fontWeight:600}}>{rev.length ? avg(rev).toFixed(1) : '—'}</span>
              <span style={{fontSize:13, color:C.sub}}>· {reviewsWord(rev.length)} · {listings.length} {plural(listings.length,'объявление','объявления','объявлений')}</span>
            </button>
            <div style={{marginTop:8, display:'inline-flex', alignItems:'center', gap:5, background:C.accent, color:'#000', padding:'4px 8px', ...vMono, fontSize:10, fontWeight:600}}><Ic.check width="12" height="12"/> Проверенный продавец</div>
          </div>
        </div>

        <div style={vLbl}>Объявления продавца</div>
        <div className="scroll" style={{display:'flex', gap:2, overflowX:'auto', margin:'0 -16px 24px', padding:'0 16px'}}>
          {listings.map(l => (
            <div key={l.id} onClick={()=>go({s:'product', id:l.id})} style={{width:140, flexShrink:0, cursor:'pointer'}}>
              <ProductImg kind={l.kind} h={140} radius={0}/>
              <div style={{padding:'8px 2px 0'}}>
                <div style={{fontSize:13, fontWeight:700, textDecoration:'underline', textUnderlineOffset:2}}>{l.brand}</div>
                <div style={{fontSize:13, fontWeight:800, color:C.accent, marginTop:4}}>{money(l.price)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex', alignItems:'center'}}>
          <div style={{...vLbl, flex:1, marginBottom:0}}>Отзывы покупателей</div>
          {rev.length>0 && <button onClick={()=>go({s:'reviews', seller:p.seller.name, productId:p.id})} style={{background:'none', border:'none', color:C.accent, cursor:'pointer', ...vMono, fontSize:11, fontWeight:600}}>Все отзывы</button>}
        </div>
        {rev.length ? rev.slice(0,3).map((r,i,a) => <VReview key={r.id} r={r} last={i===a.length-1}/>) : (
          <div style={{textAlign:'center', padding:'34px 10px', border:`1px solid ${C.line}`, marginTop:12}}>
            <div style={{fontSize:15, fontWeight:700, marginBottom:6}}>Пока нет отзывов</div>
            <div style={{fontSize:13, color:C.sub, lineHeight:1.5}}>Отзыв может оставить покупатель, когда продавец подтвердит продажу</div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- 6.1 REVIEWS LIST ----------------
function V3Reviews({ go, reviews, productId, seller, override, overrideSub }) {
  const p = productId && byId(productId);
  const list = override || (seller ? sellerReviews(reviews, seller) : (reviews[productId]||[]));
  const sub = overrideSub || (seller ? (p ? shopOf(p) : seller) : (p ? `${p.brand} ${p.model}` : ''));
  const [shown, setShown] = React.useState(6);
  return (
    <>
      <VHeader title="Отзывы" sub={sub} onBack={()=>go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'18px 16px 20px'}} className="scroll" onScroll={e=>{const el=e.currentTarget; if(el.scrollTop+el.clientHeight>el.scrollHeight-40) setShown(s=>s+6);}}>
        <div style={{display:'flex', alignItems:'center', gap:16, paddingBottom:18, borderBottom:`1px solid ${C.line}`}}>
          <div style={{fontSize:44, fontWeight:800, ...vWide, letterSpacing:-1, color:C.accent, lineHeight:1}}>{list.length ? avg(list).toFixed(1) : '—'}</div>
          <div><VStars value={avg(list)} size={16} gap={3}/><div style={{fontSize:13, color:C.sub, marginTop:6}}>{reviewsWord(list.length)}</div></div>
        </div>
        {list.length ? list.slice(0, shown).map((r,i,a) => <VReview key={r.id} r={seller?r:{...r, product:null}} last={i===a.length-1}/>) :
          <div style={{textAlign:'center', color:C.sub, fontSize:14, padding:'40px 0'}}>Пока нет отзывов</div>}
      </div>
    </>
  );
}

// ---------------- 17. REVIEW FORM ----------------
const RATE_LABEL = ['Нажмите на звезду', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'];
function V3ReviewForm({ productId, go, status, onSubmit }) {
  const p = byId(productId);
  const [rating, setRating] = React.useState(0);
  const [text, setText] = React.useState('');
  const [done, setDone] = React.useState(false);
  const error = status==='done' ? 'Вы уже оставили отзыв на этот товар' : status==='none' ? 'Отзыв можно оставить только после того, как продавец подтвердит продажу' : null;
  return (
    <>
      <VHeader title="Отзыв о покупке" onBack={()=>go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'16px 16px 20px'}} className="scroll">
        <div style={{display:'flex', alignItems:'center', gap:12, padding:'10px', background:C.card, marginBottom:26}}>
          <div style={{width:56, height:56, flexShrink:0}}><ProductImg kind={p.kind} h={56} radius={0}/></div>
          <div style={{fontSize:15, fontWeight:700}}>{p.brand} {p.model}</div>
        </div>
        <div style={{textAlign:'center', fontSize:17, fontWeight:800, marginBottom:14}}>Оцените покупку</div>
        <div style={{display:'flex', justifyContent:'center', gap:8}}>
          {[1,2,3,4,5].map(k => (
            <button key={k} onClick={()=>setRating(k)} style={{background:'none', border:'none', padding:0, cursor:'pointer', color: k<=rating?C.accent:'#3a3a3a', transition:'transform .15s', transform: k===rating?'scale(1.12)':'none'}}><Ic.star width="40" height="40"/></button>
          ))}
        </div>
        <div style={{textAlign:'center', fontSize:14, color: rating?C.text:C.sub, marginTop:10, marginBottom:28, fontWeight: rating?600:400}}>{RATE_LABEL[rating]}</div>
        <div style={vLbl}>Комментарий</div>
        <div style={{...vField, alignItems:'flex-start', padding:'12px 14px'}}>
          <textarea value={text} onChange={e=>setText(e.target.value.slice(0,1000))} rows={5} placeholder="Расскажите, как прошла сделка и соответствовал ли товар описанию" style={{...vInput, resize:'none', lineHeight:1.45}}/>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', gap:10, marginTop:8}}>
          <span style={{fontSize:12, color:C.sub, lineHeight:1.45}}>Комментарий необязателен. Отзыв увидят все пользователи ARVELL</span>
          <span style={{fontSize:12, color:C.sub, flexShrink:0}}>{text.length} / 1000</span>
        </div>
        {error && <div style={{fontSize:13, color:C.red, marginTop:14}}>{error}</div>}
      </div>
      <div style={{flexShrink:0, padding:'10px 16px 18px', borderTop:`1px solid ${C.line}`}}>
        <button disabled={!rating || !!error} onClick={()=>{ onSubmit(productId, rating, text.trim()); setDone(true); }} style={{...vPrimary, width:'100%', opacity: (!rating||error)?.4:1}}>Отправить отзыв</button>
      </div>
      {done && <VSuccess title="Спасибо за отзыв!" text="Он поможет другим покупателям выбрать продавца" onDone={()=>go({back:true})}/>}
    </>
  );
}

// ---------------- 11.1 DEALS ----------------
function V3Deals({ go, deals, isSeller, reviewStatus }) {
  const [open, setOpen] = React.useState(null);
  const d = open && byId(open.productId);
  return (
    <>
      <VHeader title={isSeller ? 'Подтверждённые продажи' : 'Завершённые сделки'} onBack={()=>go({back:true})}/>
      <div style={{flex:1, overflowY:'auto'}} className="scroll">
        {deals.length===0 ? (
          <div style={{textAlign:'center', padding:'90px 30px'}}>
            <div style={{fontSize:16, fontWeight:700, marginBottom:8}}>{isSeller ? 'Пока нет продаж' : 'Пока нет завершённых сделок'}</div>
            <div style={{fontSize:13.5, color:C.sub, lineHeight:1.5}}>{isSeller ? 'Подтвердите продажу в чате с покупателем, и она появится здесь' : 'Ваши покупки появятся здесь, когда продавец подтвердит продажу'}</div>
          </div>
        ) : deals.map(x => { const p = byId(x.productId); return (
          <button key={x.id} onClick={()=>!isSeller && setOpen(x)} style={{width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'none', border:'none', borderBottom:`1px solid ${C.line}`, color:C.text, cursor: isSeller?'default':'pointer', textAlign:'left', fontFamily:'inherit'}}>
            <div style={{width:56, height:56, flexShrink:0}}><ProductImg kind={p.kind} h={56} radius={0}/></div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:14.5, fontWeight:600}}>{p.brand} {p.model}</div>
              <div style={{fontSize:12.5, color:C.sub, marginTop:3}}>{isSeller?'Продажа':'Покупка'} · {x.date}</div>
            </div>
            <div style={{fontSize:14.5, fontWeight:800, color:C.accent}}>{money(p.price)}</div>
          </button>
        ); })}
      </div>
      {open && (
        <VSheet onClose={()=>setOpen(null)}>
          <ProductImg kind={d.kind} h={170} radius={0}/>
          <div style={{fontSize:17, fontWeight:800, marginTop:14}}>{d.brand} {d.model}</div>
          <div style={{fontSize:13, color:C.sub, marginTop:4}}>Покупка · {open.date} · {shopOf(d)}</div>
          <div style={{fontSize:22, fontWeight:800, color:C.accent, ...vWide, marginTop:10, marginBottom:16}}>{money(d.price)}</div>
          {reviewStatus(d.id)==='done'
            ? <div style={{fontSize:14, color:C.green, fontWeight:600}}>✓ Вы уже оставили отзыв на эту покупку</div>
            : <button onClick={()=>{ setOpen(null); go({s:'reviewForm', productId:d.id}); }} style={{...vPrimary, width:'100%'}}>Оставить отзыв</button>}
        </VSheet>
      )}
    </>
  );
}

Object.assign(window, { V3Product, V3SellerProfile, V3Reviews, V3ReviewForm, V3Deals, VDialog, VSheet, VSuccess, VHeader, VBack, VStars, initialReviews, shopOf, condOf, avg, sellerReviews, reviewsWord, vMono, vWide, vBtn, vPrimary, vGhost, vLbl, vField, vInput, plural });
