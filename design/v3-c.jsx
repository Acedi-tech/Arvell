// ===== ARVELL v3 — profile, settings, docs, listings, add product =====
function V3Tile({ icon, value, label, onClick }) {
  const I = Ic[icon];
  return (
    <button onClick={onClick} style={{flex:1, background:C.card, border:`1px solid ${C.line}`, padding:'14px 8px', cursor:'pointer', color:C.text, display:'flex', flexDirection:'column', alignItems:'center', gap:5, fontFamily:'inherit'}}>
      <I width="20" height="20" style={{color:C.accent}}/>
      <span style={{fontSize:20, fontWeight:800, ...vWide}}>{value}</span>
      <span style={{...vMono, fontSize:10, color:C.sub}}>{label}</span>
    </button>
  );
}
function V3SetRow({ icon, label, onClick, danger, last }) {
  const I = Ic[icon];
  return (
    <button onClick={onClick} style={{width:'100%', display:'flex', alignItems:'center', gap:13, padding:'14px 14px', background:'none', border:'none', borderBottom: last?'none':`1px solid ${C.line}`, color: danger?C.red:C.text, cursor:'pointer', fontSize:15, textAlign:'left', fontFamily:'inherit'}}>
      <I width="20" height="20" style={{color: danger?C.red:C.sub2}}/>
      <span style={{flex:1}}>{label}</span>
      {!danger && <Ic.chevron width="18" height="18" style={{color:C.sub}}/>}
    </button>
  );
}

// ---------------- 11 / 12. PROFILE ----------------
function V3Profile({ go, isSeller, profile, favCount, deals, sales, reviews, onLogout, onDeleteAccount, isAdmin, setAdmin }) {
  const [dlg, setDlg] = React.useState(null);
  const [taps, setTaps] = React.useState(0);
  const myRev = PRODUCTS.slice(0,6).flatMap(p => reviews[p.id]||[]);
  const tapVersion = () => { const n = taps+1; setTaps(n); if (n>=5) { setAdmin(!isAdmin); setTaps(0); } };
  return (
    <>
      <VHeader title="Профиль"/>
      <div style={{flex:1, overflowY:'auto', padding:'18px 16px 16px'}} className="scroll">
        <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:16}}>
          <Avatar name={profile.name} size={80} ring={isSeller}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:20, fontWeight:800, ...vWide, letterSpacing:-.4}}>{isSeller && profile.shop ? profile.shop : profile.name}</div>
            {isSeller && profile.shop && <div style={{fontSize:13, color:C.sub, marginTop:2}}>{profile.name}</div>}
            {isSeller && <div style={{display:'flex', alignItems:'center', gap:6, marginTop:6, whiteSpace:'nowrap'}}><Ic.star width="14" height="14" style={{color:C.accent}}/><span style={{fontSize:14, fontWeight:600}}>{avg(myRev).toFixed(1)}</span><span style={{fontSize:13, color:C.sub}}>· {reviewsWord(myRev.length)}</span></div>}
            <div style={{marginTop:8, display:'inline-flex', padding:'4px 8px', ...vMono, fontSize:10, fontWeight:600, background: isSeller?C.accent:C.cardHi, color: isSeller?'#000':C.sub2}}>{isSeller ? 'Продавец' : 'Покупатель'}</div>
          </div>
        </div>
        <button onClick={()=>go({s:'editProfile'})} style={{...vGhost, width:'100%', marginBottom:16, whiteSpace:'nowrap', fontSize:12}}>Редактировать профиль</button>
        <div style={{display:'flex', gap:8, marginBottom:24}}>
          {isSeller ? (
            <>
              <V3Tile icon="bag" value={sales.length} label="Продажи" onClick={()=>go({s:'deals'})}/>
              <V3Tile icon="grid" value={6} label="Объявления" onClick={()=>go({s:'myListings'})}/>
              <V3Tile icon="star" value={myRev.length} label="Отзывы" onClick={()=>go({s:'reviews', seller:'__me'})}/>
            </>
          ) : (
            <>
              <V3Tile icon="bag" value={deals.length} label="Заказы" onClick={()=>go({s:'deals'})}/>
              <V3Tile icon="heart" value={favCount} label="Избранное" onClick={()=>go({tab:'favorites'})}/>
            </>
          )}
        </div>
        <div style={vLbl}>Настройки</div>
        <div style={{border:`1px solid ${C.line}`, marginBottom:16}}>
          <V3SetRow icon="bell" label="Уведомления" onClick={()=>go({s:'notifSettings'})}/>
          <V3SetRow icon="help" label="Помощь" onClick={()=>go({s:'help'})}/>
          <V3SetRow icon="doc" label="Правила" onClick={()=>go({s:'doc', doc:'rules'})}/>
          {isAdmin && <V3SetRow icon="settings" label="Админ-панель" onClick={()=>go({s:'admin'})}/>}
          <V3SetRow icon="logout" label="Выйти" danger last onClick={()=>setDlg('logout')}/>
        </div>
        <div style={{textAlign:'center'}}><button onClick={()=>setDlg('delete')} style={{background:'none', border:'none', color:C.red, fontSize:13, cursor:'pointer', padding:'6px', fontFamily:'inherit', whiteSpace:'nowrap'}}>Удалить аккаунт</button></div>
        <div onClick={tapVersion} style={{textAlign:'center', fontSize:12, color:'#5a5a5a', padding:'14px 0 4px', userSelect:'none'}}>ARVELL · версия 1.0.0</div>
      </div>
      {dlg==='logout' && <VDialog title="Выйти из аккаунта?" ok="Выйти" danger onCancel={()=>setDlg(null)} onOk={()=>{ setDlg(null); onLogout(); }}/>}
      {dlg==='delete' && <VDialog title="Удалить аккаунт?" text={isSeller ? 'Профиль, магазин и все объявления будут удалены без возможности восстановления' : 'Профиль, избранное и история будут удалены без возможности восстановления'} ok="Удалить" danger onCancel={()=>setDlg(null)} onOk={()=>{ setDlg(null); onDeleteAccount(); }}/>}
    </>
  );
}

// ---------------- 13. EDIT PROFILE ----------------
function V3EditProfile({ go, profile, setProfile, isSeller }) {
  const init = { name: profile.name||'', shop: profile.shop||'', about: profile.about||'' };
  const [f, setF] = React.useState(init);
  const [ask, setAsk] = React.useState(false);
  const dirty = JSON.stringify(f)!==JSON.stringify(init);
  const save = () => { setProfile(p => ({...p, ...f})); go({back:true}); };
  const field = (k, label, ph, multi) => (
    <div style={{marginBottom:18}}>
      <div style={vLbl}>{label}</div>
      <div style={{...vField, ...(multi?{alignItems:'flex-start', padding:'12px 14px'}:{}), borderColor: f[k]!==init[k]?C.accent:C.line}}>
        {multi ? <textarea rows={4} value={f[k]} onChange={e=>setF({...f, [k]:e.target.value})} placeholder={ph} style={{...vInput, resize:'none', lineHeight:1.45}}/> : <input value={f[k]} onChange={e=>setF({...f, [k]:e.target.value})} placeholder={ph} style={vInput}/>}
      </div>
    </div>
  );
  return (
    <>
      <VHeader title="Редактирование" onBack={()=> dirty ? setAsk(true) : go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'20px 16px'}} className="scroll">
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:24}}>
          <Avatar name={f.name||'?'} size={88}/>
          <button style={{background:'none', border:'none', color:C.accent, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit'}}>Изменить фото</button>
        </div>
        {field('name', 'Имя', 'Введите имя')}
        <div style={{marginBottom:18}}>
          <div style={vLbl}>Телефон</div>
          <div style={{...vField, color:C.sub}}><span style={{flex:1, fontSize:15}}>{profile.phone || '+7 (999) 123-45-67'}</span><span style={{...vMono, fontSize:10, color:C.green}}>✓ Подтверждён</span></div>
        </div>
        {isSeller && field('shop', 'Название магазина', 'Например, Archive Room')}
        {isSeller && field('about', 'О магазине', 'Расскажите, что вы продаёте и где удобно встретиться', true)}
      </div>
      <div style={{flexShrink:0, padding:'10px 16px 18px', borderTop:`1px solid ${C.line}`}}>
        <button disabled={!dirty} onClick={save} style={{...vPrimary, width:'100%', opacity: dirty?1:.35}}>Сохранить</button>
      </div>
      {ask && <VDialog title="Сохранить изменения?" cancel="Не сохранять" ok="Сохранить" onCancel={()=>go({back:true})} onOk={save}/>}
    </>
  );
}

// ---------------- 14. NOTIFICATIONS ----------------
function V3Switch({ on, onClick }) {
  return <button onClick={onClick} style={{width:48, height:28, background: on?C.accent:'#333', border:'none', position:'relative', cursor:'pointer', flexShrink:0, transition:'background .2s'}}><span style={{position:'absolute', top:3, left: on?23:3, width:22, height:22, background: on?'#000':'#888', transition:'left .2s'}}/></button>;
}
function V3Notif({ go }) {
  const [p, setP] = React.useState({ messages:true, promo:false });
  const rows = [['messages','Новые сообщения','Когда собеседник пишет вам в чат'], ['promo','Новости и акции','Подборки и новости ARVELL']];
  return (
    <>
      <VHeader title="Уведомления" onBack={()=>go({back:true})}/>
      <div style={{padding:'16px'}}>
        <div style={{border:`1px solid ${C.line}`}}>
          {rows.map(([k,l,s],i) => (
            <div key={k} style={{display:'flex', alignItems:'center', gap:12, padding:'14px', borderBottom: i<rows.length-1?`1px solid ${C.line}`:'none'}}>
              <div style={{flex:1}}><div style={{fontSize:15}}>{l}</div><div style={{fontSize:12.5, color:C.sub, marginTop:3}}>{s}</div></div>
              <V3Switch on={p[k]} onClick={()=>setP({...p, [k]:!p[k]})}/>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------- 15. HELP + DOCS ----------------
const FAQ = [
  ['Товары на ARVELL проверены на подлинность?', 'Да. Каждый товар проходит проверку подлинности командой ARVELL до публикации. На карточке товара это отмечено плашкой «Проверено ARVELL».'],
  ['Когда и как оплачивать товар?', 'Только при личной встрече с продавцом, после того как вы осмотрели вещь. В приложении оплаты нет, и мы не берём комиссию.'],
  ['Кто организует доставку?', 'ARVELL не занимается доставкой. Способ передачи вы обсуждаете с продавцом в чате. Безопаснее всего встретиться лично.'],
  ['Как стать продавцом на ARVELL?', 'Продавцы регистрируются только по коду приглашения, который выдаёт команда ARVELL. Введите код при регистрации, выбрав «Я продавец».'],
  ['Что делать, если товар не соответствует описанию?', 'Не оплачивайте товар и откажитесь от сделки на встрече. Сообщите нам о продавце через раздел «Правила» → «Нарушения».'],
  ['У меня просят код из SMS или предоплату. Что делать?', 'Это мошенники. Никому не сообщайте код из SMS и не переводите предоплату. ARVELL никогда не просит коды и оплату в чате.'],
];
function V3Help({ go }) {
  const [open, setOpen] = React.useState(0);
  return (
    <>
      <VHeader title="Помощь" onBack={()=>go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'16px'}} className="scroll">
        <div style={vLbl}>Частые вопросы</div>
        <div style={{border:`1px solid ${C.line}`}}>
          {FAQ.map(([q,a],i) => (
            <div key={i} style={{borderBottom: i<FAQ.length-1?`1px solid ${C.line}`:'none'}}>
              <button onClick={()=>setOpen(open===i?null:i)} style={{width:'100%', display:'flex', alignItems:'center', gap:10, padding:'14px', background:'none', border:'none', color:C.text, cursor:'pointer', textAlign:'left', fontSize:14.5, fontWeight:600, fontFamily:'inherit', lineHeight:1.35}}>
                <span style={{flex:1}}>{q}</span>
                <Ic.chevDown width="18" height="18" style={{color: open===i?C.accent:C.sub, transform: open===i?'rotate(180deg)':'none', transition:'transform .2s', flexShrink:0}}/>
              </button>
              {open===i && <div style={{padding:'0 14px 14px', fontSize:13.5, color:C.sub2, lineHeight:1.55}}>{a}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
const DOCS = {
  rules: { title:'Правила', sections:[
    ['Как работает ARVELL', 'Покупатель находит товар, пишет продавцу в чат и договаривается о встрече. Оплата и передача товара происходят при встрече.'],
    ['Подлинность товаров', 'Каждый товар проверяется командой ARVELL до публикации. Запрещено размещать реплики и подделки.'],
    ['Продавцы', 'Продавцы попадают на площадку только по приглашению команды ARVELL и отвечают за точность описания.'],
    ['Встреча и доставка', 'ARVELL не организует доставку. Встречайтесь в людных местах и осматривайте вещь до оплаты.'],
    ['Безопасность', 'Никому не сообщайте код из SMS и не вносите предоплату. ARVELL не просит оплату в чате.'],
    ['Отказ от сделки', 'Покупатель вправе отказаться от покупки на встрече, если товар не соответствует описанию.'],
    ['Ответственность', 'ARVELL не является стороной сделки и не принимает платежи. Сделка заключается между покупателем и продавцом.'],
    ['Нарушения', 'За нарушение правил аккаунт может быть заблокирован, а объявления — сняты с публикации.'],
  ]},
  terms: { title:'Условия использования', sections:[
    ['Общие положения', 'Используя ARVELL, вы соглашаетесь с настоящими условиями.'],
    ['Аккаунт', 'Для входа нужен номер телефона. Вы отвечаете за сохранность доступа к нему.'],
    ['Контент', 'Публикуя фото и описания, вы подтверждаете, что имеете на них права.'],
    ['Ограничения', 'Запрещены подделки, мошенничество и оскорбления других пользователей.'],
  ]},
  privacy: { title:'Политика конфиденциальности', sections:[
    ['Какие данные мы храним', 'Номер телефона, имя, фото профиля, объявления и переписку в чатах.'],
    ['Зачем', 'Чтобы обеспечить вход, работу чатов и безопасность сделок.'],
    ['Удаление', 'Вы можете удалить аккаунт в профиле. Данные удаляются без возможности восстановления.'],
  ]},
};
function V3Doc({ go, doc }) {
  const d = DOCS[doc] || DOCS.rules;
  return (
    <>
      <VHeader title={d.title} onBack={()=>go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'18px 16px 24px'}} className="scroll">
        {d.sections.map(([h,b],i) => (
          <div key={i} style={{marginBottom:20}}>
            <div style={{...vMono, fontSize:11.5, color:C.accent, fontWeight:600, marginBottom:6}}>{i+1}. {h}</div>
            <div style={{fontSize:14, color:C.sub2, lineHeight:1.6}}>{b}</div>
          </div>
        ))}
        <div style={{fontSize:12, color:C.sub, marginTop:8}}>Последнее обновление: октябрь 2026</div>
      </div>
    </>
  );
}

// ---------------- 12. MY LISTINGS ----------------
function V3MyListings({ go, listing, setListing }) {
  const [menu, setMenu] = React.useState(null);
  const [del, setDel] = React.useState(null);
  const [gone, setGone] = React.useState({});
  const items = PRODUCTS.slice(0,6).filter(p => !gone[p.id]);
  return (
    <>
      <VHeader title="Мои объявления" onBack={()=>go({back:true})} right={<button onClick={()=>go({s:'addProduct'})} style={{width:36, height:36, border:'none', background:C.accent, color:'#000', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.plus width="20" height="20"/></button>}/>
      <div style={{flex:1, overflowY:'auto', paddingTop:2}} className="scroll" onClick={()=>setMenu(null)}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px 2px', paddingBottom:20}}>
          {items.map(p => {
            const off = listing[p.id]==='off';
            return (
              <div key={p.id} style={{position:'relative', opacity: off?.55:1}}>
                <MiniCard p={p} hideFav onOpen={()=>go({s:'product', id:p.id})} topRight={
                  <button onClick={e=>{ e.stopPropagation(); setMenu(menu===p.id?null:p.id); }} style={{position:'absolute', top:8, right:8, width:32, height:32, borderRadius:16, border:'none', background:'rgba(0,0,0,.6)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.more width="18" height="18"/></button>
                }/>
                {off && <div style={{position:'absolute', top:10, left:10, background:C.cardHi, color:C.sub2, padding:'3px 7px', ...vMono, fontSize:9.5}}>Снято</div>}
                {menu===p.id && (
                  <div onClick={e=>e.stopPropagation()} style={{position:'absolute', top:44, right:8, zIndex:5, background:C.cardHi, border:`1px solid ${C.line}`, minWidth:170}}>
                    <button onClick={()=>{ setListing(p.id, off?'active':'off'); setMenu(null); }} style={{...menuRow}}>{off?'Вернуть в продажу':'Снять с продажи'}</button>
                    <button onClick={()=>{ setDel(p.id); setMenu(null); }} style={{...menuRow, color:C.red, borderBottom:'none'}}>Удалить</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {del && <VDialog title="Удалить объявление?" text="Это действие нельзя отменить." ok="Удалить" danger onCancel={()=>setDel(null)} onOk={()=>{ setGone({...gone, [del]:true}); setDel(null); }}/>}
    </>
  );
}
const menuRow = { width:'100%', display:'block', padding:'12px 14px', background:'none', border:'none', borderBottom:`1px solid ${C.line}`, color:C.text, fontSize:14, cursor:'pointer', textAlign:'left', fontFamily:'inherit' };

// ---------------- 16. ADD / EDIT PRODUCT ----------------
const CATS_V3 = [
  { id:'shoes', label:'Кроссовки и обувь', kind:'shoe', sys:['EU','US','UK'], model:'Например, Air Max 90' },
  { id:'jackets', label:'Куртки', kind:'jacket', sys:['INT','RU'], model:'Например, Nuptse 700' },
  { id:'hoodies', label:'Худи и свитшоты', kind:'hoodie', sys:['INT','RU'], model:'Например, Hooded Chase' },
  { id:'tees', label:'Футболки', kind:'tee', sys:['INT','RU'], model:'Например, Pocket Tee' },
  { id:'shirts', label:'Рубашки', kind:'shirt', sys:['INT','RU'], model:'Например, Oxford Shirt' },
  { id:'pants', label:'Брюки и джинсы', kind:'pants', sys:['INT','RU'], model:'Например, Double Knee' },
  { id:'acc', label:'Аксессуары', kind:'accessory', sys:['One size'], model:'Например, Кепка 8-Ball' },
];
const SIZE_VALUES = { EU:['38','39','40','41','42','43','44','45'], US:['6','7','8','9','10','11','12'], UK:['5','6','7','8','9','10','11'], INT:['XS','S','M','L','XL','XXL'], RU:['42','44','46','48','50','52','54'], 'One size':['One size'] };
const BRANDS_V3 = ['Nike','Adidas','Stone Island','Carhartt WIP','The North Face','Supreme','Stüssy','Champion','Arc\u2019teryx','Patagonia','New Balance','C.P. Company'];
const COLORS_V3 = [['Чёрный','#111'],['Белый','#f2f2f2'],['Серый','#8a8a8a'],['Бежевый','#d8c3a0'],['Коричневый','#7a5232'],['Синий','#2b4fa8'],['Зелёный','#3f7a4a'],['Красный','#c23a2e'],['Жёлтый','#f0c419'],['Разноцветный','conic-gradient(#c23a2e,#f0c419,#3f7a4a,#2b4fa8,#c23a2e)']];
const CONDS_V3 = ['Новое','Как новое','Хорошее','Среднее'];
function V3AddProduct({ go, editId, onPublished }) {
  const ep = editId && byId(editId);
  const initCat = ep ? CATS_V3.find(c=>c.kind===ep.kind) : null;
  const [photos, setPhotos] = React.useState(() => ep ? [ep.kind, ep.kind, ep.kind] : []);
  const [cat, setCat] = React.useState(initCat ? initCat.id : null);
  const [brand, setBrand] = React.useState(ep ? ep.brand : '');
  const [model, setModel] = React.useState(ep ? ep.model : '');
  const [sys, setSys] = React.useState(initCat ? initCat.sys[0] : null);
  const [size, setSize] = React.useState(ep ? (initCat && initCat.sys[0]==='EU' ? ep.size.replace('EUR ','') : (SIZE_VALUES.INT.includes(ep.size)?ep.size:'M')) : null);
  const [color, setColor] = React.useState(ep ? 'Чёрный' : null);
  const [price, setPrice] = React.useState(ep ? String(ep.price) : '');
  const [cond, setCond] = React.useState(ep ? condOf(ep) : null);
  const [desc, setDesc] = React.useState(ep ? ep.desc : '');
  const [sheet, setSheet] = React.useState(null); // 'photo' | 'cat' | 'brand'
  const [bq, setBq] = React.useState('');
  const [leave, setLeave] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const c = CATS_V3.find(x=>x.id===cat);
  const valid = photos.length>0 && cat && brand && model.trim() && sys && size && color && Number(price)>0 && cond;
  const dirty = !ep && (photos.length || cat || brand || model || price || cond || desc);
  const pickCat = (id) => { const nc = CATS_V3.find(x=>x.id===id); setCat(id); setSys(nc.sys[0]); setSize(nc.sys[0]==='One size'?'One size':null); setSheet(null); };
  const fmtPrice = (v) => v.replace(/\D/g,'').slice(0,7);
  const L = ({children, req}) => <div style={{...vLbl, marginTop:22}}>{children}{req && <span style={{color:C.accent}}> *</span>}</div>;
  return (
    <>
      <VHeader title={ep ? 'Редактирование' : 'Новый товар'} onBack={()=> dirty ? setLeave(true) : go({back:true})}/>
      <div style={{flex:1, overflowY:'auto', padding:'0 16px 24px'}} className="scroll">
        <L req>Фотографии · {photos.length}/10</L>
        <div className="scroll" style={{display:'flex', gap:8, overflowX:'auto', margin:'0 -16px', padding:'0 16px'}}>
          {Array.from({length:10}).map((_,i) => {
            const ph = photos[i];
            return (
              <button key={i} onClick={()=> ph ? setPhotos(photos.filter((_,j)=>j!==i)) : (i===photos.length && setSheet('photo'))} style={{width:88, height:88, flexShrink:0, position:'relative', padding:0, background:C.card, border: ph?`1px solid ${C.line}`:`1.5px dashed ${i===photos.length?'#555':'#2e2e2e'}`, cursor: ph||i===photos.length?'pointer':'default', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
                {ph ? <><ProductImg kind={ph} h={88} radius={0}/>{i===0 && <span style={{position:'absolute', bottom:4, left:4, background:C.accent, color:'#000', padding:'2px 5px', ...vMono, fontSize:8.5, fontWeight:600}}>Главное</span>}<span style={{position:'absolute', top:4, right:4, width:18, height:18, borderRadius:9, background:'rgba(0,0,0,.7)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.close width="11" height="11"/></span></>
                  : <Ic.camera width="24" height="24" style={{color: i===photos.length?C.accent:'#3a3a3a'}}/>}
              </button>
            );
          })}
        </div>

        <L req>Категория</L>
        <button onClick={()=>setSheet('cat')} style={{...vField, cursor:'pointer', color: c?C.text:C.sub, fontSize:15, fontFamily:'inherit'}}><span style={{flex:1, textAlign:'left'}}>{c ? c.label : 'Выберите категорию'}</span><Ic.chevDown width="18" height="18" style={{color:C.sub}}/></button>

        <L req>Бренд</L>
        <button onClick={()=>{ setBq(''); setSheet('brand'); }} style={{...vField, cursor:'pointer', color: brand?C.text:C.sub, fontSize:15, fontFamily:'inherit'}}><span style={{flex:1, textAlign:'left'}}>{brand || 'Выберите бренд'}</span><Ic.chevDown width="18" height="18" style={{color:C.sub}}/></button>

        <L req>Модель</L>
        <div style={vField}><input value={model} onChange={e=>setModel(e.target.value)} placeholder={c ? c.model : 'Название модели'} style={vInput}/></div>

        <L req>Размер</L>
        {!c ? <div style={{fontSize:13, color:C.sub}}>Сначала выберите категорию</div> : (
          <>
            {c.sys.length>1 && <div style={{display:'flex', gap:6, marginBottom:10}}>{c.sys.map(s => <button key={s} onClick={()=>{ setSys(s); setSize(null); }} style={{...vBtn, height:32, fontSize:11, flex:'0 0 auto', background: sys===s?C.text:'transparent', color: sys===s?'#000':C.sub2, borderColor: sys===s?C.text:'#3a3a3a'}}>{s}</button>)}</div>}
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>{(SIZE_VALUES[sys]||[]).map(v => <button key={v} onClick={()=>setSize(v)} style={{minWidth:48, height:38, padding:'0 10px', background: size===v?C.accent:C.card, color: size===v?'#000':C.text, border:`1px solid ${size===v?C.accent:C.line}`, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit'}}>{v}</button>)}</div>
          </>
        )}

        <L req>Цвет{color && <span style={{color:C.text, textTransform:'none', letterSpacing:0, fontFamily:'Archivo'}}> · {color}</span>}</L>
        <div style={{display:'flex', flexWrap:'wrap', gap:10}}>
          {COLORS_V3.map(([n,v]) => <button key={n} title={n} onClick={()=>setColor(n)} style={{width:34, height:34, borderRadius:17, padding:0, background:'none', border:`2px solid ${color===n?C.accent:'transparent'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><span style={{width:26, height:26, borderRadius:13, background:v, border:'1px solid rgba(255,255,255,.15)'}}/></button>)}
        </div>

        <L req>Цена</L>
        <div style={vField}><input value={price ? Number(price).toLocaleString('ru-RU') : ''} inputMode="numeric" onChange={e=>setPrice(fmtPrice(e.target.value))} placeholder="0" style={{...vInput, fontWeight:700}}/><span style={{color:C.sub, fontSize:15}}>₽</span></div>

        <L req>Состояние</L>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>{CONDS_V3.map(x => <button key={x} onClick={()=>setCond(x)} style={{height:42, background: cond===x?C.accent:C.card, color: cond===x?'#000':C.text, border:`1px solid ${cond===x?C.accent:C.line}`, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit'}}>{x}</button>)}</div>

        <L>Описание</L>
        <div style={{...vField, alignItems:'flex-start', padding:'12px 14px'}}><textarea value={desc} onChange={e=>setDesc(e.target.value.slice(0,1000))} rows={4} placeholder="Состояние, комплект, где покупали, особенности посадки" style={{...vInput, resize:'none', lineHeight:1.45}}/></div>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:C.sub, marginTop:6}}><span>Покажется в карточке товара</span><span>{desc.length} / 1000</span></div>
      </div>
      <div style={{flexShrink:0, padding:'10px 16px 18px', borderTop:`1px solid ${C.line}`}}>
        <button disabled={!valid} onClick={()=>setDone(true)} style={{...vPrimary, width:'100%', opacity: valid?1:.35, cursor: valid?'pointer':'default'}}>{ep ? 'Сохранить' : 'Опубликовать'}</button>
      </div>

      {sheet==='photo' && <VSheet onClose={()=>setSheet(null)}>{['Камера','Галерея'].map(l => <button key={l} onClick={()=>{ setPhotos([...photos, c ? c.kind : 'other'].slice(0,10)); setSheet(null); }} style={{...menuRow, padding:'15px 4px', fontSize:15.5, display:'flex', alignItems:'center', gap:12}}>{l==='Камера'?<Ic.camera width="20" height="20" style={{color:C.accent}}/>:<Ic.grid width="20" height="20" style={{color:C.accent}}/>}{l}</button>)}</VSheet>}
      {sheet==='cat' && <VSheet onClose={()=>setSheet(null)}><div style={{...vLbl}}>Категория</div>{CATS_V3.map(x => <button key={x.id} onClick={()=>pickCat(x.id)} style={{...menuRow, padding:'14px 4px', fontSize:15, display:'flex', justifyContent:'space-between', color: cat===x.id?C.accent:C.text}}>{x.label}{cat===x.id && <Ic.check width="18" height="18"/>}</button>)}</VSheet>}
      {sheet==='brand' && <VSheet onClose={()=>setSheet(null)}>
        <div style={{...vField, marginBottom:8}}><Ic.search width="17" height="17" style={{color:C.sub}}/><input autoFocus value={bq} onChange={e=>setBq(e.target.value)} placeholder="Поиск бренда" style={vInput}/></div>
        {BRANDS_V3.filter(b=>b.toLowerCase().includes(bq.toLowerCase())).map(b => <button key={b} onClick={()=>{ setBrand(b); setSheet(null); }} style={{...menuRow, padding:'13px 4px', fontSize:15, color: brand===b?C.accent:C.text}}>{b}</button>)}
        {bq.trim() && !BRANDS_V3.some(b=>b.toLowerCase()===bq.trim().toLowerCase()) && <button onClick={()=>{ setBrand(bq.trim()); setSheet(null); }} style={{...menuRow, padding:'13px 4px', fontSize:15, color:C.accent, borderBottom:'none'}}>Добавить «{bq.trim()}»</button>}
      </VSheet>}
      {leave && <VDialog title="Не публиковать товар?" text="Заполненные данные не сохранятся." cancel="Остаться" ok="Выйти" danger onCancel={()=>setLeave(false)} onOk={()=>go({back:true})}/>}
      {done && <VSuccess title={ep ? 'Изменения сохранены' : 'Товар опубликован'} text={ep ? null : 'После проверки подлинности он появится в ленте ARVELL'} cta="Готово" onDone={()=>go({back:true})}/>}
    </>
  );
}

Object.assign(window, { V3Profile, V3EditProfile, V3Notif, V3Help, V3Doc, V3MyListings, V3AddProduct });
