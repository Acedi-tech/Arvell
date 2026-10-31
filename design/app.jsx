// ===== ARVELL v3 — App shell, navigation, state =====
const { useState } = React;

const initialChats = () => ([
  { id:'c1', name:'Алексей Иванов', productId:'p1', unread:1, time:'12:30', hasPhone:true,
    preview:'Привет! Товар в отличном состоянии, оригинал.',
    messages:[ {from:'me', text:'Здравствуйте! Можно фото бирки?', time:'12:20'}, {from:'them', text:'Привет! Товар в отличном состоянии, оригинал.', time:'12:24'} ] },
  { id:'c2', name:'Мария С.', productId:'p2', unread:2, time:'11:05', buy:true,
    preview:'Договорились, давайте завтра в 19:00 у метро',
    messages:[
      {from:'me', text:'Здравствуйте! Хочу купить худи. Можно фото бирки?', time:'10:48'},
      {from:'them', img:'hoodie', text:'Вот бирка, всё оригинал', time:'10:52'},
      {from:'me', text:'Отлично, беру! Где удобно встретиться?', time:'11:02'},
      {from:'them', text:'Договорились, давайте завтра в 19:00 у метро', time:'11:05'},
    ] },
  { id:'c3', name:'Дмитрий К.', productId:'p3', unread:0, time:'Вчера',
    preview:'Да, носил пару раз. Могу скинуть ещё фото',
    messages:[ {from:'me', text:'Привет! Состояние реально как новое?', time:'Вчера'}, {from:'them', text:'Да, носил пару раз. Могу скинуть ещё фото', time:'Вчера'} ] },
  { id:'c4', name:'Сергей П.', productId:'p4', unread:0, time:'20.10', buy:true, confirmed:true,
    preview:'Спасибо за покупку!',
    messages:[
      {from:'me', text:'Здравствуйте! Куртка ещё в наличии?', time:'20.10'},
      {from:'them', text:'Да! Могу встретиться сегодня в центре.', time:'20.10'},
      {from:'them', text:'Спасибо за покупку!', time:'20.10'},
    ] },
  { id:'c5', name:'Удалённый пользователь', productId:'p5', unread:0, time:'02.10', closed:true,
    preview:'', messages:[ {from:'me', text:'Добрый день, размер точно 43?', time:'02.10'}, {from:'them', text:'Да, 43.', time:'02.10'} ] },
]);
const ls = { get:(k,d)=>{ try { const v = localStorage.getItem(k); return v===null?d:JSON.parse(v); } catch(e){ return d; } }, set:(k,v)=>{ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };

function App() {
  const [booting, setBooting] = useState(true);
  React.useEffect(() => { const t = setTimeout(()=>setBooting(false), 1900); return ()=>clearTimeout(t); }, []);
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const [favs, setFavs] = useState({ p2:true, p4:true });
  const [chats, setChats] = useState(initialChats);
  const [isSeller, setSeller] = useState(() => ls.get('arvell_v3_seller', false));
  const [isAdmin, setAdminRaw] = useState(() => ls.get('arvell_v3_admin', false));
  const setAdmin = (v) => { setAdminRaw(v); ls.set('arvell_v3_admin', v); };
  const [authed, setAuthed] = useState(() => ls.get('arvell_v3_session', false));
  const [profile, setProfileRaw] = useState(() => ls.get('arvell_v3_profile', { name:'Александр Петров', phone:'+7 (999) 123-45-67', shop:'', about:'' }));
  const setProfile = (u) => setProfileRaw(p => { const n = typeof u==='function'?u(p):u; ls.set('arvell_v3_profile', n); return n; });
  const [reviews, setReviews] = useState(initialReviews);
  const [deals, setDeals] = useState([ { id:'d1', productId:'p4', date:'20.10' }, { id:'d2', productId:'p1', date:'12.10', reviewed:true } ]);
  const [sales, setSales] = useState([ { id:'s1', productId:'p2', date:'14.10' }, { id:'s2', productId:'p5', date:'11.09' } ]);
  const [listing, setListingMap] = useState({});
  const setListing = (id, v) => setListingMap(m => ({...m, [id]:v}));
  const [adminOpen, setAdminOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [authReason, setAuthReason] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const top = stack[stack.length-1];
  function requireAuth(action, reason) {
    if (authed) { action(); return; }
    setAuthReason(reason || ''); setPendingAction(() => action); setAuthPrompt(true);
  }
  const toggleFav = (id) => requireAuth(() => setFavs(f => ({...f, [id]: !f[id]})), 'Войдите, чтобы сохранять в избранное');

  const go = (a) => {
    if (a.back) { setStack(s => s.slice(0,-1)); return; }
    if (a.tab) {
      const gated = { chats:'Войдите, чтобы видеть чаты', favorites:'Войдите, чтобы сохранять в избранное', profile:'Войдите в свой профиль' };
      if (gated[a.tab] && !authed) { requireAuth(() => { setTab(a.tab); setStack([]); }, gated[a.tab]); return; }
      setTab(a.tab); setStack([]); return;
    }
    if (a.s==='admin') { setAdminOpen(true); return; }
    if (a.s) setStack(s => [...s, a]);
  };

  const reviewStatus = (pid) => {
    const d = deals.find(x => x.productId===pid);
    if (!d) return 'none';
    return d.reviewed ? 'done' : 'can';
  };
  const submitReview = (pid, rating, text) => {
    setReviews(r => ({...r, [pid]: [{ id:'r'+Date.now(), name: profile.name, rating, text, date:'сегодня' }, ...(r[pid]||[])]}));
    setDeals(ds => ds.map(d => d.productId===pid ? {...d, reviewed:true} : d));
  };

  const sendMessage = (chatId, payload) => {
    const msg = typeof payload === 'string' ? { from:'me', text: payload, time:'сейчас' } : { from:'me', time:'сейчас', ...payload };
    const preview = msg.text || 'Фото';
    setChats(cs => cs.map(c => c.id===chatId ? { ...c, unread:0, preview, time:'сейчас', messages:[...c.messages, msg] } : c));
    setTimeout(() => {
      setChats(cs => cs.map(c => {
        if (c.id!==chatId) return c;
        const reply = 'Хорошо, давайте договоримся о встрече.';
        return { ...c, preview:reply, messages:[...c.messages, {from:'them', text:reply, time:'сейчас'}] };
      }));
    }, 1100);
  };

  const startBuy = (productId, isBuy) => requireAuth(() => {
    const p = byId(productId);
    let ex = chats.find(c => c.productId===productId && !c.closed);
    if (!ex) {
      ex = { id:'chat_'+productId, name: p.seller.name, productId, unread:0, time:'сейчас', preview:'', buy:!!isBuy, messages:[] };
      setChats(cs => [ex, ...cs]);
    } else if (isBuy && !ex.buy) {
      setChats(cs => cs.map(c => c.id===ex.id ? {...c, buy:true} : c));
    }
    setStack(s => [...s, { s:'chat', id: ex.id }]);
  }, 'Войдите, чтобы связаться с продавцом');

  const confirmSale = (chatId) => {
    const c = chats.find(x=>x.id===chatId);
    setChats(cs => cs.map(x => x.id===chatId ? {...x, confirmed:true} : x));
    setSales(s => [{ id:'s'+Date.now(), productId:c.productId, date:'сегодня' }, ...s]);
  };
  const markChatsRead = (ids) => setChats(cs => cs.map(c => ids.includes(c.id) ? { ...c, unread:0 } : c));

  const signOut = () => { ls.set('arvell_v3_session', false); setStack([]); setTab('home'); setAuthed(false); };
  const deleteAccount = () => { try { localStorage.setItem('arvell_registered','0'); } catch(e){} setProfile({ name:'', phone:'', shop:'', about:'' }); setFavs({}); signOut(); };

  const myProducts = PRODUCTS.slice(0,6);
  const myReviews = myProducts.flatMap(p => (reviews[p.id]||[]).map(r=>({...r, product:`${p.brand} ${p.model}`})));

  let screen;
  if (top) {
    const s = top.s;
    if (s==='product') screen = <V3Product id={top.id} go={go} favs={favs} toggleFav={toggleFav} startBuy={startBuy} isSeller={isSeller} reviews={reviews} canReview={authed ? reviewStatus(top.id) : 'none'} listing={listing} setListing={setListing}/>;
    else if (s==='chat') screen = <V3Chat id={top.id} go={go} chats={chats} sendMessage={sendMessage} isSeller={isSeller} reviews={reviews} onConfirmSale={confirmSale}/>;
    else if (s==='sellerProfile') screen = <V3SellerProfile id={top.id} go={go} reviews={reviews}/>;
    else if (s==='reviews') screen = top.seller==='__me'
      ? <V3Reviews go={go} reviews={reviews} override={myReviews} overrideSub={profile.shop || profile.name}/>
      : <V3Reviews go={go} reviews={reviews} productId={top.productId} seller={top.seller}/>;
    else if (s==='reviewForm') screen = <V3ReviewForm productId={top.productId} go={go} status={reviewStatus(top.productId)} onSubmit={submitReview}/>;
    else if (s==='deals') screen = <V3Deals go={go} deals={isSeller?sales:deals} isSeller={isSeller} reviewStatus={reviewStatus}/>;
    else if (s==='addProduct') screen = <V3AddProduct go={go} editId={top.editId}/>;
    else if (s==='editProfile') screen = <V3EditProfile go={go} profile={profile} setProfile={setProfile} isSeller={isSeller}/>;
    else if (s==='notifSettings') screen = <V3Notif go={go}/>;
    else if (s==='help') screen = <V3Help go={go}/>;
    else if (s==='doc') screen = <V3Doc go={go} doc={top.doc}/>;
    else if (s==='myListings') screen = <V3MyListings go={go} listing={listing} setListing={setListing}/>;
    else screen = <StubScreen go={go} kind={s}/>;
  } else {
    if (tab==='home') screen = <HomeScreen go={go} favs={favs} toggleFav={toggleFav}/>;
    else if (tab==='catalog') screen = <CatalogScreen go={go} favs={favs} toggleFav={toggleFav}/>;
    else if (tab==='favorites') screen = authed ? <FavoritesScreen go={go} favs={favs} toggleFav={toggleFav}/> : <GuestScreen onLogin={()=>requireAuth(()=>{}, 'Войдите, чтобы сохранять в избранное')}/>;
    else if (tab==='chats') screen = authed ? <V3ChatList go={go} chats={chats} onMarkRead={markChatsRead}/> : <GuestScreen onLogin={()=>requireAuth(()=>{}, 'Войдите, чтобы видеть чаты')}/>;
    else if (tab==='profile') screen = authed
      ? <V3Profile go={go} isSeller={isSeller} profile={profile} favCount={Object.values(favs).filter(Boolean).length} deals={deals} sales={sales} reviews={reviews} onLogout={signOut} onDeleteAccount={deleteAccount} isAdmin={isAdmin} setAdmin={setAdmin}/>
      : <GuestScreen onLogin={()=>requireAuth(()=>{}, 'Войдите в свой профиль')}/>;
  }

  const unread = authed ? chats.reduce((n,c)=>n+(c.unread||0),0) : 0;
  const hideTab = !!top;

  if (adminOpen) return <AdminApp onExit={()=>setAdminOpen(false)}/>;
  if (booting) return (<div className="phone"><div className="screen" style={{background:C.bg, position:'relative'}}><StatusBar/><BootSplash/></div></div>);

  return (
    <div className="phone">
      <div className="screen" style={{background:C.bg, color:C.text, display:'flex', flexDirection:'column', height:'100%', position:'relative'}}>
        <StatusBar/>
        <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}} key={(top?top.s+(top.id||top.productId||top.doc||''):tab)}>{screen}</div>
        {!hideTab && <TabBar active={tab} onNav={(t)=>go({tab:t})} unread={unread}/>}
        {authPrompt && (
          <AuthSheet reason={authReason}
            onCancel={()=>{ setAuthPrompt(false); setPendingAction(null); }}
            onDone={(p)=>{
              setSeller(!!p.seller); ls.set('arvell_v3_seller', !!p.seller);
              setProfile(pr => ({ ...pr, name: p.name || pr.name || 'Александр Петров', phone: p.phone || pr.phone, shop: p.seller ? (p.shop || pr.shop) : pr.shop }));
              ls.set('arvell_v3_session', true); setAuthed(true); setAuthPrompt(false);
              if (pendingAction) { const fn = pendingAction; setPendingAction(null); setTimeout(fn, 50); }
            }}/>
        )}
      </div>
    </div>
  );
}

function BootSplash() {
  return (
    <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
      <svg width="120" height="120" viewBox="0 0 120 122" fill="none">
        <path d="M16 112 L60 12" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeDasharray="140" strokeDashoffset="140" style={{animation:'drawLeg .5s ease .1s forwards'}}/>
        <path d="M60 12 L104 112" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeDasharray="140" strokeDashoffset="140" style={{animation:'drawLeg .5s ease .3s forwards'}}/>
        <path d="M33 80 L51 98 L86 56" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="90" strokeDashoffset="90" style={{animation:'drawLeg .45s ease .75s forwards'}}/>
      </svg>
      <div style={{marginTop:40, color:'#fff', fontSize:16, fontWeight:600, letterSpacing:3, opacity:0, animation:'fadeUp .5s ease 1.2s forwards'}}>ARVELL</div>
      <div style={{position:'absolute', bottom:40, left:0, right:0, textAlign:'center', color:C.sub, fontSize:11, letterSpacing:.4, opacity:0, animation:'fadeUp .5s ease 1.4s forwards'}}>одежда с гарантией подлинности</div>
    </div>
  );
}

function GuestScreen({ onLogin }) {
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'30px 30px 60px', textAlign:'center', gap:14}}>
      <div style={{width:72, height:72, borderRadius:36, background:C.card, display:'flex', alignItems:'center', justifyContent:'center', color:C.accent}}><Ic.user width="32" height="32"/></div>
      <div style={{fontSize:18, fontWeight:800}}>Вы не вошли</div>
      <div style={{fontSize:14, color:C.sub, maxWidth:260, lineHeight:1.5}}>Войдите, чтобы писать продавцам и сохранять избранное</div>
      <button onClick={onLogin} style={{...vPrimary, width:'100%', maxWidth:260, marginTop:6}}>Войти</button>
    </div>
  );
}

function StubScreen({ go, kind }) {
  return (
    <>
      <VHeader title="Уведомления" onBack={()=>go({back:true})}/>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:30, textAlign:'center', color:C.sub, fontSize:14.5, lineHeight:1.5}}>Здесь появятся уведомления о новых сообщениях</div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
