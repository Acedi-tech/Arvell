// ===== ARVELL Editorial — overrides for Home, Product, MiniCard, Header =====
const edMono = { fontFamily:"'IBM Plex Mono', ui-monospace, monospace", textTransform:'uppercase', letterSpacing:.4 };
const edWide = { fontFamily:"'Archivo', sans-serif", fontStretch:'125%' };

const ED_STORIES = [
  { tag:'Подборка', title:'Архив Stone Island', kind:'hoodie' },
  { tag:'Гид', title:'Как отличить оригинал Air Max', kind:'shoe' },
  { tag:'Тренд', title:'Workwear этой осени', kind:'jacket' },
];
const ED_TRENDING = ['Все', 'Nike', 'Stone Island', 'Carhartt WIP', 'The North Face', 'Adidas', 'Supreme'];

function Header({ title, left, right }) {
  return (
    <div style={{height:52, flexShrink:0, display:'flex', alignItems:'center', padding:'0 16px', gap:8, borderBottom:`1px solid ${C.line}`}}>
      <div style={{width:40, display:'flex', justifyContent:'flex-start'}}>{left}</div>
      <div style={{flex:1, textAlign:'center', fontSize:16, fontWeight:800, color:C.accent, ...edWide, letterSpacing:-.2}}>{title}</div>
      <div style={{width:40, display:'flex', justifyContent:'flex-end'}}>{right}</div>
    </div>
  );
}

function EdIconBtn({ children, onClick, onImage }) {
  return (
    <button onClick={onClick} style={{width:36, height:36, borderRadius:18, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.text, background: onImage?'rgba(0,0,0,.55)':'transparent', flexShrink:0}}>{children}</button>
  );
}

function HomeScreen({ go, favs, toggleFav }) {
  const [query, setQuery] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [slide, setSlide] = React.useState(0);
  const q = query.trim().toLowerCase();
  const items = PRODUCTS.filter(p => !q || (p.brand+' '+p.model).toLowerCase().includes(q));
  const onHeroScroll = (e) => { const el = e.currentTarget; setSlide(Math.round(el.scrollLeft / el.clientWidth)); };
  return (
    <>
      <div style={{height:48, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px 0 16px'}}>
        <span style={{fontSize:21, fontWeight:800, color:C.accent, ...edWide, letterSpacing:-.3}}>ARVELL</span>
        <div style={{display:'flex', gap:2}}>
          <EdIconBtn onClick={()=>{ setSearchOpen(o=>!o); if (searchOpen) setQuery(''); }}><Ic.search width="21" height="21"/></EdIconBtn>
          <div style={{position:'relative'}}>
            <EdIconBtn onClick={()=>go({s:'notifications'})}><Ic.bell width="21" height="21"/></EdIconBtn>
            <span style={{position:'absolute', top:8, right:9, width:7, height:7, borderRadius:4, background:C.red}}/>
          </div>
        </div>
      </div>
      {searchOpen && (
        <div style={{padding:'0 16px 10px', flexShrink:0}}>
          <div style={{height:42, border:`1px solid ${C.accent}`, background:C.card, display:'flex', alignItems:'center', gap:10, padding:'0 12px'}}>
            <Ic.search width="18" height="18" style={{color:C.sub}}/>
            <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск брендов..." style={{flex:1, background:'none', border:'none', outline:'none', color:C.text, fontSize:15, fontFamily:'inherit'}}/>
            {query && <button onClick={()=>setQuery('')} style={{background:'none', border:'none', color:C.sub, cursor:'pointer', display:'flex'}}><Ic.close width="17" height="17"/></button>}
          </div>
        </div>
      )}

      <div style={{flex:1, overflowY:'auto'}} className="scroll">
        {!q && (
          <>
            <div style={{position:'relative'}}>
              <div onScroll={onHeroScroll} className="scroll" style={{display:'flex', overflowX:'auto', scrollSnapType:'x mandatory'}}>
                {ED_STORIES.map((s,i) => (
                  <div key={i} style={{flex:'0 0 100%', height:270, position:'relative', scrollSnapAlign:'start', background:'#161616', overflow:'hidden'}}>
                    <div style={{position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(135deg, transparent 0 11px, rgba(255,255,255,.035) 11px 12px)'}}/>
                    <div style={{position:'absolute', top:14, right:14, ...edMono, fontSize:9.5, color:'#6a6a6a'}}>editorial photo</div>
                    <div style={{position:'absolute', inset:0, background:'linear-gradient(transparent 45%, rgba(0,0,0,.55))'}}/>
                    <div style={{position:'absolute', left:16, right:16, bottom:30, color:'#fff'}}>
                      <div style={{fontSize:13, fontWeight:700, marginBottom:4, color:C.accent}}>{s.tag}</div>
                      <div style={{fontSize:25, fontWeight:800, lineHeight:1.1, letterSpacing:-.4, ...edWide, textWrap:'balance'}}>{s.title}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{position:'absolute', bottom:12, left:0, right:0, display:'flex', justifyContent:'center', gap:6, pointerEvents:'none'}}>
                {ED_STORIES.map((_,i) => <span key={i} style={{width:6, height:6, borderRadius:3, background: i===slide?'#fff':'rgba(255,255,255,.4)'}}/>)}
              </div>
            </div>

            <div style={{padding:'20px 16px 8px'}}>
              <div style={{fontSize:15, fontWeight:800, marginBottom:10}}>Популярные запросы</div>
            </div>
            <div className="scroll" style={{display:'flex', gap:8, overflowX:'auto', padding:'0 16px 22px'}}>
              {ED_TRENDING.map(t => (
                <button key={t} onClick={()=>{ if (t!=='Все') { setQuery(t); setSearchOpen(true); } else go({tab:'catalog'}); }}
                  style={{flexShrink:0, height:30, padding:'0 10px', border:`1px solid ${t==='Все'?C.accent:'#3a3a3a'}`, background:'transparent', color:t==='Все'?C.accent:C.text, cursor:'pointer', display:'flex', alignItems:'center', gap:5, ...edMono, fontSize:11, fontWeight:500}}>
                  {t} <span style={{fontSize:12}}>↗</span>
                </button>
              ))}
            </div>

            <div style={{padding:'0 16px 12px'}}>
              <div style={{...edMono, fontSize:10.5, color:C.sub}}>Nike, Stone Island, Carhartt + ещё</div>
              <div style={{fontSize:15, fontWeight:800, marginTop:3}}>В тренде: одежда</div>
            </div>
          </>
        )}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px 2px', paddingBottom:20, paddingTop: q?4:0}}>
          {items.map(p => <MiniCard key={p.id} p={p} fav={favs[p.id]} onFav={()=>toggleFav(p.id)} onOpen={()=>go({s:'product', id:p.id})} />)}
        </div>
        {items.length===0 && <div style={{color:C.sub, fontSize:14, textAlign:'center', padding:'40px 0'}}>Ничего не найдено</div>}
      </div>
    </>
  );
}

function MiniCard({ p, fav, onFav, onOpen, hideFav, topRight }) {
  return (
    <div onClick={onOpen} style={{cursor:'pointer', minWidth:0, position:'relative'}}>
      <ProductImg kind={p.kind} h={196} radius={0} label={null} />
      {topRight}
      <div style={{padding:'9px 10px 0'}}>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{flex:1, fontSize:13, fontWeight:700, textDecoration:'underline', textUnderlineOffset:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.brand}</span>
          {!hideFav && !topRight && (
            <button onClick={(e)=>{e.stopPropagation(); onFav && onFav();}} style={{background:'none', border:'none', padding:0, cursor:'pointer', color: fav?C.accent:C.text, display:'flex'}}>
              {fav ? <Ic.heartFill width="17" height="17"/> : <Ic.heart width="17" height="17"/>}
            </button>
          )}
        </div>
        <div style={{fontSize:13, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.model}</div>
        <div style={{fontSize:12, color:C.sub, marginTop:2}}>{p.size} · {p.cond}</div>
        <div style={{fontSize:14, fontWeight:800, marginTop:6, color:C.accent}}>{money(p.price)}</div>
      </div>
    </div>
  );
}

function ProductScreen({ id, go, favs, toggleFav, startBuy, isSeller }) {
  const p = byId(id);
  const [copied, setCopied] = React.useState(false);
  const [sold, setSold] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const share = () => {
    const url = `https://arvell.app/item/${p.id}`;
    if (navigator.share) navigator.share({ title:`${p.brand} ${p.model} — ARVELL`, url }).catch(()=>{});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false), 1600); }).catch(()=>{});
  };
  const fav = favs && favs[p.id];
  const btn = { flex:1, height:48, border:`1px solid ${C.text}`, fontSize:13, fontWeight:600, cursor:'pointer', ...edMono, letterSpacing:.8 };
  return (
    <>
      <div style={{flex:1, overflowY:'auto'}} className="scroll">
        <div style={{position:'relative'}}>
          <ProductImg kind={p.kind} h={380} radius={0} big label="product photo" />
          <div style={{position:'absolute', top:10, left:14, right:14, display:'flex', justifyContent:'space-between'}}>
            <EdIconBtn onImage onClick={()=>go({back:true})}><Ic.back width="20" height="20"/></EdIconBtn>
            <div style={{display:'flex', gap:8}}>
              <div style={{position:'relative'}}>
                <EdIconBtn onImage onClick={share}><Ic.share width="18" height="18"/></EdIconBtn>
                {copied && <div style={{position:'absolute', top:44, right:0, background:C.card, border:`1px solid ${C.line}`, color:C.text, padding:'7px 12px', fontSize:12.5, whiteSpace:'nowrap'}}>Ссылка скопирована</div>}
              </div>
              {isSeller && (
                <div style={{position:'relative'}}>
                  <EdIconBtn onImage onClick={()=>setMenuOpen(o=>!o)}><Ic.trash width="18" height="18"/></EdIconBtn>
                  {menuOpen && (
                    <div style={{position:'absolute', top:44, right:0, zIndex:10, background:C.cardHi, border:`1px solid ${C.line}`, minWidth:200}}>
                      {!sold && <button onClick={()=>{setSold(true); setMenuOpen(false);}} style={{width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', borderBottom:`1px solid ${C.line}`, padding:'12px 14px', color:C.text, fontSize:14, cursor:'pointer', textAlign:'left'}}><Ic.check width="16" height="16"/> Отметить проданным</button>}
                      <button onClick={()=>{ if(window.confirm('Удалить объявление? Это действие нельзя отменить.')) go({back:true}); else setMenuOpen(false); }} style={{width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', padding:'12px 14px', color:C.red, fontSize:14, cursor:'pointer', textAlign:'left'}}><Ic.trash width="16" height="16"/> Удалить объявление</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {p.verified && (
            <div style={{position:'absolute', top:58, left:14, background:C.accent, color:'#000', padding:'6px 9px', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', ...edMono, fontSize:10.5, fontWeight:500}}>
              <Ic.shield width="14" height="14"/> Проверено ARVELL
            </div>
          )}
        </div>

        <div style={{padding:'16px 16px 0'}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <span style={{flex:1, fontSize:15, fontWeight:800, textDecoration:'underline', textUnderlineOffset:3}}>{p.brand}</span>
            {!isSeller && (
              <button onClick={()=>toggleFav(p.id)} style={{background:'none', border:'none', padding:0, cursor:'pointer', color: fav?C.accent:C.text, display:'flex'}}>
                {fav ? <Ic.heartFill width="21" height="21"/> : <Ic.heart width="21" height="21"/>}
              </button>
            )}
          </div>
          <div style={{fontSize:16, marginTop:4}}>{p.brand} {p.model}</div>
          <div style={{fontSize:13, color:C.sub, marginTop:4}}>{p.size} · {p.cond}</div>
          <div style={{fontSize:26, fontWeight:800, marginTop:12, ...edWide, letterSpacing:-.5, color:C.accent}}>{money(p.price)}</div>
          <div style={{fontSize:12.5, color:C.sub, marginTop:6}}>Оплата и передача товара — при встрече с продавцом</div>

          <div style={{height:1, background:C.line, margin:'18px 0'}}/>
          <div style={{...edMono, fontSize:10.5, color:C.sub, marginBottom:8}}>Описание</div>
          <div style={{fontSize:14.5, color:C.sub2, lineHeight:1.55}}>{p.desc}</div>

          <div style={{height:1, background:C.line, margin:'18px 0 14px'}}/>
          <button onClick={()=>go({s:'sellerProfile', id:p.id})} style={{display:'flex', alignItems:'center', gap:12, width:'100%', background:'none', border:'none', cursor:'pointer', padding:'0 0 22px', color:C.text}}>
            <Avatar name={p.seller.name} size={44} />
            <div style={{flex:1, textAlign:'left'}}>
              <div style={{fontSize:15, fontWeight:700}}>{p.seller.name}</div>
              <div style={{fontSize:13, color:C.sub, marginTop:2, display:'flex', alignItems:'center', gap:5}}><Ic.star width="12" height="12"/> {p.rating} · {p.seller.sales} продаж</div>
            </div>
            <Ic.chevron width="20" height="20" style={{color:C.sub}}/>
          </button>
        </div>
      </div>

      <div style={{flexShrink:0, padding:'10px 16px 18px', borderTop:`1px solid ${C.line}`, background:C.bg, display:'flex', gap:8}}>
        {isSeller ? (
          sold
            ? <div style={{...btn, display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:C.sub, borderColor:C.line}}>Отмечено проданным</div>
            : <button onClick={()=>go({s:'addProduct'})} style={{...btn, background:C.accent, color:'#000', borderColor:C.accent}}>Редактировать</button>
        ) : (
          <>
            <button onClick={()=>startBuy(p.id)} style={{...btn, background:'transparent', color:C.text}}>Написать</button>
            <button onClick={()=>startBuy(p.id)} style={{...btn, background:C.accent, color:'#000', borderColor:C.accent}}>Купить</button>
          </>
        )}
      </div>
    </>
  );
}

Object.assign(window, { HomeScreen, ProductScreen, MiniCard, Header });
