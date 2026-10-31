// ===== ARVELL — Home, Product, Search =====

// ---------------- SCREEN 1: HOME ----------------
const CATS = [
  { id:'all', label:'Все' },
  { id:'men', label:'Мужчины' },
  { id:'women', label:'Женщины' },
  { id:'kids', label:'Дети' },
  { id:'accessories', label:'Аксессуары' },
];
function HomeScreen({ go, favs, toggleFav }) {
  const [query, setQuery] = React.useState('');
  const items = PRODUCTS.filter(p =>
    !query.trim() || (p.brand+' '+p.model).toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 16px 12px'}}>
        <span style={{fontSize:26, fontWeight:800, color:C.accent, letterSpacing:1.5}}>ARVELL</span>
        <div style={{display:'flex', gap:12}}>
          <div style={{position:'relative'}}>
            <RoundBtn onClick={()=>go({s:'notifications'})}><Ic.bell width="21" height="21"/></RoundBtn>
            <span style={{position:'absolute', top:7, right:8, width:8, height:8, borderRadius:4, background:C.accent, border:`2px solid ${C.bg}`}}/>
          </div>
          <RoundBtn onClick={()=>go({tab:'profile'})}><Ic.userFill width="22" height="22"/></RoundBtn>
        </div>
      </div>

      <div style={{padding:'0 16px 16px'}}>
        <div style={{width:'100%', height:48, borderRadius:0, background:C.card, border:`1px solid ${query?C.accent:C.line}`, display:'flex', alignItems:'center', gap:11, padding:'0 16px'}}>
          <Ic.search width="20" height="20" style={{color:C.sub}}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск брендов..." style={inputReset}/>
          {query && <button onClick={()=>setQuery('')} style={{background:'none', border:'none', color:C.sub, cursor:'pointer', display:'flex'}}><Ic.close width="18" height="18"/></button>}
        </div>
      </div>

      <div style={{flex:1, overflowY:'auto', padding:'0 16px 16px'}} className="scroll">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {items.map(p => (
            <MiniCard key={p.id} p={p} fav={favs[p.id]} onFav={()=>toggleFav(p.id)} onOpen={()=>go({s:'product', id:p.id})} />
          ))}
        </div>
        {items.length===0 && <div style={{color:C.sub, fontSize:14, textAlign:'center', padding:'40px 0'}}>Ничего не найдено</div>}
      </div>
    </>
  );
}

function MiniCard({ p, fav, onFav, onOpen, hideFav, topRight }) {
  return (
    <button onClick={onOpen} style={{...cardBtn, marginTop:0}}>
      <div style={{position:'relative'}}>
        <ProductImg kind={p.kind} h={150} radius={0} label={null} />
        {p.verified && <div style={{position:'absolute', top:10, left:10, width:24, height:24, borderRadius:0, background:C.accent, color:'#000', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.check width="14" height="14"/></div>}
        {topRight ? topRight : (!hideFav && (
          <div onClick={(e)=>{e.stopPropagation(); onFav();}} style={{position:'absolute', top:8, right:8, width:32, height:32, borderRadius:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', color:fav?C.accent:'#fff', cursor:'pointer'}}>
            {fav ? <Ic.heartFill width="17" height="17"/> : <Ic.heart width="17" height="17"/>}
          </div>
        ))}
      </div>
      <div style={{padding:'10px 12px 13px'}}>
        <div style={{fontSize:15, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.brand}</div>
        <div style={{fontSize:12.5, color:C.sub, marginTop:1}}>{p.model}</div>
        <div style={{fontSize:15, fontWeight:800, color:C.accent, marginTop:7}}>{money(p.price)}</div>
      </div>
    </button>
  );
}

const cardBtn = { display:'block', width:'100%', textAlign:'left', background:C.card, border:'none', borderRadius:0, overflow:'hidden', cursor:'pointer', padding:0, color:C.text, WebkitTapHighlightColor:'transparent' };

// ---------------- SCREEN 2: PRODUCT ----------------
function ProductScreen({ id, go, favs, toggleFav, startBuy, isSeller }) {
  const p = byId(id);
  const [copied, setCopied] = React.useState(false);
  const [sold, setSold] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const share = () => {
    const url = `https://arvell.app/item/${p.id}`;
    const shareData = { title: `${p.brand} ${p.model} — ARVELL`, text: `${p.brand} ${p.model}, ${money(p.price)}`, url };
    if (navigator.share) {
      navigator.share(shareData).catch(()=>{});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false), 1600); }).catch(()=>{});
    }
  };
  return (
    <>
      <div style={{flex:1, overflowY:'auto'}} className="scroll">
        <div style={{position:'relative'}}>
          <ProductImg kind={p.kind} h={360} radius={0} big label="product photo" />
          <div style={{position:'absolute', top:8, left:16, right:16, display:'flex', justifyContent:'space-between'}}>
            <RoundBtn onClick={()=>go({back:true})} bg="rgba(0,0,0,.5)"><Ic.back width="22" height="22"/></RoundBtn>
            <div style={{display:'flex', gap:10}}>
              <div style={{position:'relative'}}>
                <RoundBtn onClick={share} bg="rgba(0,0,0,.5)"><Ic.share width="20" height="20"/></RoundBtn>
                {copied && (
                  <div style={{position:'absolute', top:46, right:0, background:C.card, border:`1px solid ${C.line}`, borderRadius:0, padding:'7px 12px', fontSize:12.5, whiteSpace:'nowrap', color:'#fff'}}>
                    Ссылка скопирована
                  </div>
                )}
              </div>
              {isSeller && (
                <div style={{position:'relative'}}>
                  <RoundBtn onClick={()=>setMenuOpen(o=>!o)} bg="rgba(0,0,0,.5)"><Ic.trash width="20" height="20"/></RoundBtn>
                  {menuOpen && (
                    <div style={{position:'absolute', top:46, right:0, zIndex:10, background:C.cardHi, border:`1px solid ${C.line}`, borderRadius:0, overflow:'hidden', minWidth:190, boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
                      {!sold && (
                        <button onClick={()=>{setSold(true); setMenuOpen(false);}} style={{width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', borderBottom:`1px solid ${C.bg}`, padding:'12px 14px', color:'#fff', fontSize:14, cursor:'pointer', textAlign:'left'}}>
                          <Ic.check width="16" height="16" style={{color:C.accent}}/> Отметить проданным
                        </button>
                      )}
                      <button onClick={()=>{ if(window.confirm('Удалить объявление? Это действие нельзя отменить.')) go({back:true}); else setMenuOpen(false); }} style={{width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', padding:'12px 14px', color:C.red, fontSize:14, cursor:'pointer', textAlign:'left'}}>
                        <Ic.trash width="16" height="16"/> Удалить объявление
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{padding:'20px 16px 0'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:26, fontWeight:800}}>{p.brand}</div>
              <div style={{fontSize:16, color:C.sub, marginTop:3}}>{p.model}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:6, marginTop:6}}>
              <Ic.star width="18" height="18" style={{color:C.accent}}/>
              <span style={{fontSize:16, fontWeight:600}}>{p.rating}</span>
            </div>
          </div>

          <div style={{fontSize:32, fontWeight:800, color:C.accent, margin:'18px 0 16px'}}>{money(p.price)}</div>

          <div style={{display:'flex', gap:10, marginBottom:22}}>
            <Spec label="РАЗМЕР" value={p.size} />
            <Spec label="СОСТОЯНИЕ" value={p.cond} dot />
            {p.verified && (
              <div style={{flex:1, background:C.accent, borderRadius:0, padding:'10px 12px', display:'flex', flexDirection:'column', justifyContent:'center', color:'#000'}}>
                <div style={{display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:700}}><Ic.check width="14" height="14"/> Проверено</div>
                <div style={{fontSize:13, fontWeight:700, marginTop:1}}>ARVELL</div>
              </div>
            )}
          </div>

          <div style={{fontSize:16, fontWeight:700, marginBottom:8}}>Описание</div>
          <div style={{fontSize:15, color:C.sub2, lineHeight:1.55, marginBottom:22}}>{p.desc}</div>

          <div style={{height:1, background:C.line, margin:'0 0 16px'}}/>
          <button onClick={()=>go({s:'sellerProfile', id:p.id})} style={{display:'flex', alignItems:'center', gap:13, width:'100%', background:'none', border:'none', cursor:'pointer', padding:'0 0 24px', color:C.text}}>
            <Avatar name={p.seller.name} size={48} ring />
            <div style={{flex:1, textAlign:'left'}}>
              <div style={{fontSize:16, fontWeight:700}}>{p.seller.name}</div>
              <div style={{fontSize:13.5, color:C.sub, marginTop:2}}>{p.seller.sales} продаж</div>
            </div>
            <Ic.chevron width="22" height="22" style={{color:C.sub}}/>
          </button>
        </div>
      </div>

      {/* sticky buy bar (buyer) or seller controls */}
      {isSeller ? (
        <div style={{flexShrink:0, padding:'12px 16px', paddingBottom:20, background:`linear-gradient(transparent, ${C.bg} 22%)`, display:'flex', gap:12}}>
          {sold ? (
            <div style={{flex:1, height:56, borderRadius:0, background:C.card, color:C.sub2, display:'flex', alignItems:'center', justifyContent:'center', gap:9, fontSize:15, fontWeight:600}}>
              <Ic.check width="19" height="19" style={{color:C.accent}}/> Отмечено проданным
            </div>
          ) : (
            <button onClick={()=>go({s:'addProduct'})} style={{flex:1, height:56, borderRadius:0, background:C.card, color:'#fff', border:`1px solid ${C.line}`, fontSize:16, fontWeight:700, cursor:'pointer'}}>Редактировать</button>
          )}
        </div>
      ) : (
      <div style={{flexShrink:0, padding:'12px 16px', paddingBottom:20, background:`linear-gradient(transparent, ${C.bg} 22%)`, display:'flex', gap:12}}>
        <button onClick={()=>startBuy(p.id)} style={{flex:1, height:56, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:17, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:9, cursor:'pointer'}}>
          Купить
        </button>
        <button onClick={()=>startBuy(p.id)} style={{width:56, height:56, borderRadius:0, background:C.card, color:'#fff', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
          <Ic.chat width="23" height="23"/>
        </button>
      </div>
      )}
    </>
  );
}

function Spec({ label, value, dot }) {
  return (
    <div style={{flex:1, background:C.card, borderRadius:0, padding:'10px 12px'}}>
      <div style={{fontSize:10.5, color:C.sub, fontWeight:600, letterSpacing:.6}}>{label}</div>
      <div style={{fontSize:14, fontWeight:600, marginTop:4, display:'flex', alignItems:'center', gap:6}}>
        {dot && <span style={{width:7, height:7, borderRadius:4, background:C.green}}/>}{value}
      </div>
    </div>
  );
}

function Avatar({ name, size=44, ring, bg=C.cardHi }) {
  return (
    <div style={{width:size, height:size, borderRadius:size/2, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      border: ring ? `2px solid ${C.accent}` : 'none', color: ring?C.accent:'#fff', fontSize:size*0.4, fontWeight:700}}>
      {name.trim()[0]}
    </div>
  );
}

// ---------------- SCREEN 3: CATALOG ----------------
function CatalogScreen({ go, favs, toggleFav }) {
  const [cat, setCat] = React.useState('all');
  const [brand, setBrand] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const brands = [...new Set(PRODUCTS.map(p=>p.brand))];
  const items = PRODUCTS.filter(p =>
    (cat==='all'||p.cat===cat) && (!brand || p.brand===brand) &&
    (!query.trim() || (p.brand+' '+p.model).toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <>
      <Header title="Каталог" />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        <div style={{width:'100%', height:46, borderRadius:0, background:C.card, border:`1px solid ${query?C.accent:C.line}`, display:'flex', alignItems:'center', gap:10, padding:'0 14px', marginBottom:20}}>
          <Ic.search width="19" height="19" style={{color:C.sub}}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск в каталоге..." style={inputReset}/>
          {query && <button onClick={()=>setQuery('')} style={{background:'none', border:'none', color:C.sub, cursor:'pointer', display:'flex'}}><Ic.close width="17" height="17"/></button>}
        </div>

        <div style={secHd}>Категории</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22}}>
          {CATS.filter(c=>c.id!=='all').map(c => {
            const count = PRODUCTS.filter(p=>p.cat===c.id).length;
            const on = cat===c.id;
            return (
              <button key={c.id} onClick={()=>setCat(on?'all':c.id)} style={{textAlign:'left', background: on?C.accent:C.card, border:`1px solid ${on?C.accent:C.line}`, borderRadius:0, padding:'16px 16px', cursor:'pointer', color: on?'#000':'#fff'}}>
                <div style={{fontSize:16, fontWeight:700}}>{c.label}</div>
                <div style={{fontSize:12.5, marginTop:4, color: on?'rgba(0,0,0,.6)':C.sub}}>{count} товаров</div>
              </button>
            );
          })}
        </div>

        <div style={secHd}>Бренды</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:10, marginBottom:22}}>
          {brands.map(b => {
            const on = brand===b;
            return (
              <button key={b} onClick={()=>setBrand(on?null:b)} style={{padding:'9px 16px', borderRadius:0, background: on?C.accent:C.card, border:`1px solid ${on?C.accent:C.line}`, color: on?'#000':'#fff', fontSize:14, fontWeight:500, cursor:'pointer'}}>{b}</button>
            );
          })}
        </div>

        <div style={{display:'flex', alignItems:'center', justifyContent:'flex-end'}}>
          {(cat!=='all'||brand) && <button onClick={()=>{setCat('all'); setBrand(null);}} style={{background:'none', border:'none', color:C.accent, fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:12}}>Сбросить</button>}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {items.map(p => <MiniCard key={p.id} p={p} fav={favs[p.id]} onFav={()=>toggleFav(p.id)} onOpen={()=>go({s:'product', id:p.id})} />)}
        </div>
        {items.length===0 && <div style={{color:C.sub, fontSize:14, textAlign:'center', padding:'30px 0'}}>Ничего не найдено</div>}
      </div>
    </>
  );
}

// ---------------- SELLER PROFILE ----------------
const SELLER_REVIEWS = [
  { name:'Марина К.', rating:5, date:'2 недели назад', text:'Всё точно как в описании, встретились быстро, товар в идеальном состоянии.' },
  { name:'Тимур А.', rating:5, date:'месяц назад', text:'Продавец на связи, договорились без проблем. Рекомендую.' },
  { name:'Ольга В.', rating:4, date:'2 месяца назад', text:'Хорошее состояние, но пришлось немного подождать встречи.' },
];
function SellerProfileScreen({ id, go, favs, toggleFav }) {
  const p = byId(id);
  const seller = p.seller;
  const listings = PRODUCTS.filter(x => x.seller.name===seller.name);
  return (
    <>
      <Header title="Профиль продавца" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} accentTitle={false} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:20}}>
          <Avatar name={seller.name} size={72} bg={C.cardHi} ring />
          <div style={{flex:1}}>
            <div style={{fontSize:19, fontWeight:800}}>{seller.name}</div>
            <div style={{display:'flex', alignItems:'center', gap:7, marginTop:5}}>
              <Ic.star width="15" height="15" style={{color:C.accent}}/>
              <span style={{fontSize:14.5, fontWeight:600}}>{p.rating}</span>
              <span style={{fontSize:13.5, color:C.sub}}>· {SELLER_REVIEWS.length} отзыва · {seller.sales} продаж</span>
            </div>
            <div style={{marginTop:7, display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:700, color:'#000', background:C.accent, padding:'3px 9px', borderRadius:7}}>
              <Ic.check width="12" height="12"/> Проверенный продавец
            </div>
          </div>
        </div>

        {listings.length>0 && (
          <>
            <div style={secHd}>Объявления продавца</div>
            <div style={{display:'flex', gap:12, overflowX:'auto', margin:'0 -16px 24px', padding:'0 16px 4px'}} className="scroll">
              {listings.map(l => (
                <button key={l.id} onClick={()=>go({s:'product', id:l.id})} style={{...cardBtn, width:130, flexShrink:0}}>
                  <ProductImg kind={l.kind} h={110} radius={0}/>
                  <div style={{padding:'8px 10px 11px'}}>
                    <div style={{fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{l.brand}</div>
                    <div style={{fontSize:13, fontWeight:800, color:C.accent, marginTop:4}}>{money(l.price)}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div style={secHd}>Отзывы покупателей</div>
        <div style={{background:C.card, borderRadius:0, overflow:'hidden'}}>
          {SELLER_REVIEWS.map((r,i) => (
            <div key={i} style={{padding:'14px 14px', borderBottom: i===SELLER_REVIEWS.length-1?'none':`1px solid ${C.bg}`}}>
              <div style={{display:'flex', alignItems:'center', gap:11, marginBottom:8}}>
                <Avatar name={r.name} size={34} />
                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:600}}>{r.name}</div>
                  <div style={{display:'flex', alignItems:'center', gap:2, marginTop:2}}>
                    {Array.from({length:5}).map((_,k) => (
                      <Ic.star key={k} width="11" height="11" style={{color: k<r.rating?C.accent:C.line}}/>
                    ))}
                  </div>
                </div>
                <span style={{fontSize:12, color:C.sub, flexShrink:0}}>{r.date}</span>
              </div>
              <div style={{fontSize:13.5, color:C.sub2, lineHeight:1.5}}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const secHd = { fontSize:16, fontWeight:700, marginBottom:12 };
const inputReset = { flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:15, fontFamily:'inherit' };

Object.assign(window, { HomeScreen, ProductScreen, CatalogScreen, SellerProfileScreen, Avatar, cardBtn });
