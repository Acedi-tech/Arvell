// ===== ARVELL — Admin panel (staff-only) =====
const { useState: useAdminState } = React;

const initialInvites = () => ([
  { id:'i1', code:'ARV-7788', status:'active', createdBy:'Команда ARVELL', createdAt:'02.07.2026', usedBy:null },
  { id:'i2', code:'ARV-4412', status:'active', createdBy:'Команда ARVELL', createdAt:'28.06.2026', usedBy:null },
  { id:'i3', code:'ARV-9021', status:'used', createdBy:'Команда ARVELL', createdAt:'20.06.2026', usedBy:'Дмитрий К.' },
  { id:'i4', code:'ARV-5533', status:'revoked', createdBy:'Команда ARVELL', createdAt:'15.06.2026', usedBy:null },
]);

const initialUsers = () => ([
  { id:'u1', name:'Александр Петров', role:'buyer', status:'active', joined:'май 2026' },
  { id:'u2', name:'Алексей Иванов', role:'seller', status:'active', joined:'март 2026' },
  { id:'u3', name:'Мария С.', role:'seller', status:'active', joined:'янв 2026' },
  { id:'u4', name:'Дмитрий К.', role:'seller', status:'active', joined:'апр 2026' },
  { id:'u5', name:'Игорь В.', role:'seller', status:'banned', joined:'фев 2026' },
  { id:'u6', name:'Олег М.', role:'buyer', status:'active', joined:'июнь 2026' },
]);

function AdminApp({ onExit }) {
  const [tab, setTab] = useAdminState('invites'); // invites | users
  const [invites, setInvites] = useAdminState(initialInvites);
  const [users, setUsers] = useAdminState(initialUsers);

  const createInvite = () => {
    const code = 'ARV-' + Math.floor(1000 + Math.random()*9000);
    setInvites(list => [{ id:'i'+Date.now(), code, status:'active', createdBy:'Команда ARVELL', createdAt:'11.07.2026', usedBy:null }, ...list]);
  };
  const revokeInvite = (id) => window.confirm('Отозвать инвайт? Код перестанет работать.') && setInvites(list => list.map(i => i.id===id ? {...i, status:'revoked'} : i));

  const toggleBan = (id) => setUsers(list => list.map(u => u.id===id ? {...u, status: u.status==='banned'?'active':'banned'} : u));

  const activeInvites = invites.filter(i=>i.status==='active').length;
  const bannedUsers = users.filter(u=>u.status==='banned').length;
  const sellers = users.filter(u=>u.role==='seller').length;

  return (
    <div className="phone">
      <div className="screen" style={{background:C.bg, color:C.text, display:'flex', flexDirection:'column', height:'100%', position:'relative'}}>
        <StatusBar />
        <div style={{height:52, flexShrink:0, display:'flex', alignItems:'center', padding:'0 16px', gap:8}}>
          <RoundBtn bg="transparent" size={40} onClick={onExit}><Ic.back width="22" height="22"/></RoundBtn>
          <div style={{flex:1, textAlign:'center', fontSize:18, fontWeight:700, color:C.accent, letterSpacing:.2}}>Админ-панель</div>
          <div style={{width:40}}/>
        </div>

        <div style={{display:'flex', gap:8, padding:'0 16px 14px', flexShrink:0}}>
          {[{k:'invites',l:'Инвайты'},{k:'users',l:'Пользователи'}].map(t => {
            const on = tab===t.k;
            return (
              <button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1, height:40, borderRadius:0, background: on?C.accent:C.card, color: on?'#000':'#fff', border:`1px solid ${on?C.accent:C.line}`, fontSize:13.5, fontWeight:600, cursor:'pointer'}}>{t.l}</button>
            );
          })}
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'0 16px 24px'}} className="scroll">
          {tab==='invites' && (
            <AdminInvites invites={invites} onCreate={createInvite} onRevoke={revokeInvite} />
          )}
          {tab==='users' && (
            <AdminUsers users={users} onToggleBan={toggleBan} />
          )}
        </div>
      </div>
    </div>
  );
}

function AdminInvites({ invites, onCreate, onRevoke }) {
  const statusLabel = { active:'Активен', used:'Использован', revoked:'Отозван' };
  const statusColor = { active:C.accent, used:C.sub, revoked:C.red };
  return (
    <>
      <button onClick={onCreate} style={{width:'100%', height:48, borderRadius:0, background:C.accent, color:'#000', border:'none', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:20}}>
        <Ic.plus width="20" height="20"/> Создать инвайт
      </button>
      <div style={{background:C.card, borderRadius:0, overflow:'hidden'}}>
        {invites.map((inv,i) => (
          <div key={inv.id} style={{padding:'13px 14px', borderBottom: i===invites.length-1?'none':`1px solid ${C.bg}`}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{fontSize:15.5, fontWeight:700, letterSpacing:1, fontFamily:'ui-monospace, monospace'}}>{inv.code}</span>
              <span style={{fontSize:11.5, fontWeight:700, color: inv.status==='active'?'#000':'#fff', background: statusColor[inv.status], padding:'2px 8px', borderRadius:6, marginLeft:'auto'}}>{statusLabel[inv.status]}</span>
            </div>
            <div style={{fontSize:12.5, color:C.sub, marginTop:5}}>
              Создал {inv.createdBy} · {inv.createdAt}{inv.usedBy && ` · использовал ${inv.usedBy}`}
            </div>
            {inv.status==='active' && (
              <button onClick={()=>onRevoke(inv.id)} style={{marginTop:9, background:'none', border:`1px solid ${C.red}`, color:C.red, borderRadius:0, padding:'6px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer'}}>Отозвать</button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function AdminUsers({ users, onToggleBan }) {
  return (
    <div style={{background:C.card, borderRadius:0, overflow:'hidden'}}>
      {users.map((u,i) => (
        <div key={u.id} style={{display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i===users.length-1?'none':`1px solid ${C.bg}`}}>
          <Avatar name={u.name} size={40} />
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14.5, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.name}</div>
            <div style={{fontSize:12, color:C.sub, marginTop:2}}>{u.role==='seller'?'Продавец':'Покупатель'} · с {u.joined}</div>
          </div>
          <button onClick={()=>onToggleBan(u.id)} style={{flexShrink:0, background: u.status==='banned'?C.accent:'transparent', color: u.status==='banned'?'#000':C.red, border:`1px solid ${u.status==='banned'?C.accent:C.red}`, borderRadius:0, padding:'7px 13px', fontSize:12.5, fontWeight:600, cursor:'pointer'}}>
            {u.status==='banned' ? 'Разбанить' : 'Забанить'}
          </button>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0'}}>
      <span style={{fontSize:14.5, color:C.sub2}}>{label}</span>
      <span style={{fontSize:15, fontWeight:700}}>{value}</span>
    </div>
  );
}

const secHdC = { fontSize:16, fontWeight:700, marginBottom:12, marginTop:4 };

Object.assign(window, { AdminApp });
