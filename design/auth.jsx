// ===== ARVELL — Auth / Registration flow =====
const { useState: useAuthState, useRef: useAuthRef, useEffect: useAuthEffect } = React;

// ---- In-app login: full-screen page over current screen ----
function AuthSheet({ onDone, onCancel, reason }) {
  const [step, setStep] = useAuthState('welcome'); // welcome | phone | otp | seller | success
  const [phone, setPhone] = useAuthState('');
  const [name, setName] = useAuthState('');
  const [invite, setInvite] = useAuthState('');
  const [seller, setSellerReg] = useAuthState(false);
  const [shop, setShop] = useAuthState('');
  const finishPayload = useAuthRef(null);

  const isRegistered = () => { try { return localStorage.getItem('arvell_registered')==='1'; } catch(e){ return false; } };
  const finish = (isSeller) => {
    try { localStorage.setItem('arvell_registered','1'); } catch(e){}
    finishPayload.current = { name: name || 'Александр Петров', phone, seller: !!isSeller, shop: isSeller ? shop : '' };
    setStep('success');
  };
  const afterOtp = () => { if (isRegistered()) finish(false); else setStep('seller'); };

  return (
    <div style={{position:'absolute', inset:0, zIndex:60, background:C.bg, display:'flex', flexDirection:'column', animation:'slideInPage .28s cubic-bezier(.16,1,.3,1)'}}>
      {step==='welcome' && <Welcome onLogin={()=>setStep('phone')} onCancel={onCancel} reason={reason} />}
      {step==='phone' && <PhoneStep phone={phone} setPhone={setPhone} onBack={()=>setStep('welcome')} onNext={()=>setStep('otp')} onCancel={onCancel} />}
      {step==='otp' && <OtpStep phone={phone} onBack={()=>setStep('phone')} onNext={afterOtp} onCancel={onCancel} />}
      {step==='seller' && <RegisterStep name={name} setName={setName} invite={invite} setInvite={setInvite} seller={seller} setSeller={setSellerReg} shop={shop} setShop={setShop} onBack={()=>setStep('otp')} onDone={()=> seller ? setStep('sellerOtp') : finish(false)} onCancel={onCancel} />}
      {step==='sellerOtp' && <OtpStep phone={phone} manual title="Подтвердите номер" sub="Последний шаг регистрации продавца" text={`Отправили код на ${phone || '+7 900 123-45-67'}, чтобы подтвердить регистрацию продавца`} cta="Подтвердить код" link="Изменить код приглашения" onLink={()=>setStep('seller')} onBack={()=>setStep('seller')} onNext={()=>finish(true)} onCancel={onCancel} />}
      {step==='success' && <AuthSuccess onDone={()=>onDone(finishPayload.current)} isSeller={seller} />}
    </div>
  );
}

// ---- Success transition: checkmark burst before landing in the app ----
function AuthSuccess({ onDone, isSeller }) {
  useAuthEffect(()=>{ const t = setTimeout(onDone, 1500); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:22}}>
      <div style={{position:'relative', width:112, height:112, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <svg width="112" height="112" viewBox="0 0 112 112" style={{position:'absolute', inset:0}}>
          <circle cx="56" cy="56" r="50" fill="none" stroke={C.accent} strokeWidth="4" strokeLinecap="round"
            strokeDasharray="314" strokeDashoffset="314" transform="rotate(-90 56 56)"
            style={{animation:'ringDraw .6s cubic-bezier(.65,0,.35,1) .05s forwards'}}/>
        </svg>
        <div style={{width:80, height:80, borderRadius:0, background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', transform:'scale(0)', animation:'popIn .45s cubic-bezier(.34,1.56,.64,1) .55s forwards'}}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path d="m5 12.5 4.5 4.5L19 6.5" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="24" strokeDashoffset="24" style={{animation:'checkDraw .3s ease .75s forwards'}}/>
          </svg>
        </div>
      </div>
      <div style={{textAlign:'center', opacity:0, animation:'fadeUp .4s ease 1s forwards'}}>
        <div style={{fontSize:19, fontWeight:800}}>Готово!</div>
        <div style={{fontSize:14, color:C.sub, marginTop:6}}>{isSeller ? 'Добро пожаловать, продавец' : 'Вы вошли в ARVELL'}</div>
      </div>
    </div>
  );
}

function AuthFlow({ onDone, onCancel, skipSplash }) {
  const [step, setStep] = useAuthState(skipSplash ? 'welcome' : 'splash'); // splash | welcome | phone | otp | seller
  const [phone, setPhone] = useAuthState('');
  const [name, setName] = useAuthState('');
  const [invite, setInvite] = useAuthState('');
  const [seller, setSellerReg] = useAuthState(false);

  useAuthEffect(()=>{
    if (step!=='splash') return;
    const t = setTimeout(()=>setStep('welcome'), 1900);
    return ()=>clearTimeout(t);
  },[step]);

  const isRegistered = () => { try { return localStorage.getItem('arvell_registered')==='1'; } catch(e){ return false; } };
  const finish = (isSeller) => {
    try { localStorage.setItem('arvell_registered','1'); } catch(e){}
    onDone({ name: name || 'Александр Петров', phone, seller: !!isSeller });
  };

  // after OTP: registered → straight to Home; new user → registration page
  const afterOtp = () => { if (isRegistered()) finish(false); else setStep('seller'); };

  return (
    <div className="phone">
      <div className="screen" style={{background:C.bg, color:C.text, display:'flex', flexDirection:'column', height:'100%', position:'relative'}}>
        <StatusBar />
        {step==='splash' && <Splash />}
        {step==='welcome' && <Welcome onLogin={()=>setStep('phone')} onCancel={onCancel} />}
        {step==='phone' && <PhoneStep phone={phone} setPhone={setPhone} onBack={()=>setStep('welcome')} onNext={()=>setStep('otp')} onCancel={onCancel} />}
        {step==='otp' && <OtpStep phone={phone} onBack={()=>setStep('phone')} onNext={afterOtp} onCancel={onCancel} />}
        {step==='seller' && <RegisterStep name={name} setName={setName} invite={invite} setInvite={setInvite} seller={seller} setSeller={setSellerReg} onBack={()=>setStep('otp')} onDone={()=>finish(seller)} />}
      </div>
    </div>
  );
}

// ---- Splash ----
function Splash() {
  return (
    <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
      <div style={{animation:'fade .6s ease'}}>
        <svg width="120" height="120" viewBox="0 0 120 122" fill="none">
          <path d="M16 112 L60 12" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M60 12 L104 112" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M33 80 L51 98 L86 56" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{fontSize:16, fontWeight:600, color:'#fff', letterSpacing:3, marginTop:34, animation:'fade .9s ease'}}>ARVELL</div>
      <div style={{position:'absolute', bottom:40, left:0, right:0, textAlign:'center', fontSize:11, color:C.sub, letterSpacing:.4}}>одежда с гарантией подлинности</div>
    </div>
  );
}

// ---- Welcome ----
function Welcome({ onLogin, onCancel, reason }) {
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', padding:'0 24px 30px', position:'relative'}}>
      {onCancel && (
        <div style={{position:'absolute', top:8, right:16}}><RoundBtn bg="transparent" size={40} onClick={onCancel} color={C.sub}><Ic.close width="22" height="22"/></RoundBtn></div>
      )}
      <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18}}>
        <svg width="88" height="88" viewBox="0 0 120 122" fill="none">
          <path d="M16 112 L60 12" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M60 12 L104 112" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M33 80 L51 98 L86 56" stroke={C.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{fontSize:22, fontWeight:800, color:'#fff', textAlign:'center', marginTop:4}}>{reason || 'Войдите в ARVELL'}</div>
        <div style={{fontSize:15, color:C.sub2, textAlign:'center', lineHeight:1.5, maxWidth:280}}>
          Вход нужен, чтобы писать продавцам и сохранять избранное
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        <button onClick={onLogin} style={btnPrimary}>Войти</button>
        <div style={{textAlign:'center', fontSize:12, color:C.sub, marginTop:6, lineHeight:1.5}}>
          Продолжая, вы принимаете <span style={{color:C.sub2}}>Условия</span> и <span style={{color:C.sub2}}>Политику конфиденциальности</span>
        </div>
      </div>
    </div>
  );
}

// ---- Phone number ----
function PhoneStep({ phone, setPhone, onBack, onNext, onCancel, compact }) {
  const fmt = (v) => {
    const d = v.replace(/\D/g,'').replace(/^8/,'7').replace(/^([^7])/,'7$1').slice(0,11);
    let r = '+7';
    if (d.length>1) r += ' ('+d.slice(1,4);
    if (d.length>=4) r += ') '+d.slice(4,7);
    if (d.length>=7) r += '-'+d.slice(7,9);
    if (d.length>=9) r += '-'+d.slice(9,11);
    return r;
  };
  const valid = phone.replace(/\D/g,'').length>=11;
  return (
    <AuthScaffold title="Вход" onBack={compact ? null : onBack} onCancel={onCancel} compact={compact}
      footer={<button disabled={!valid} onClick={onNext} style={{...btnPrimary, opacity: valid?1:.4}}>Получить код</button>}>
      <div style={{fontSize: compact?20:24, fontWeight:800, marginBottom:10}}>Введите номер телефона</div>
      <div style={{fontSize:14, color:C.sub, lineHeight:1.5, marginBottom:22}}>Мы отправим SMS с кодом подтверждения</div>
      <div style={{...fieldBox, height:58, borderColor: phone?C.accent:C.line}}>
        <input autoFocus inputMode="tel" value={phone} onChange={e=>setPhone(fmt(e.target.value))} placeholder="+7 (___) ___-__-__" style={{...inputReset, fontSize:18, fontWeight:600, letterSpacing:.5}}/>
      </div>
    </AuthScaffold>
  );
}

// ---- OTP ----
function OtpStep({ phone, onBack, onNext, onCancel, compact, manual, title, sub, text, cta, link, onLink }) {
  const [code, setCode] = useAuthState(['','','','']);
  const [err, setErr] = useAuthState(false);
  const refs = [useAuthRef(), useAuthRef(), useAuthRef(), useAuthRef()];
  const [secs, setSecs] = useAuthState(59);
  useAuthEffect(()=>{ refs[0].current && refs[0].current.focus(); },[]);
  useAuthEffect(()=>{ if(secs<=0) return; const tm=setTimeout(()=>setSecs(secs-1),1000); return ()=>clearTimeout(tm); },[secs]);
  const full = code.every(c=>c);
  const check = () => {
    if (code.join('')==='0000') { setErr(true); setTimeout(()=>{ setCode(['','','','']); refs[0].current && refs[0].current.focus(); }, 500); return; }
    onNext();
  };
  useAuthEffect(()=>{ if(full && !manual) { const tm=setTimeout(check, 300); return ()=>clearTimeout(tm);} },[full]);
  const onChange = (i, v) => {
    const digits = v.replace(/\D/g,'');
    setErr(false);
    if (digits.length>1) { const nc=[...code]; for (let k=0;k<4-i && k<digits.length;k++) nc[i+k]=digits[k]; setCode(nc); const nx=Math.min(3, i+digits.length); refs[nx].current && refs[nx].current.focus(); return; }
    const nc = [...code]; nc[i]=digits; setCode(nc);
    if (digits && i<3) refs[i+1].current && refs[i+1].current.focus();
  };
  const onKey = (i, e) => {
    if (e.key==='Backspace' && !code[i] && i>0) { e.preventDefault(); const nc=[...code]; nc[i-1]=''; setCode(nc); refs[i-1].current && refs[i-1].current.focus(); }
  };
  const mm = `0:${String(secs).padStart(2,'0')}`;
  return (
    <AuthScaffold title={title ? '' : 'Подтверждение'} onBack={onBack} onCancel={onCancel} compact={compact}
      footer={
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {manual && <button disabled={!full} onClick={check} style={{...btnPrimary, opacity: full?1:.4}}>{cta}</button>}
          <div style={{textAlign:'center', fontSize:14, color:C.sub}}>
            {secs>0 ? <>Отправить код повторно через {mm}</> : <span onClick={()=>setSecs(59)} style={{color:C.accent, cursor:'pointer', fontWeight:600}}>Отправить код повторно</span>}
          </div>
        </div>
      }>
      <div style={{fontSize: compact?20:24, fontWeight:800, marginBottom: sub?4:10}}>{title || 'Введите код'}</div>
      {sub && <div style={{fontSize:14, color:C.sub, marginBottom:14}}>{sub}</div>}
      <div style={{fontSize:14, color:C.sub2, lineHeight:1.5, marginBottom:24}}>{text || <>Код отправлен на {phone || '+7 (•••) •••'}</>}</div>
      <div style={{display:'flex', gap:12, justifyContent:'center', animation: err?'otpShake .4s ease':'none'}}>
        {code.map((c,i)=>(
          <input key={i} ref={refs[i]} value={c} inputMode="numeric" autoComplete="one-time-code" onChange={e=>onChange(i,e.target.value)} onKeyDown={e=>onKey(i,e)}
            style={{width:62, height:70, borderRadius:0, background:C.card, border:`1.5px solid ${err?C.red:(c?C.accent:C.line)}`, color:'#fff', fontSize:28, fontWeight:700, textAlign:'center', outline:'none', fontFamily:'inherit'}}/>
        ))}
      </div>
      {err && <div style={{textAlign:'center', fontSize:13, color:C.red, marginTop:12}}>Неверный код</div>}
      <div style={{textAlign:'center', fontSize:12.5, color:C.sub, marginTop:20}}>Тестовый код: любые 4 цифры, «0000» — ошибка</div>
      {link && <div onClick={onLink} style={{textAlign:'center', fontSize:14, color:C.accent, marginTop:18, cursor:'pointer', fontWeight:600}}>{link}</div>}
    </AuthScaffold>
  );
}

// ---- Registration page (separate screen for new users) ----
const USED_INVITE_CODES = { 'ARV-9021':'уже использован', 'ARV-5533':'отозван' };
function RegisterStep({ name, setName, invite, setInvite, seller, setSeller, shop='', setShop, onBack, onDone }) {
  const inviteStatus = USED_INVITE_CODES[invite.trim().toUpperCase()];
  const canDone = name.trim().length>=2 && (!seller || (invite.trim().length>=4 && !inviteStatus && shop.trim().length>=2));
  return (
    <AuthScaffold title="Регистрация" onBack={onBack}
      footer={<button disabled={!canDone} onClick={onDone} style={{...btnPrimary, opacity: canDone?1:.4}}>{seller ? 'Получить код из SMS' : 'Завершить'}</button>}>
      <div style={{fontSize:24, fontWeight:800, marginBottom:10}}>Расскажите о себе</div>
      <div style={{fontSize:15, color:C.sub, lineHeight:1.5, marginBottom:24}}>Как вас будут видеть другие пользователи</div>

      <div style={{display:'flex', justifyContent:'center', marginBottom:24}}>
        <div style={{position:'relative'}}>
          <div style={{width:88, height:88, borderRadius:0, background:C.cardHi, display:'flex', alignItems:'center', justifyContent:'center', color:C.sub, fontSize:34, fontWeight:700}}>
            {name.trim() ? name.trim()[0].toUpperCase() : <Ic.user width="40" height="40"/>}
          </div>
          <div style={{position:'absolute', bottom:-2, right:-2, width:30, height:30, borderRadius:0, background:C.accent, color:'#000', display:'flex', alignItems:'center', justifyContent:'center', border:`3px solid ${C.bg}`}}><Ic.camera width="16" height="16"/></div>
        </div>
      </div>

      <div style={lbl}>Введите имя</div>
      <div style={{...fieldBox, borderColor: name?C.accent:C.line}}><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Введите имя" style={inputReset}/></div>

      <div style={{...lbl, marginTop:6}}>Кто вы на ARVELL?</div>
      <button onClick={()=>setSeller(false)} style={choiceCard(!seller)}>
        <div style={{width:42, height:42, borderRadius:0, background: !seller?C.accent:C.cardHi, color: !seller?'#000':C.sub, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><Ic.bag width="21" height="21"/></div>
        <div style={{flex:1, textAlign:'left'}}>
          <div style={{fontSize:15.5, fontWeight:700}}>Я покупатель</div>
          <div style={{fontSize:12.5, color:C.sub, marginTop:2}}>Просматриваю и покупаю товары</div>
        </div>
        <Radio on={!seller}/>
      </button>

      <button onClick={()=>setSeller(true)} style={{...choiceCard(seller), marginTop:10}}>
        <div style={{width:42, height:42, borderRadius:0, background: seller?C.accent:C.cardHi, color: seller?'#000':C.sub, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><Ic.shield width="21" height="21"/></div>
        <div style={{flex:1, textAlign:'left'}}>
          <div style={{fontSize:15.5, fontWeight:700}}>Я продавец</div>
          <div style={{fontSize:12.5, color:C.sub, marginTop:2}}>Только по приглашению ARVELL</div>
        </div>
        <Radio on={seller}/>
      </button>

      {seller && (
        <div style={{animation:'fade .2s ease', marginTop:16}}>
          <div style={lbl}>Код приглашения</div>
          <div style={{...fieldBox, borderColor: inviteStatus?C.red:(invite?C.accent:C.line), marginBottom:8}}>
            <input value={invite} onChange={e=>setInvite(e.target.value.toUpperCase())} placeholder="Код из приглашения ARVELL" style={{...inputReset, letterSpacing:2, fontWeight:600}}/>
          </div>
          {inviteStatus ? (
            <div style={{fontSize:12.5, color:C.red, lineHeight:1.5, padding:'0 4px', display:'flex', alignItems:'center', gap:6}}><Ic.close width="14" height="14"/> Код приглашения недействителен. Уточните его у команды ARVELL</div>
          ) : (
            <div style={{fontSize:12.5, color:C.sub, lineHeight:1.5, padding:'0 4px'}}>Продавцы регистрируются только по приглашению. Код приглашения выдаёт команда ARVELL</div>
          )}
          <div style={{...lbl, marginTop:16}}>Название магазина</div>
          <div style={{...fieldBox, borderColor: shop?C.accent:C.line}}><input value={shop} onChange={e=>setShop(e.target.value)} placeholder="Например, Archive Room" style={inputReset}/></div>
        </div>
      )}
    </AuthScaffold>
  );
}

function Radio({ on }) {
  return (
    <span style={{width:24, height:24, borderRadius:0, border:`2px solid ${on?C.accent:C.line}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
      {on && <span style={{width:12, height:12, borderRadius:6, background:C.accent}}/>}
    </span>
  );
}

const choiceCard = (on) => ({ display:'flex', alignItems:'center', gap:14, width:'100%', background:C.card, border:`1.5px solid ${on?C.accent:C.line}`, borderRadius:0, padding:'13px 15px', cursor:'pointer', color:C.text });

// ---- shared scaffold ----
function AuthScaffold({ title, onBack, onCancel, children, footer, compact }) {
  return (
    <>
      <div style={{height:52, flexShrink:0, display:'flex', alignItems:'center', padding:'0 8px'}}>
        {onBack ? <RoundBtn bg="transparent" size={40} onClick={onBack}><Ic.back width="22" height="22"/></RoundBtn> : <div style={{width:40}}/>}
        <div style={{flex:1, textAlign:'center', fontSize:16, fontWeight:600, color:C.sub2}}>{title}</div>
        {onCancel ? <div><RoundBtn bg="transparent" size={40} onClick={onCancel} color={C.sub}><Ic.close width="20" height="20"/></RoundBtn></div> : <div style={{width:40}}/>}
      </div>
      <div style={{flex:1, overflowY: compact?'visible':'auto', padding: compact ? '4px 24px 8px' : '12px 24px 16px'}} className="scroll">{children}</div>
      <div style={{flexShrink:0, padding: compact ? '10px 24px 26px' : '12px 24px 26px'}}>{footer}</div>
    </>
  );
}

const btnPrimary = { width:'100%', height:54, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:16, fontWeight:700, cursor:'pointer' };
const btnGhost = { width:'100%', height:54, borderRadius:0, background:C.card, color:'#fff', border:`1px solid ${C.line}`, fontSize:16, fontWeight:600, cursor:'pointer' };
const lbl = { fontSize:13, fontWeight:600, color:C.sub2, margin:'0 2px 8px' };
const fieldBox = { width:'100%', minHeight:50, background:C.card, borderRadius:0, border:`1px solid ${C.line}`, padding:'0 16px', marginBottom:18, display:'flex', alignItems:'center' };
const inputReset = { flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:15, fontFamily:'inherit' };

Object.assign(window, { AuthFlow, AuthSheet });
