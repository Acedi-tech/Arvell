// ===== ARVELL — Profile, Add Product, Checkout, Favorites =====

// ---------------- SCREEN 7: PROFILE ----------------
function ProfileScreen({ go, isSeller, setSeller, favCount, onLogout, profile }) {
  const settings = [
    { icon:'bell', label:'Уведомления', s:'notifSettings' },
    { icon:'chat', label:'Чат с поддержкой', s:'chat', id:'support' },
    { icon:'help', label:'Помощь', s:'help' },
    { icon:'doc', label:'Правила', s:'rules' },
    ...(isSeller ? [{ icon:'settings', label:'Админ-панель', s:'admin' }] : []),
  ];
  return (
    <>
      <Header title="Профиль" right={<RoundBtn bg="transparent" color={C.sub} onClick={()=>setSeller(!isSeller)}><Ic.settings width="22" height="22"/></RoundBtn>} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:18}}>
          <Avatar name={profile.name} size={80} bg={C.cardHi} />
          <div style={{flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontSize:20, fontWeight:800}}>{profile.name}</span>
            </div>
            {isSeller && (
              <div style={{display:'flex', alignItems:'center', gap:7, marginTop:5}}>
                <Ic.star width="16" height="16" style={{color:C.accent}}/>
                <span style={{fontSize:15, fontWeight:600}}>4.8</span>
                <span style={{fontSize:14, color:C.sub}}>· 34 отзыва</span>
              </div>
            )}
            {isSeller && <div style={{marginTop:7, display:'inline-flex', fontSize:11.5, fontWeight:700, color:'#000', background:C.accent, padding:'3px 9px', borderRadius:7}}>Продавец</div>}
          </div>
        </div>

        <button onClick={()=>go({s:'editProfile'})} style={{width:'100%', height:46, borderRadius:0, background:C.card, color:'#fff', border:`1px solid ${C.line}`, fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:18}}>Редактировать профиль</button>

        <div style={{display:'flex', gap:12, marginBottom:24}}>
          {isSeller ? (
            <>
              <StatBox value="47" label="Продажи" icon="bag" onClick={()=>go({s:'orders'})} />
              <StatBox value="6" label="Мои объявления" icon="grid" onClick={()=>go({s:'myListings'})} />
            </>
          ) : (
            <>
              <StatBox value="12" label="Заказы" icon="bag" onClick={()=>go({s:'orders'})} />
              <StatBox value={String(favCount)} label="Избранное" icon="heart" onClick={()=>go({tab:'favorites'})} />
            </>
          )}
        </div>

        <div style={secHdC}>Настройки</div>
        <div style={{background:C.card, borderRadius:0, overflow:'hidden', marginBottom:14}}>
          {settings.map((s,i) => {
            const I = Ic[s.icon];
            return (
              <div key={s.label} onClick={()=>go(s.id ? {s:s.s, id:s.id} : {s:s.s})} style={{display:'flex', alignItems:'center', gap:13, padding:'14px 14px', borderBottom:`1px solid ${C.bg}`, cursor:'pointer'}}>
                <I width="21" height="21" style={{color:C.sub2}}/>
                <span style={{flex:1, fontSize:15}}>{s.label}</span>
                {s.hint && <span style={{fontSize:12.5, color:C.sub}}>{s.hint}</span>}
                <Ic.chevron width="19" height="19" style={{color:C.sub}}/>
              </div>
            );
          })}
          <div onClick={onLogout} style={{display:'flex', alignItems:'center', gap:13, padding:'14px 14px', cursor:'pointer'}}>
            <Ic.logout width="21" height="21" style={{color:C.red}}/>
            <span style={{flex:1, fontSize:15, color:C.red}}>Выйти</span>
          </div>
        </div>

        <div style={{textAlign:'center', fontSize:12, color:C.sub, padding:'4px 0 8px'}}>ARVELL · версия 1.4.0</div>
      </div>
    </>
  );
}

// ---------------- MY LISTINGS (seller) ----------------
function MyListingsScreen({ go }) {
  const [listings, setListings] = React.useState(() => PRODUCTS.slice(0, 6).map(p => ({ ...p, listingStatus:'active' })));
  const [menuFor, setMenuFor] = React.useState(null);

  const markSold = (id) => { setListings(ls => ls.map(l => l.id===id ? {...l, listingStatus:'sold'} : l)); setMenuFor(null); };
  const removeListing = (id) => {
    if (!window.confirm('Удалить объявление? Это действие нельзя отменить.')) { setMenuFor(null); return; }
    setListings(ls => ls.filter(l => l.id!==id));
    setMenuFor(null);
  };

  return (
    <>
      <Header title="Мои объявления" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll" onClick={()=>setMenuFor(null)}>
        <button onClick={()=>go({s:'addProduct'})} style={{width:'100%', height:48, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:20}}>
          <Ic.plus width="20" height="20"/> Добавить товар
        </button>
        {listings.length===0 && <div style={{color:C.sub, fontSize:14, textAlign:'center', padding:'30px 0'}}>Объявлений пока нет</div>}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {listings.map(p => (
            <div key={p.id} style={{position:'relative', opacity: p.listingStatus==='sold'?.55:1}}>
              <MiniCard p={p} onOpen={()=>go({s:'product', id:p.id})}
                topRight={
                  <div onClick={(e)=>{e.stopPropagation(); setMenuFor(menuFor===p.id?null:p.id);}} style={{position:'absolute', top:8, right:8, width:32, height:32, borderRadius:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer'}}>
                    <Ic.trash width="16" height="16"/>
                  </div>
                } />
              <div style={{position:'absolute', top:150-30, right:44, background: p.listingStatus==='sold'?C.card:C.accentDim, color: p.listingStatus==='sold'?C.sub2:C.accent, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6}}>
                {p.listingStatus==='sold' ? 'Продано' : 'Активно'}
              </div>
              {menuFor===p.id && (
                <div onClick={(e)=>e.stopPropagation()} style={{position:'absolute', top:44, right:8, zIndex:10, background:C.cardHi, border:`1px solid ${C.line}`, borderRadius:0, overflow:'hidden', minWidth:170, boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
                  {p.listingStatus!=='sold' && (
                    <button onClick={()=>markSold(p.id)} style={{width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', borderBottom:`1px solid ${C.bg}`, padding:'11px 14px', color:'#fff', fontSize:13.5, cursor:'pointer', textAlign:'left'}}>
                      <Ic.check width="15" height="15" style={{color:C.accent}}/> Отметить проданным
                    </button>
                  )}
                  <button onClick={()=>removeListing(p.id)} style={{width:'100%', display:'flex', alignItems:'center', gap:9, background:'none', border:'none', padding:'11px 14px', color:C.red, fontSize:13.5, cursor:'pointer', textAlign:'left'}}>
                    <Ic.trash width="15" height="15"/> Удалить объявление
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function StatBox({ value, label, icon, onClick }) {
  const I = Ic[icon];
  return (
    <button onClick={onClick} style={{flex:1, background:C.card, borderRadius:0, padding:'14px 8px', border:'none', cursor: onClick?'pointer':'default', color:C.text, display:'flex', flexDirection:'column', alignItems:'center', gap:5}}>
      <I width="20" height="20" style={{color:C.accent}}/>
      <span style={{fontSize:19, fontWeight:800}}>{value}</span>
      <span style={{fontSize:12, color:C.sub}}>{label}</span>
    </button>
  );
}

// ---------------- NOTIFICATION SETTINGS ----------------
function NotifSettingsScreen({ go }) {
  const [prefs, setPrefs] = React.useState({
    messages: true, deals: true, priceDrops: true, promo: false,
  });
  const set = (k) => setPrefs(p => ({...p, [k]: !p[k]}));
  const groups = [
    { title:'Сделки', items:[
      { k:'messages', label:'Новые сообщения', sub:'Когда продавец или покупатель пишет вам' },
      { k:'deals', label:'Статус сделки', sub:'Оформление, подтверждение, завершение' },
    ]},
    { title:'Товары', items:[
      { k:'priceDrops', label:'Снижение цены', sub:'На товары из избранного' },
      { k:'promo', label:'Новости и акции', sub:'Подборки и предложения ARVELL' },
    ]},
  ];
  return (
    <>
      <Header title="Уведомления" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} accentTitle={false} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        {groups.map(g => (
          <div key={g.title} style={{marginBottom:22}}>
            <div style={secHdC}>{g.title}</div>
            <div style={{background:C.card, borderRadius:0, overflow:'hidden'}}>
              {g.items.map((it,i) => (
                <div key={it.k} style={{display:'flex', alignItems:'center', gap:13, padding:'14px 14px', borderBottom: i===g.items.length-1?'none':`1px solid ${C.bg}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15, fontWeight:600}}>{it.label}</div>
                    <div style={{fontSize:12.5, color:C.sub, marginTop:2}}>{it.sub}</div>
                  </div>
                  <Toggle on={prefs[it.k]} onToggle={()=>set(it.k)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------- HELP ----------------
function HelpScreen({ go }) {
  const [open, setOpen] = React.useState(null);
  const faqs = [
    { q:'Как понять, что товар прошёл проверку подлинности?', a:'На карточке товара и рядом с продавцом появляется бейдж «Проверено ARVELL» — значит вещь осмотрена нашими экспертами перед публикацией.' },
    { q:'Когда и как я оплачиваю товар?', a:'Оплата происходит лично при встрече с продавцом, после того как вы осмотрели вещь. ARVELL платежи не проводит и не хранит ваши карты.' },
    { q:'Кто организует доставку?', a:'Доставку организует продавец. Место, время и способ передачи товара вы согласовываете с ним в чате.' },
    { q:'Как стать продавцом на ARVELL?', a:'Продавцы регистрируются только по приглашению от действующего продавца. Попросите код приглашения у знакомого продавца ARVELL.' },
    { q:'Что делать, если товар не соответствует описанию?', a:'Не забирайте и не оплачивайте товар при встрече, если он не соответствует описанию в объявлении. Опишите ситуацию в поддержку через чат.' },
  ];
  return (
    <>
      <Header title="Помощь" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} accentTitle={false} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        <div style={secHdC}>Частые вопросы</div>
        <div style={{background:C.card, borderRadius:0, overflow:'hidden', marginBottom:22}}>
          {faqs.map((f,i) => {
            const isOpen = open===i;
            return (
              <div key={i} style={{borderBottom: i===faqs.length-1?'none':`1px solid ${C.bg}`}}>
                <button onClick={()=>setOpen(isOpen?null:i)} style={{width:'100%', background:'none', border:'none', cursor:'pointer', color:C.text, display:'flex', alignItems:'center', gap:12, padding:'14px 14px', textAlign:'left'}}>
                  <span style={{flex:1, fontSize:14.5, fontWeight:600, lineHeight:1.4}}>{f.q}</span>
                  <Ic.chevron width="18" height="18" style={{color:C.sub, flexShrink:0, transform: isOpen?'rotate(90deg)':'none', transition:'transform .15s'}}/>
                </button>
                {isOpen && <div style={{padding:'0 14px 16px', fontSize:13.5, color:C.sub2, lineHeight:1.55}}>{f.a}</div>}
              </div>
            );
          })}
        </div>

        <div style={secHdC}>Служба поддержки</div>
        <div style={{background:C.card, borderRadius:0, overflow:'hidden'}}>
          <SupportRow icon="chat" label="Написать в поддержку" sub="Ответим в течение дня" />
          <SupportRow icon="phone" label="+7 (800) 555-01-01" sub="Ежедневно с 9:00 до 21:00" last />
        </div>
      </div>
    </>
  );
}
function SupportRow({ icon, label, sub, last }) {
  const I = Ic[icon];
  return (
    <div style={{display:'flex', alignItems:'center', gap:13, padding:'14px 14px', borderBottom: last?'none':`1px solid ${C.bg}`, cursor:'pointer'}}>
      <div style={{width:38, height:38, borderRadius:0, background:C.accentDim, color:C.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><I width="18" height="18"/></div>
      <div style={{flex:1}}>
        <div style={{fontSize:15, fontWeight:600}}>{label}</div>
        <div style={{fontSize:12.5, color:C.sub, marginTop:2}}>{sub}</div>
      </div>
      <Ic.chevron width="18" height="18" style={{color:C.sub}}/>
    </div>
  );
}

// ---------------- RULES ----------------
function RulesScreen({ go }) {
  const sections = [
    { title:'Как работает ARVELL', body:'Покупатель общается с продавцом в чате и договаривается о встрече. Оплата происходит лично, при получении товара. ARVELL не проводит платежи и не хранит средства пользователей.' },
    { title:'Проверка подлинности', body:'Товары продавцов, прошедших проверку, отмечены бейджем «Проверено ARVELL». Это не гарантирует состояние конкретного экземпляра — осмотрите вещь при встрече.' },
    { title:'Продавцы', body:'Регистрация продавца возможна только по приглашению от действующего продавца ARVELL. Продавец обязан указывать точное состояние и подлинные фотографии товара.' },
    { title:'Доставка и встречи', body:'ARVELL не организует доставку и не несёт ответственности за встречу между покупателем и продавцом. Выбирайте безопасное людное место.' },
    { title:'Отмена сделки', body:'Любая сторона может отказаться от сделки до момента передачи товара и оплаты без каких-либо санкций.' },
    { title:'Ответственность', body:'ARVELL — площадка для общения покупателей и продавцов и не является стороной сделки купли-продажи.' },
  ];
  return (
    <>
      <Header title="Правила" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} accentTitle={false} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 24px'}} className="scroll">
        {sections.map((s,i) => (
          <div key={i} style={{marginBottom:20}}>
            <div style={{fontSize:15.5, fontWeight:700, marginBottom:6, display:'flex', alignItems:'center', gap:8}}>
              <span style={{width:22, height:22, borderRadius:0, background:C.accentDim, color:C.accent, fontSize:12, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>{i+1}</span>
              {s.title}
            </div>
            <div style={{fontSize:13.5, color:C.sub2, lineHeight:1.6, paddingLeft:30}}>{s.body}</div>
          </div>
        ))}
        <div style={{fontSize:12, color:C.sub, textAlign:'center', marginTop:8}}>Последнее обновление: июнь 2026</div>
      </div>
    </>
  );
}
function EditProfileScreen({ profile, setProfile, go }) {
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone || '');
  const [city, setCity] = React.useState(profile.city || '');
  const [bio, setBio] = React.useState(profile.bio || '');
  const [saved, setSaved] = React.useState(false);
  const dirty = name!==profile.name || phone!==(profile.phone||'') || city!==(profile.city||'') || bio!==(profile.bio||'');

  const save = () => {
    setProfile(p => ({ ...p, name: name.trim() || p.name, phone, city, bio }));
    setSaved(true);
    setTimeout(()=>go({back:true}), 550);
  };

  return (
    <>
      <Header title="Редактирование" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} accentTitle={false} />
      <div style={{flex:1, overflowY:'auto', padding:'8px 16px 16px'}} className="scroll">
        <div style={{display:'flex', justifyContent:'center', marginBottom:26}}>
          <div style={{position:'relative'}}>
            <div style={{width:96, height:96, borderRadius:0, background:C.cardHi, display:'flex', alignItems:'center', justifyContent:'center', color:C.sub, fontSize:36, fontWeight:700}}>
              {name.trim() ? name.trim()[0].toUpperCase() : <Ic.user width="42" height="42"/>}
            </div>
            <button style={{position:'absolute', bottom:-2, right:-2, width:32, height:32, borderRadius:0, background:C.accent, color:'#000', border:`3px solid ${C.bg}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Ic.camera width="17" height="17"/></button>
          </div>
        </div>

        <div style={lbl}>Имя и фамилия</div>
        <div style={{...fieldBox, borderColor: name?C.accent:C.line}}><input value={name} onChange={e=>setName(e.target.value)} placeholder="Александр Петров" style={inputReset}/></div>

        <div style={lbl}>Телефон</div>
        <div style={{...fieldBox, background:C.card, opacity:.7}}>
          <input value={phone} disabled style={{...inputReset, color:C.sub2, cursor:'not-allowed'}}/>
          <Ic.check width="17" height="17" style={{color:C.green, flexShrink:0}}/>
        </div>

        <div style={lbl}>Город</div>
        <div style={fieldBox}><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Москва" style={inputReset}/></div>

        <div style={lbl}>О себе</div>
        <div style={{...fieldBox, minHeight:90, alignItems:'flex-start', padding:'14px 16px'}}>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Пара слов о себе (необязательно)" rows={3}
            style={{...inputReset, resize:'none', lineHeight:1.4}}/>
        </div>

        <div style={{fontSize:12.5, color:C.sub, lineHeight:1.5, padding:'2px 4px 4px', display:'flex', gap:8, alignItems:'flex-start'}}>
          <Ic.shield width="15" height="15" style={{color:C.sub, flexShrink:0, marginTop:1}}/>
          Номер телефона подтверждён и не может быть изменён здесь. Чтобы сменить номер — обратитесь в поддержку.
        </div>
      </div>

      <div style={{flexShrink:0, padding:'12px 16px 22px', background:C.bg}}>
        <button onClick={save} disabled={!dirty && !saved} style={{...btnPrimary, opacity: (dirty||saved)?1:.4, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
          {saved ? <><Ic.check width="19" height="19"/> Сохранено</> : 'Сохранить'}
        </button>
      </div>
    </>
  );
}

// ---------------- SCREEN 8: ADD PRODUCT ----------------
function AddProductScreen({ go }) {
  const [cond, setCond] = React.useState('Отлично');
  const [photos, setPhotos] = React.useState([true, false, false, false, false]);
  const [brand, setBrand] = React.useState('');
  const [kind, setKind] = React.useState('');
  const [kindOpen, setKindOpen] = React.useState(false);
  const kindOptions = [{k:'shoe', label:'Обувь'}, {k:'tee', label:'Футболка'}, {k:'hoodie', label:'Худи'}, {k:'jacket', label:'Куртка'}, {k:'shirt', label:'Рубашка'}, {k:'pants', label:'Брюки/Джинсы'}, {k:'accessory', label:'Аксессуары'}, {k:'other', label:'Другое'}];
  const kindLabel = kindOptions.find(o=>o.k===kind)?.label;
  const sizePh = { shoe:'EUR 42', tee:'M', hoodie:'L', jacket:'M', shirt:'L', pants:'32/32', accessory:'One size', other:'M' }[kind] || 'M';
  const modelPh = { shoe:'Air Max 90', tee:'Базовая футболка', hoodie:'Худи Hooded', jacket:'Куртка зимняя', shirt:'Оксфорд', pants:'Прямые джинсы', accessory:'Кепка 8-Ball', other:'Название модели' }[kind] || 'Air Max 90';
  const fields = [{k:'model', label:'Модель', ph:modelPh}, {k:'size', label:'Размер', ph:sizePh}, {k:'price', label:'Цена, ₽', ph:'8 900'}];
  const [vals, setVals] = React.useState({});
  return (
    <>
      <Header title="Новый товар" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        <div style={lbl}>Тип товара</div>
        <button onClick={()=>setKindOpen(o=>!o)} style={{...fieldBox, display:'flex', alignItems:'center', cursor:'pointer', marginBottom: kindOpen?8:18}}>
          <span style={{flex:1, textAlign:'left', color: kind?'#fff':C.sub, fontSize:15}}>{kindLabel || 'Выберите тип товара'}</span>
          <Ic.chevDown width="20" height="20" style={{color:C.sub, transform: kindOpen?'rotate(180deg)':'none', transition:'transform .15s'}}/>
        </button>
        {kindOpen && (
          <div style={{background:C.card, borderRadius:0, border:`1px solid ${C.line}`, overflow:'hidden', marginBottom:18}}>
            {kindOptions.map((o,i) => (
              <button key={o.k} onClick={()=>{setKind(o.k); setKindOpen(false);}} style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', borderBottom: i===kindOptions.length-1?'none':`1px solid ${C.bg}`, padding:'13px 16px', cursor:'pointer', color:'#fff', fontSize:15, textAlign:'left'}}>
                {o.label}
                {kind===o.k && <Ic.check width="17" height="17" style={{color:C.accent}}/>}
              </button>
            ))}
          </div>
        )}
        {kind==='other' && (
          <div style={{...fieldBox, marginTop:-8}}><input value={vals.otherKind||''} onChange={e=>setVals({...vals, otherKind:e.target.value})} placeholder="Уточните тип товара" style={inputReset}/></div>
        )}

        <div style={lbl}>Фотографии</div>
        <div style={{display:'flex', gap:10, overflowX:'auto', margin:'0 -16px 22px', padding:'0 16px'}} className="scroll">
          {photos.map((on,i) => (
            <button key={i} onClick={()=>setPhotos(photos.map((p,j)=>j===i?!p:p))} style={{width:88, height:88, flexShrink:0, borderRadius:0, background:C.card, border:`1.5px ${on?'solid':'dashed'} ${on?C.line:'#3a3a3a'}`, cursor:'pointer', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:0}}>
              {on ? <ProductImg kind={kind||'shoe'} h={88} radius={0}/> : <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:C.accent}}><Ic.camera width="26" height="26"/>{i===1 && <span style={{fontSize:10, color:C.sub}}>главное</span>}</div>}
              {on && i===0 && <span style={{position:'absolute', bottom:5, left:5, fontSize:9, fontWeight:700, color:'#000', background:C.accent, padding:'2px 6px', borderRadius:6}}>ГЛАВНОЕ</span>}
            </button>
          ))}
        </div>

        <div style={lbl}>Бренд</div>
        <button onClick={()=>setBrand(brand?'':'Nike')} style={{...fieldBox, display:'flex', alignItems:'center', cursor:'pointer'}}>
          <span style={{flex:1, textAlign:'left', color: brand?'#fff':C.sub, fontSize:15}}>{brand || 'Выберите бренд'}</span>
          <Ic.chevDown width="20" height="20" style={{color:C.sub}}/>
        </button>

        {fields.map(f => (
          <React.Fragment key={f.k}>
            <div style={lbl}>{f.label}</div>
            <div style={fieldBox}><input value={vals[f.k]||''} onChange={e=>setVals({...vals,[f.k]:e.target.value})} placeholder={f.ph} style={inputReset}/></div>
          </React.Fragment>
        ))}

        <div style={lbl}>Состояние</div>
        <div style={{display:'flex', gap:10, marginBottom:22}}>
          {['Отлично','Хорошо','Средне'].map(c => (
            <button key={c} onClick={()=>setCond(c)} style={{flex:1, height:46, borderRadius:0, background: cond===c?C.accent:C.card, color: cond===c?'#000':'#fff', border:`1px solid ${cond===c?C.accent:C.line}`, fontSize:14, fontWeight:600, cursor:'pointer'}}>{c}</button>
          ))}
        </div>

        <div style={lbl}>Описание</div>
        <div style={{...fieldBox, minHeight:96, alignItems:'flex-start', padding:'14px 16px'}}>
          <textarea value={vals.desc||''} onChange={e=>setVals({...vals, desc:e.target.value})} placeholder="Расскажите о состоянии, истории покупки, дефектах — это повышает доверие покупателей" rows={4}
            style={{...inputReset, resize:'none', lineHeight:1.45}}/>
        </div>
      </div>

      <div style={{flexShrink:0, padding:'12px 16px 22px', background:C.bg}}>
        <button onClick={()=>go({s:'addDone'})} style={{width:'100%', height:54, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:17, fontWeight:700, cursor:'pointer'}}>Опубликовать</button>
      </div>
    </>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{width:52, height:31, borderRadius:0, background: on?C.accent:'#3a3a3a', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0}}>
      <span style={{position:'absolute', top:3, left: on?24:3, width:25, height:25, borderRadius:0, background:'#fff', transition:'left .2s'}}/>
    </button>
  );
}

// ---------------- SCREEN 9: DEAL (no payment — оплата при встрече) ----------------
function CheckoutScreen({ id, go, onPaid }) {
  const p = byId(id);
  return (
    <>
      <Header title="Оформление сделки" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        <div style={{display:'flex', gap:13, background:C.card, borderRadius:0, padding:13, marginBottom:18}}>
          <div style={{width:64, height:64, borderRadius:0, overflow:'hidden', flexShrink:0}}><ProductImg kind={p.kind} h={64} radius={0}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:16, fontWeight:700}}>{p.brand} {p.model}</div>
            <div style={{fontSize:13, color:C.sub, marginTop:2}}>{p.size} · {p.cond}</div>
            <div style={{fontSize:13, color:C.sub, marginTop:6, display:'flex', alignItems:'center', gap:6}}><Ic.user width="14" height="14"/>{p.seller.name}</div>
          </div>
        </div>

        <div style={{background:C.card, borderRadius:0, padding:'4px 16px', marginBottom:16}}>
          <Row label="Цена товара" value={money(p.price)} />
          <div style={{height:1, background:C.bg, margin:'2px 0'}}/>
          <Row label="К оплате при встрече" value={money(p.price)} big />
        </div>

        <div style={{display:'flex', gap:13, background:C.accentDim, borderRadius:0, padding:'15px 16px', marginBottom:16}}>
          <Ic.bag width="24" height="24" style={{color:C.accent, flexShrink:0}}/>
          <div style={{fontSize:13.5, color:C.accent, lineHeight:1.5}}>
            <b>Оплата при встрече с продавцом.</b> Деньги вы передаёте продавцу лично при получении товара. ARVELL платежи не проводит.
          </div>
        </div>

        <div style={{display:'flex', gap:13, background:C.card, borderRadius:0, padding:'15px 16px', marginBottom:16}}>
          <Ic.shield width="24" height="24" style={{color:C.accent, flexShrink:0}}/>
          <div style={{fontSize:13.5, color:C.sub2, lineHeight:1.5}}>
            Проверка подлинности включена — товар проверен ARVELL. Осмотрите вещь при встрече перед оплатой.
          </div>
        </div>

        <div style={{display:'flex', gap:11, alignItems:'flex-start', padding:'0 4px'}}>
          <Ic.chat width="19" height="19" style={{color:C.sub, flexShrink:0, marginTop:1}}/>
          <div style={{fontSize:13, color:C.sub, lineHeight:1.5}}>Место и время встречи, а также доставку согласуйте с продавцом в чате.</div>
        </div>
      </div>

      <div style={{flexShrink:0, padding:'12px 16px 22px', background:C.bg}}>
        <button onClick={()=>onPaid(p.price)} style={{width:'100%', height:56, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:17, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:9, cursor:'pointer'}}>
          <Ic.check width="21" height="21"/> Подтвердить сделку
        </button>
      </div>
    </>
  );
}

function Row({ label, value, big, sub }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0'}}>
      <span style={{fontSize: big?16:14.5, fontWeight: big?700:400, color: big?'#fff':C.sub2}}>{label}</span>
      <span style={{fontSize: big?20:15, fontWeight: big?800:600, color: big?C.accent:'#fff'}}>{value}</span>
    </div>
  );
}

// ---------------- FAVORITES ----------------
function FavoritesScreen({ go, favs, toggleFav }) {
  const items = PRODUCTS.filter(p => favs[p.id]);
  return (
    <>
      <Header title="Избранное" />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        {items.length===0 ? (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70%', gap:14, textAlign:'center'}}>
            <div style={{width:72, height:72, borderRadius:0, background:C.card, display:'flex', alignItems:'center', justifyContent:'center', color:C.sub}}><Ic.heart width="34" height="34"/></div>
            <div style={{fontSize:16, fontWeight:600}}>Пока пусто</div>
            <div style={{fontSize:14, color:C.sub, maxWidth:220}}>Добавляйте товары в избранное, нажимая на сердечко</div>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            {items.map(p => <MiniCard key={p.id} p={p} fav={true} onFav={()=>toggleFav(p.id)} onOpen={()=>go({s:'product', id:p.id})} />)}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------- ORDERS ----------------
function OrdersScreen({ go, chats, isSeller }) {
  const active = chats.filter(c => c.buy);
  const history = [
    { id:'h1', kind:'shoe', title:'Nike Air Max 90', sub:'Покупка · 14 мая', price:8900, dir:'buy' },
    { id:'h2', kind:'tee', title:'Carhartt WIP Футболка', sub:'Покупка · 2 мая', price:3200, dir:'buy' },
    { id:'h3', kind:'jacket', title:'The North Face Куртка', sub:isSeller?'Продажа · 28 апр':'Покупка · 28 апр', price:15900, dir:isSeller?'sell':'buy' },
  ];
  return (
    <>
      <Header title="Заказы" left={<RoundBtn bg="transparent" size={34} onClick={()=>go({back:true})}><Ic.back width="22" height="22"/></RoundBtn>} />
      <div style={{flex:1, overflowY:'auto', padding:'4px 16px 16px'}} className="scroll">
        {active.length>0 && (
          <>
            <div style={secHdC}>Активные</div>
            <div style={{background:C.card, borderRadius:0, overflow:'hidden', marginBottom:24}}>
              {active.map((c,i) => {
                const p = byId(c.productId);
                if (!p) return null;
                return (
                  <div key={c.id} onClick={()=>go({s:'chat', id:c.id})} style={{display:'flex', alignItems:'center', gap:13, padding:'12px 14px', borderBottom: i===active.length-1?'none':`1px solid ${C.bg}`, cursor:'pointer'}}>
                    <div style={{width:46, height:46, borderRadius:0, overflow:'hidden', flexShrink:0}}><ProductImg kind={p.kind} h={46} radius={0}/></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14.5, fontWeight:600}}>{p.brand} {p.model}</div>
                      <div style={{fontSize:12.5, color:C.accent, marginTop:2, display:'flex', alignItems:'center', gap:5}}><Ic.clock width="12" height="12"/>{isSeller ? 'Ожидает встречи с покупателем' : 'Ожидает встречи с продавцом'}</div>
                    </div>
                    <div style={{fontSize:14.5, fontWeight:700}}>{money(p.price)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={secHdC}>История</div>
        <div style={{background:C.card, borderRadius:0, overflow:'hidden'}}>
          {history.map((h,i) => (
            <div key={h.id} style={{display:'flex', alignItems:'center', gap:13, padding:'12px 14px', borderBottom: i===history.length-1?'none':`1px solid ${C.bg}`}}>
              <div style={{width:46, height:46, borderRadius:0, overflow:'hidden', flexShrink:0}}><ProductImg kind={h.kind} h={46} radius={0}/></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14.5, fontWeight:600}}>{h.title}</div>
                <div style={{fontSize:12.5, color:C.sub, marginTop:2}}>{h.sub}</div>
              </div>
              <div style={{fontSize:14.5, fontWeight:700, color: h.dir==='sell'?C.green:'#fff'}}>{h.dir==='sell'?'+':''}{money(h.price)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------- Success overlay ----------------
function Success({ data, onClose }) {
  return (
    <div style={{position:'absolute', inset:0, background:'rgba(10,10,10,.96)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center', zIndex:50, animation:'fade .25s ease'}}>
      <div style={{width:88, height:88, borderRadius:0, background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#000', marginBottom:24}}><Ic.check width="48" height="48"/></div>
      <div style={{fontSize:23, fontWeight:800, marginBottom:10}}>{data.title}</div>
      <div style={{fontSize:15, color:C.sub2, lineHeight:1.5, maxWidth:280, marginBottom:32}}>{data.body}</div>
      <button onClick={onClose} style={{width:'100%', maxWidth:300, height:54, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:16, fontWeight:700, cursor:'pointer'}}>{data.cta}</button>
    </div>
  );
}

const lbl = { fontSize:13, fontWeight:600, color:C.sub2, margin:'0 2px 8px' };
const fieldBox = { width:'100%', minHeight:50, background:C.card, borderRadius:0, border:`1px solid ${C.line}`, padding:'0 16px', marginBottom:18, display:'flex', alignItems:'center' };
const secHdC = { fontSize:16, fontWeight:700, marginBottom:12, marginTop:4 };

Object.assign(window, { ProfileScreen, AddProductScreen, CheckoutScreen, FavoritesScreen, Success, Toggle, EditProfileScreen, NotifSettingsScreen, HelpScreen, RulesScreen, OrdersScreen, MyListingsScreen });
