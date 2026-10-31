// ===== ARVELL v3 — chats list + chat =====
function V3ChatList({ go, chats, onMarkRead }) {
  const [sel, setSel] = React.useState(null); // null = not selecting, else {id:true}
  const [q, setQ] = React.useState('');
  const list = chats.filter(c => !q.trim() || (c.name+' '+c.preview).toLowerCase().includes(q.trim().toLowerCase()));
  const n = sel ? Object.values(sel).filter(Boolean).length : 0;
  return (
    <>
      <div style={{flexShrink:0, display:'flex', alignItems:'center', padding:'4px 16px 10px', minHeight:52, borderBottom:`1px solid ${C.line}`}}>
        <div style={{width:80}}>{sel && <button onClick={()=>setSel(null)} style={txtBtn}>Отмена</button>}</div>
        <div style={{flex:1, textAlign:'center', fontSize:16, fontWeight:800, color:C.accent, ...vWide}}>{sel ? `Выбрано: ${n}` : 'Чаты'}</div>
        <div style={{width:80, display:'flex', justifyContent:'flex-end'}}>{!sel && chats.length>0 && <button onClick={()=>setSel({})} style={txtBtn}>Выбрать</button>}</div>
      </div>
      {chats.length===0 ? (
        <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:30, textAlign:'center'}}>
          <div style={{width:64, height:64, borderRadius:32, background:C.card, display:'flex', alignItems:'center', justifyContent:'center', color:C.sub, marginBottom:16}}><Ic.chat width="28" height="28"/></div>
          <div style={{fontSize:16, fontWeight:700, marginBottom:6}}>Пока нет сообщений</div>
          <div style={{fontSize:13.5, color:C.sub}}>Напишите продавцу со страницы товара</div>
        </div>
      ) : (
        <div style={{flex:1, overflowY:'auto'}} className="scroll">
          <div style={{padding:'12px 16px 6px'}}>
            <div style={vField}><Ic.search width="18" height="18" style={{color:C.sub}}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск по чатам" style={vInput}/></div>
          </div>
          {list.map(c => {
            const on = sel && sel[c.id];
            return (
              <div key={c.id} onClick={()=> sel ? setSel({...sel, [c.id]:!on}) : go({s:'chat', id:c.id})} style={{display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', borderBottom:`1px solid ${C.line}`}}>
                {sel && <span style={{width:22, height:22, flexShrink:0, border:`1.5px solid ${on?C.accent:'#555'}`, background: on?C.accent:'transparent', color:'#000', display:'flex', alignItems:'center', justifyContent:'center'}}>{on && <Ic.check width="14" height="14"/>}</span>}
                <Avatar name={c.name} size={50}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{flex:1, fontSize:15, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.name}</span>
                    <span style={{fontSize:12, color:C.sub, flexShrink:0}}>{c.time}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginTop:3}}>
                    <span style={{flex:1, fontSize:13.5, color: c.closed?'#666':C.sub, fontStyle: c.closed?'italic':'normal', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.closed ? 'Переписка закрыта' : c.preview}</span>
                    {c.unread>0 && <span style={{minWidth:20, height:20, padding:'0 6px', background:C.accent, color:'#000', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center'}}>{c.unread}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {list.length===0 && <div style={{textAlign:'center', color:C.sub, fontSize:14, padding:'40px 0'}}>Ничего не найдено</div>}
        </div>
      )}
      {sel && (
        <div style={{flexShrink:0, padding:'10px 16px 14px', borderTop:`1px solid ${C.line}`, background:C.bg}}>
          <button disabled={!n} onClick={()=>{ onMarkRead(Object.keys(sel).filter(k=>sel[k])); setSel(null); }} style={{...vPrimary, width:'100%', opacity: n?1:.35, cursor: n?'pointer':'default'}}><Ic.check width="16" height="16"/> Отметить прочитанным</button>
        </div>
      )}
    </>
  );
}
const txtBtn = { background:'none', border:'none', color:C.accent, fontSize:14.5, fontWeight:600, cursor:'pointer', padding:0, fontFamily:'inherit' };

function V3Chat({ id, go, chats, sendMessage, isSeller, reviews, onConfirmSale }) {
  const c = chats.find(x => x.id === id);
  const p = byId(c.productId);
  const [text, setText] = React.useState('');
  const [photo, setPhoto] = React.useState(null);
  const [attach, setAttach] = React.useState(false);
  const [viewer, setViewer] = React.useState(null);
  const [zoom, setZoom] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const scrollRef = React.useRef(null);
  React.useEffect(()=>{ const el=scrollRef.current; if(el) el.scrollTop = el.scrollHeight; }, [c.messages.length]);
  const rev = sellerReviews(reviews, p.seller.name);
  const canSend = !!text.trim() || !!photo;
  const send = () => {
    if (!canSend) return;
    if (photo) sendMessage(c.id, { img: photo, text: text.trim() || undefined });
    else sendMessage(c.id, text.trim());
    setText(''); setPhoto(null);
  };
  return (
    <>
      <div style={{flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'2px 12px 10px 16px', borderBottom:`1px solid ${C.line}`}}>
        <VBack onClick={()=>go({back:true})}/>
        <Avatar name={c.name} size={38}/>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:15.5, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.name}</div>
          {!isSeller && rev.length>0 && <div style={{display:'flex', alignItems:'center', gap:4, marginTop:2}}><Ic.star width="11" height="11" style={{color:C.accent}}/><span style={{fontSize:12, color:C.sub}}>{avg(rev).toFixed(1)}</span></div>}
        </div>
        {c.hasPhone && !c.closed && <a href="tel:+79001234567" style={{width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:C.text}}><Ic.phone width="20" height="20"/></a>}
      </div>

      <div onClick={()=>go({s:'product', id:p.id})} style={{flexShrink:0, display:'flex', alignItems:'center', gap:10, padding:'8px 16px', background:C.card, borderBottom:`1px solid ${C.line}`, cursor:'pointer'}}>
        <div style={{width:48, height:48, flexShrink:0}}><ProductImg kind={p.kind} h={48} radius={0}/></div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:13.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.brand} {p.model}</div>
          <div style={{fontSize:13.5, fontWeight:800, color:C.accent, marginTop:2}}>{money(p.price)}</div>
        </div>
        <Ic.chevron width="18" height="18" style={{color:C.sub}}/>
      </div>

      {isSeller && !c.closed && (
        c.confirmed ? (
          <div style={{flexShrink:0, padding:'10px 16px', fontSize:13, color:C.green, fontWeight:600, borderBottom:`1px solid ${C.line}`}}>✓ Продажа подтверждена. Покупатель может оставить отзыв</div>
        ) : (
          <div style={{flexShrink:0, padding:'10px 16px', display:'flex', alignItems:'center', gap:12, background:C.card, borderBottom:`1px solid ${C.line}`}}>
            <div style={{flex:1, fontSize:12.5, color:C.sub2, lineHeight:1.4}}>Товар продан этому покупателю? Подтвердите продажу — тогда он сможет оставить отзыв</div>
            <button onClick={()=>setConfirm(true)} style={{...vPrimary, height:36, fontSize:10.5, padding:'0 10px', flexShrink:0}}><span style={{display:'block', lineHeight:1.25, textAlign:'center'}}>Подтвердить<br/>продажу</span></button>
          </div>
        )
      )}

      <div ref={scrollRef} style={{flex:1, overflowY:'auto', padding:'14px 16px 8px', display:'flex', flexDirection:'column', gap:10}} className="scroll">
        {c.buy && (
          <div style={{alignSelf:'center', maxWidth:'90%', textAlign:'center', background:C.card, border:`1px solid ${C.line}`, padding:'10px 14px', fontSize:12.5, color:C.sub2, lineHeight:1.45}}>
            <span style={{color:C.accent, fontWeight:800, ...vMono, fontSize:10.5, marginRight:6}}>ARVELL</span>
            Вы нажали «Купить». Напишите продавцу, чтобы договориться о деталях. Оплата — при встрече с продавцом
          </div>
        )}
        {c.messages.map((m,i) => {
          const mine = m.from==='me';
          return (
            <div key={i} style={{alignSelf: mine?'flex-end':'flex-start', maxWidth:'78%'}}>
              {m.img && <div onClick={()=>{setViewer(m.img); setZoom(false);}} style={{width:220, cursor:'zoom-in', border:`1px solid ${C.line}`}}><ProductImg kind={m.img} h={220} radius={0}/></div>}
              {m.text && <div style={{background: mine?C.accent:C.card, color: mine?'#000':C.text, padding:'10px 13px', fontSize:15, lineHeight:1.4, whiteSpace:'pre-wrap', overflowWrap:'anywhere', marginTop: m.img?2:0}}>{m.text}</div>}
              <div style={{fontSize:11, color:C.sub, marginTop:4, textAlign: mine?'right':'left'}}>{m.time}</div>
            </div>
          );
        })}
      </div>

      {c.closed ? (
        <div style={{flexShrink:0, padding:'16px 20px 24px', textAlign:'center', fontSize:13.5, color:C.sub, borderTop:`1px solid ${C.line}`}}>Переписка закрыта — отправлять сообщения больше нельзя</div>
      ) : (
        <div style={{flexShrink:0, borderTop:`1px solid ${C.line}`, padding:'8px 12px 20px'}}>
          {photo && (
            <div style={{position:'relative', width:76, height:76, marginBottom:8}}>
              <ProductImg kind={photo} h={76} radius={0}/>
              <button onClick={()=>setPhoto(null)} style={{position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:11, background:C.text, color:'#000', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Ic.close width="13" height="13"/></button>
            </div>
          )}
          <div style={{display:'flex', alignItems:'flex-end', gap:8}}>
            <button onClick={()=>setAttach(true)} style={{width:40, height:42, background:'none', border:'none', color:C.sub, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.clip width="22" height="22"/></button>
            <div style={{flex:1, background:C.card, border:`1px solid ${C.line}`, padding:'10px 12px', minHeight:42, display:'flex', alignItems:'center'}}>
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={1} placeholder={photo ? 'Добавьте подпись...' : 'Сообщение...'} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } }}
                style={{flex:1, background:'none', border:'none', outline:'none', color:C.text, fontSize:15, fontFamily:'inherit', resize:'none', maxHeight:96, lineHeight:1.35, overflow:'hidden'}}
                onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(96, e.target.scrollHeight)+'px'; }}/>
            </div>
            <button onClick={send} disabled={!canSend} style={{width:42, height:42, border:'none', background: canSend?C.accent:C.card, color: canSend?'#000':'#555', cursor: canSend?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.send width="20" height="20"/></button>
          </div>
        </div>
      )}

      {attach && (
        <VSheet onClose={()=>setAttach(false)}>
          {[['Фото', 'hoodie'], ['Камера', 'shoe']].map(([l,k]) => (
            <button key={l} onClick={()=>{ setPhoto(k); setAttach(false); }} style={{width:'100%', display:'flex', alignItems:'center', gap:12, padding:'15px 4px', background:'none', border:'none', borderBottom:`1px solid ${C.line}`, color:C.text, fontSize:15.5, cursor:'pointer', fontFamily:'inherit'}}>
              {l==='Фото' ? <Ic.grid width="20" height="20" style={{color:C.accent}}/> : <Ic.camera width="20" height="20" style={{color:C.accent}}/>} {l}
            </button>
          ))}
        </VSheet>
      )}
      {viewer && (
        <div onClick={()=>setViewer(null)} style={{position:'absolute', inset:0, zIndex:90, background:'#000', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
          <button onClick={()=>setViewer(null)} style={{position:'absolute', top:56, right:14, zIndex:2, width:36, height:36, borderRadius:18, border:'none', background:'rgba(255,255,255,.15)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}><Ic.close width="20" height="20"/></button>
          <div onClick={e=>{ e.stopPropagation(); setZoom(z=>!z); }} style={{width:'100%', transform: zoom?'scale(2)':'none', transition:'transform .25s ease', cursor: zoom?'zoom-out':'zoom-in'}}><ProductImg kind={viewer} h={420} radius={0} big/></div>
          <div style={{position:'absolute', bottom:30, left:0, right:0, textAlign:'center', fontSize:12, color:'#888'}}>Нажмите на фото, чтобы приблизить</div>
        </div>
      )}
      {confirm && <VDialog title="Подтвердить продажу?" text={`${c.name} купил(а) у вас «${p.brand} ${p.model}». После подтверждения покупатель сможет оставить отзыв. Отменить подтверждение нельзя`} ok="Подтвердить" onCancel={()=>setConfirm(false)} onOk={()=>{ setConfirm(false); onConfirmSale(c.id); }}/>}
    </>
  );
}

Object.assign(window, { V3ChatList, V3Chat });
