// ===== ARVELL — Chats list, Chat, Chat-after-Buy =====

// ---------------- SCREEN 4: CHAT LIST ----------------
function ChatListScreen({ go, chats, onDeleteChats, onMarkRead }) {
  const [selecting, setSelecting] = React.useState(false);
  const [selected, setSelected] = React.useState({});

  const toggleSelecting = () => {
    setSelecting(s => !s);
    setSelected({});
  };
  const toggleOne = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const selCount = Object.values(selected).filter(Boolean).length;

  const deleteSelected = () => {
    const ids = Object.keys(selected).filter(id=>selected[id]);
    if (ids.length===0) return;
    if (!window.confirm(`Удалить ${ids.length} чат${ids.length===1?'':'ов'}?`)) return;
    onDeleteChats(ids);
    setSelecting(false);
    setSelected({});
  };

  const markSelectedRead = () => {
    const ids = Object.keys(selected).filter(id=>selected[id]);
    if (ids.length===0) return;
    onMarkRead(ids);
    setSelecting(false);
    setSelected({});
  };

  return (
    <>
      <Header title="Чаты" right={
        <button onClick={toggleSelecting} style={{background:'none', border:'none', color:C.accent, fontSize:15, fontWeight:600, cursor:'pointer'}}>
          {selecting ? 'Готово' : 'Выбрать'}
        </button>
      } />
      <div style={{padding:'0 16px 10px'}}>
        <div style={{height:44, borderRadius:0, background:C.card, border:`1px solid ${C.line}`, display:'flex', alignItems:'center', gap:10, padding:'0 14px'}}>
          <Ic.search width="18" height="18" style={{color:C.sub}}/>
          <span style={{color:C.sub, fontSize:14}}>Поиск по чатам</span>
        </div>
      </div>

      <div style={{flex:1, overflowY:'auto', padding:'4px 0 16px'}} className="scroll">
        {chats.map((c,i) => (
          <ChatRow key={c.id} c={c} last={i===chats.length-1} selecting={selecting} selected={!!selected[c.id]}
            onOpen={()=> selecting ? toggleOne(c.id) : go({s:'chat', id:c.id})}
            onDeal={()=>go({s:'checkout', id:c.productId, chatId:c.id})} />
        ))}
      </div>

      {selecting && (
        <div style={{flexShrink:0, padding:'12px 16px 22px', borderTop:`1px solid ${C.line}`, display:'flex', flexDirection:'column', gap:12}}>
          <span style={{fontSize:13.5, color:C.sub, textAlign:'center'}}>{selCount>0 ? `Выбрано: ${selCount}` : 'Выберите чаты'}</span>
          <div style={{display:'flex', gap:10}}>
            <button onClick={markSelectedRead} disabled={selCount===0} style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, background:C.card, color: selCount>0?'#fff':C.sub, border:`1px solid ${C.line}`, borderRadius:0, height:46, fontSize:14, fontWeight:600, cursor: selCount>0?'pointer':'default', opacity: selCount>0?1:.5}}>
              <Ic.check width="16" height="16"/> Прочитано
            </button>
            <button onClick={deleteSelected} disabled={selCount===0} style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: selCount>0?C.red:C.card, color:'#fff', border:'none', borderRadius:0, height:46, fontSize:14, fontWeight:700, cursor: selCount>0?'pointer':'default', opacity: selCount>0?1:.5}}>
              <Ic.trash width="17" height="17"/> Удалить
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ChatRow({ c, last, onOpen, onDeal, selecting, selected }) {
  return (
    <div onClick={onOpen} style={{display:'flex', alignItems:'center', gap:13, padding:'12px 16px', cursor:'pointer', position:'relative'}}>
      {selecting && (
        <span style={{width:22, height:22, borderRadius:0, border:`2px solid ${selected?C.accent:C.line}`, background: selected?C.accent:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
          {selected && <Ic.check width="13" height="13" style={{color:'#000'}}/>}
        </span>
      )}
      <div style={{position:'relative'}}>
        <Avatar name={c.name} size={54} />
        {c.dot && <span style={{position:'absolute', top:1, right:1, width:13, height:13, borderRadius:7, background:C.red, border:`2px solid ${C.bg}`}}/>}
      </div>
      <div style={{flex:1, minWidth:0, borderBottom: last?'none':`1px solid ${C.line}`, paddingBottom:12, marginTop:0, alignSelf:'stretch', display:'flex', flexDirection:'column', justifyContent:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{fontSize:16, fontWeight:700, whiteSpace:'nowrap'}}>{c.name}</span>
          <span style={{marginLeft:'auto', fontSize:12, color:C.sub, flexShrink:0}}>{c.time}</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4}}>
          <span style={{flex:1, fontSize:14, color:C.sub, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
            {c.preview}
          </span>
          {c.unread>0 && <span style={{minWidth:20, height:20, padding:'0 6px', borderRadius:0, background:C.accent, color:'#000', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center'}}>{c.unread}</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------- SCREENS 5 & 6: CHAT ----------------
function ChatScreen({ id, go, chats, sendMessage, startCheckout }) {
  const c = chats.find(x => x.id === id);
  const p = byId(c.productId);
  const [text, setText] = React.useState(c.prefill || '');
  const [recording, setRecording] = React.useState(false);
  const [recSecs, setRecSecs] = React.useState(0);
  const fileRef = React.useRef(null);
  const scrollRef = React.useRef(null);
  React.useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [c.messages.length]);

  // recording timer
  React.useEffect(()=>{
    if(!recording) return;
    const t = setInterval(()=>setRecSecs(s=>s+1), 1000);
    return ()=>clearInterval(t);
  }, [recording]);

  const send = () => { if(!text.trim()) return; sendMessage(c.id, text.trim()); setText(''); };

  const sendPhoto = (dataUrl) => sendMessage(c.id, dataUrl ? { photo: dataUrl } : { img: p.kind });
  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => sendPhoto(r.result);
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const startRec = () => { setRecSecs(0); setRecording(true); };
  const cancelRec = () => { setRecording(false); setRecSecs(0); };
  const sendRec = () => {
    if (recSecs < 1) { cancelRec(); return; }
    sendMessage(c.id, { voice: recSecs });
    setRecording(false); setRecSecs(0);
  };
  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <>
      {/* header */}
      <div style={{flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'2px 12px 10px', borderBottom:`1px solid ${C.line}`}}>
        <RoundBtn onClick={()=>go({back:true})} bg="transparent" size={34}><Ic.back width="22" height="22"/></RoundBtn>
        <div style={{position:'relative'}}>
          <Avatar name={c.name} size={40} />
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:7}}>
            <span style={{fontSize:16, fontWeight:700, whiteSpace:'nowrap'}}>{c.name}</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:5, marginTop:2}}>
            <Ic.star width="12" height="12" style={{color:C.accent}}/>
            <span style={{fontSize:12.5, color:C.sub}}>{c.rating}</span>
          </div>
        </div>
        <RoundBtn bg="transparent" size={34} color={C.sub}><Ic.phone width="20" height="20"/></RoundBtn>
        <RoundBtn bg="transparent" size={34} color={C.sub}><Ic.more width="20" height="20"/></RoundBtn>
      </div>

      {/* messages */}
      <div ref={scrollRef} style={{flex:1, overflowY:'auto', padding:'16px 16px 8px', display:'flex', flexDirection:'column', gap:10}} className="scroll">
        {c.buy && (
          <>
            <SysMsg>Вы нажали «Купить». Напишите продавцу, чтобы договориться о деталях. Оплата — при встрече с продавцом.</SysMsg>
            <ProductChatCard p={p} pending />
          </>
        )}
        {c.messages.map((m, i) => <Bubble key={i} m={m} />)}
        {c.buy && c.messages.length>=2 && (
          <div style={{display:'flex', justifyContent:'center', margin:'6px 0 2px'}}>
            <button onClick={()=>startCheckout(c.productId, c.id)} style={{background:C.accent, color:'#000', border:'none', borderRadius:0, padding:'12px 22px', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
              <Ic.shield width="18" height="18"/> Оформить сделку
            </button>
          </div>
        )}
      </div>

      {/* composer */}
      <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{display:'none'}}/>
      {recording ? (
        <div style={{flexShrink:0, padding:'8px 12px 22px', borderTop:`1px solid ${C.line}`, display:'flex', alignItems:'center', gap:12}}>
          <RoundBtn onClick={cancelRec} bg="transparent" size={42} color={C.red}><Ic.trash width="22" height="22"/></RoundBtn>
          <div style={{flex:1, display:'flex', alignItems:'center', gap:11, background:C.card, borderRadius:0, padding:'0 16px', height:46}}>
            <span style={{width:10, height:10, borderRadius:5, background:C.red, animation:'recpulse 1s infinite'}}/>
            <span style={{fontSize:15, fontWeight:600, color:'#fff', fontVariantNumeric:'tabular-nums'}}>{fmtTime(recSecs)}</span>
            <div style={{flex:1, display:'flex', alignItems:'center', gap:3, overflow:'hidden'}}>
              {Array.from({length:26}).map((_,i)=>(
                <span key={i} style={{flex:1, height: 5+Math.abs(Math.sin(i*1.7+recSecs))*20, background:C.sub, borderRadius:2, opacity:.6}}/>
              ))}
            </div>
          </div>
          <RoundBtn onClick={sendRec} bg={C.accent} color="#000" size={46}><Ic.send width="22" height="22"/></RoundBtn>
        </div>
      ) : (
        <div style={{flexShrink:0, padding:'8px 12px 22px', borderTop:`1px solid ${C.line}`, display:'flex', alignItems:'flex-end', gap:8}}>
          <RoundBtn onClick={()=>fileRef.current && fileRef.current.click()} bg="transparent" size={40} color={C.sub}><Ic.image width="23" height="23"/></RoundBtn>
          <div style={{flex:1, background:C.card, borderRadius:0, border:`1px solid ${text?C.line:'transparent'}`, padding:'10px 14px', minHeight:42, display:'flex', alignItems:'center'}}>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={1} placeholder="Сообщение..." onKeyDown={(e)=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); send();} }}
              style={{flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:15, fontFamily:'inherit', resize:'none', maxHeight:80, lineHeight:1.35}}/>
          </div>
          {text.trim()
            ? <RoundBtn onClick={send} bg={C.accent} color="#000" size={42}><Ic.send width="21" height="21"/></RoundBtn>
            : <RoundBtn onClick={startRec} bg={C.card} color={C.sub} size={42}><Ic.mic width="22" height="22"/></RoundBtn>}
        </div>
      )}
    </>
  );
}

function Bubble({ m }) {
  const mine = m.from === 'me';
  // voice message
  if (m.voice) return <VoiceBubble secs={m.voice} mine={mine} time={m.time} />;
  // photo (placeholder kind) or real uploaded photo
  if (m.img || m.photo) {
    return (
      <div style={{alignSelf: mine?'flex-end':'flex-start', maxWidth:'72%'}}>
        <div style={{borderRadius:0, overflow:'hidden', border:`1px solid ${mine?'transparent':C.line}`}}>
          {m.photo
            ? <img src={m.photo} alt="" style={{display:'block', width:'100%', maxHeight:240, objectFit:'cover'}}/>
            : <ProductImg kind={m.img} h={150} radius={0}/>}
        </div>
        <div style={{fontSize:11, color:C.sub, marginTop:4, textAlign: mine?'right':'left'}}>{m.time}</div>
      </div>
    );
  }
  return <TextBubble mine={mine} time={m.time} text={m.text} />;
}

function TextBubble({ mine, time, text }) {
  const ref = React.useRef(null);
  const [multiline, setMultiline] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const lineHeight = parseFloat(getComputedStyle(ref.current).lineHeight) || 21;
    setMultiline(ref.current.scrollHeight > lineHeight * 1.5);
  }, [text]);
  const tailCorner = !multiline;
  return (
    <div style={{alignSelf: mine?'flex-end':'flex-start', maxWidth:'78%'}}>
      <div ref={ref} style={{background: mine?C.accent:C.card, color: mine?'#000':'#fff', padding:'10px 14px',
        borderRadius:0,
        borderBottomRightRadius: (mine && tailCorner) ? 5 : 18,
        borderBottomLeftRadius: (!mine && tailCorner) ? 5 : 18,
        fontSize:15, lineHeight:1.4}}>{text}</div>
      <div style={{fontSize:11, color:C.sub, marginTop:4, textAlign: mine?'right':'left'}}>{time}</div>
    </div>
  );
}

function VoiceBubble({ secs, mine, time }) {
  const [playing, setPlaying] = React.useState(false);
  const [pos, setPos] = React.useState(0); // 0..1
  React.useEffect(()=>{
    if(!playing) return;
    const step = 100 / (secs*1000); // progress per 100ms
    const t = setInterval(()=>{
      setPos(p => {
        const np = p + step;
        if (np >= 1) { clearInterval(t); setPlaying(false); return 0; }
        return np;
      });
    }, 100);
    return ()=>clearInterval(t);
  }, [playing, secs]);
  const fg = mine ? '#000' : C.accent;
  const dim = mine ? 'rgba(0,0,0,.35)' : C.sub;
  const fmt = (s) => `${Math.floor(s/60)}:${String(Math.round(s)%60).padStart(2,'0')}`;
  const bars = 24;
  return (
    <div style={{alignSelf: mine?'flex-end':'flex-start', maxWidth:'80%'}}>
      <div style={{display:'flex', alignItems:'center', gap:11, background: mine?C.accent:C.card, color: mine?'#000':'#fff', padding:'9px 14px 9px 11px',
        borderRadius:0, borderBottomRightRadius: mine?5:18, borderBottomLeftRadius: mine?18:5}}>
        <button onClick={()=>setPlaying(!playing)} style={{width:34, height:34, borderRadius:0, background: mine?'rgba(0,0,0,.12)':C.accent, color: mine?'#000':'#000', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
          {playing ? <Ic.pause width="18" height="18"/> : <Ic.play width="18" height="18"/>}
        </button>
        <div style={{display:'flex', alignItems:'center', gap:2.5, height:26}}>
          {Array.from({length:bars}).map((_,i)=>{
            const active = i/bars <= pos;
            return <span key={i} style={{width:3, height: 6+Math.abs(Math.sin(i*1.3))*18, borderRadius:2, background: active?fg:dim, opacity: active?1:.5}}/>;
          })}
        </div>
        <span style={{fontSize:12.5, fontWeight:600, color: mine?'rgba(0,0,0,.6)':C.sub, fontVariantNumeric:'tabular-nums', flexShrink:0}}>{fmt(playing?secs*pos:secs)}</span>
      </div>
      <div style={{fontSize:11, color:C.sub, marginTop:4, textAlign: mine?'right':'left'}}>{time}</div>
    </div>
  );
}

function SysMsg({ children }) {
  return (
    <div style={{alignSelf:'center', maxWidth:'88%', textAlign:'center', background:C.card, borderRadius:0, padding:'11px 16px', fontSize:13, color:C.sub2, lineHeight:1.45, display:'flex', gap:9, alignItems:'flex-start'}}>
      <span style={{color:C.accent, fontWeight:800, flexShrink:0}}>ARVELL</span>
      <span>{children}</span>
    </div>
  );
}

function ProductChatCard({ p, pending }) {
  return (
    <div style={{alignSelf:'stretch', background:C.card, borderRadius:0, border:`1.5px solid ${pending?C.accent:C.line}`, overflow:'hidden'}}>
      <div style={{display:'flex', gap:12, padding:12}}>
        <div style={{width:60, height:60, borderRadius:0, overflow:'hidden', flexShrink:0}}><ProductImg kind={p.kind} h={60} radius={0}/></div>
        <div style={{flex:1}}>
          <div style={{fontSize:15, fontWeight:700}}>{p.brand} {p.model}</div>
          <div style={{fontSize:13, color:C.sub, marginTop:2}}>{p.size} · {p.cond}</div>
          <div style={{fontSize:16, fontWeight:800, color:C.accent, marginTop:5}}>{money(p.price)}</div>
        </div>
      </div>
      {pending && <div style={{background:C.accentDim, color:C.accent, fontSize:12.5, fontWeight:600, padding:'8px 14px', display:'flex', alignItems:'center', gap:7}}>
        <Ic.clock width="14" height="14"/> Ожидает подтверждения продавца
      </div>}
    </div>
  );
}

Object.assign(window, { ChatListScreen, ChatScreen });
