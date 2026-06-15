import React, { useMemo, useState } from 'react';
import {
  Plane, PackageCheck, FileWarning, IndianRupee, Users, Bell, Search, Plus,
  LayoutDashboard, ClipboardList, Truck, FileText, CreditCard, Building2,
  UserRoundCog, Bot, Settings, LogOut, ChevronRight, Filter, Download,
  Upload, ShieldCheck, MapPin, CalendarClock, AlertTriangle, CheckCircle2,
  Clock3, MoreHorizontal, Mail, Phone, Camera, Edit3, Lock, Palette, MessageCircle,
  Database, Activity, BarChart3, Route, UserCircle, Eye, Trash2, Save, Send
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const navGroups = [
  { title: 'Operations', items: [
    ['Dashboard', LayoutDashboard], ['Bookings', ClipboardList], ['Shipments', Truck], ['Documents', FileText], ['Revenue', CreditCard], ['Customers', Building2]
  ]},
  { title: 'Management', items: [
    ['Staff', UserRoundCog], ['Rate Manager', Route], ['Alerts', Bell], ['Reports', BarChart3], ['Assistant', Bot]
  ]},
  { title: 'Account', items: [
    ['Profile', UserCircle], ['Settings', Settings]
  ]}
];

const bookings = [
  { awb: 'ORB-7842-IND', customer: 'Vistara Pharma Exports', route: 'HYD → DXB', cargo: 'Pharma cold chain', weight: '428 kg', status: 'In Transit', revenue: '₹1,84,500', owner: 'Ravi', eta: '18 Jun' },
  { awb: 'ORB-9120-AIR', customer: 'Lotus Textiles', route: 'BLR → SIN', cargo: 'Garments', weight: '260 kg', status: 'Docs Pending', revenue: '₹92,800', owner: 'Anika', eta: '17 Jun' },
  { awb: 'ORB-5528-SEA', customer: 'Medix Labs', route: 'DEL → FRA', cargo: 'Lab equipment', weight: '590 kg', status: 'Delayed', revenue: '₹2,32,400', owner: 'Kiran', eta: '20 Jun' },
  { awb: 'ORB-1097-AIR', customer: 'Apollo Auto Parts', route: 'MAA → BKK', cargo: 'Auto components', weight: '310 kg', status: 'Delivered', revenue: '₹1,10,200', owner: 'Meera', eta: 'Delivered' }
];

const alerts = [
  { type: 'Delayed flight', text: 'ORB-5528-SEA missed connection at FRA hub', level: 'danger', time: '14 min ago' },
  { type: 'Missing document', text: 'Invoice and MSDS pending for Lotus Textiles', level: 'warning', time: '31 min ago' },
  { type: 'Payment overdue', text: '₹78,400 overdue from Northline Traders', level: 'danger', time: '1 hr ago' },
  { type: 'Rate update', text: 'Emirates HYD-DXB tariff changed by 4.2%', level: 'info', time: 'Today' }
];

const revenueData = [
  { month: 'Jan', revenue: 9.2, overdue: 1.1 }, { month: 'Feb', revenue: 11.4, overdue: 1.6 },
  { month: 'Mar', revenue: 10.7, overdue: 1.3 }, { month: 'Apr', revenue: 13.2, overdue: 1.8 },
  { month: 'May', revenue: 14.8, overdue: 2.1 }, { month: 'Jun', revenue: 12.6, overdue: 1.7 }
];

const statusData = [
  { name: 'Delivered', value: 42, color: '#1d9e75' }, { name: 'In Transit', value: 30, color: '#2563eb' },
  { name: 'Docs Pending', value: 18, color: '#f59e0b' }, { name: 'Delayed', value: 10, color: '#ef4444' }
];

const docs = [
  ['Commercial Invoice', 'ORB-9120-AIR', 'Pending', 'Lotus Textiles'],
  ['Packing List', 'ORB-7842-IND', 'Verified', 'Vistara Pharma Exports'],
  ['Airway Bill', 'ORB-5528-SEA', 'Received', 'Medix Labs'],
  ['MSDS Certificate', 'ORB-9120-AIR', 'Rejected', 'Lotus Textiles']
];

const customers = [
  ['Vistara Pharma Exports', '₹18.4L', '22 shipments', 'Excellent'],
  ['Lotus Textiles', '₹9.2L', '14 shipments', 'Docs risk'],
  ['Medix Labs', '₹23.2L', '18 shipments', 'High value'],
  ['Apollo Auto Parts', '₹11.0L', '11 shipments', 'Stable']
];

const staff = [
  ['Ravi Kumar', 'Operations Lead', 18, '96%'],
  ['Anika Sharma', 'Docs Executive', 26, '89%'],
  ['Kiran Rao', 'Shipment Coordinator', 15, '91%'],
  ['Meera Nair', 'Finance Owner', 12, '94%']
];

function StatusBadge({ status }) {
  const cls = status === 'Delivered' || status === 'Verified' || status === 'Excellent' ? 'success' : status === 'Delayed' || status === 'Rejected' || status === 'Payment overdue' ? 'danger' : status.includes('Pending') || status === 'Docs risk' ? 'warning' : 'info';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function App() {
  const [page, setPage] = useState('Dashboard');
  const [loggedIn, setLoggedIn] = useState(false);
  const [query, setQuery] = useState('');

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} onLogout={() => setLoggedIn(false)} />
    <main className="main-panel">
      <Topbar page={page} query={query} setQuery={setQuery} />
      <div className="page-wrap"><PageRouter page={page} setPage={setPage} query={query} /></div>
    </main>
  </div>;
}

function LoginScreen({ onLogin }) {
  return <div className="login-page">
    <div className="login-card">
      <div className="brand-mark"><Plane size={30}/></div>
      <h1>ORBEM Operations</h1>
      <p>Air cargo command center for bookings, shipments, documents, revenue and alerts.</p>
      <label>Email</label><input defaultValue="admin@orbem.in" />
      <label>Password</label><input type="password" defaultValue="password" />
      <button onClick={onLogin} className="primary full">Login to Dashboard</button>
      <div className="login-meta"><ShieldCheck size={16}/> JWT protected admin access</div>
    </div>
    <div className="login-visual">
      <span>HYD</span><div className="flight-line"><Plane /></div><span>DXB</span>
    </div>
  </div>;
}

function Sidebar({ page, setPage, onLogout }) {
  return <aside className="sidebar">
    <div className="sidebar-logo"><div className="logo-box"><Plane size={22}/></div><div><b>ORBEM</b><span>Air Cargo Ops</span></div></div>
    {navGroups.map(group => <div key={group.title} className="nav-group"><p>{group.title}</p>{group.items.map(([name, Icon]) => <button key={name} onClick={() => setPage(name)} className={page === name ? 'active' : ''}><Icon size={18}/><span>{name}</span>{name === 'Alerts' && <em>4</em>}</button>)}</div>)}
    <div className="side-profile"><div className="avatar">KB</div><div><b>Bala Manjunath</b><span>Admin Manager</span></div><button onClick={onLogout}><LogOut size={17}/></button></div>
  </aside>;
}

function Topbar({ page, query, setQuery }) {
  return <header className="topbar">
    <div><p>ORBEM Solutions Private Limited</p><h2>{page}</h2></div>
    <div className="top-actions"><div className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search AWB, customer, route..." /></div><button className="ghost"><Bell size={18}/></button><button className="primary"><Plus size={18}/> New Booking</button></div>
  </header>;
}

function PageRouter({ page, setPage, query }) {
  const map = {
    Dashboard: <Dashboard setPage={setPage}/>, Bookings: <Bookings query={query}/>, Shipments: <Shipments/>, Documents: <Documents/>, Revenue: <Revenue/>, Customers: <Customers/>, Staff: <Staff/>, 'Rate Manager': <Rates/>, Alerts: <Alerts/>, Reports: <Reports/>, Assistant: <AssistantPanel/>, Profile: <Profile/>, Settings: <SettingsPage/>
  };
  return map[page] || <Dashboard setPage={setPage}/>;
}

function Dashboard({ setPage }) {
  return <>
    <div className="kpi-grid">
      <Kpi icon={PackageCheck} title="Active Shipments" value="128" trend="+12%" text="34 moving today" />
      <Kpi icon={FileWarning} title="Pending Documents" value="19" trend="-8%" text="6 urgent checks" warn />
      <Kpi icon={IndianRupee} title="Monthly Revenue" value="₹12.6L" trend="+18%" text="₹1.7L overdue" />
      <Kpi icon={Users} title="Customers" value="64" trend="+5" text="12 high value" />
    </div>
    <div className="dashboard-grid">
      <Card title="Revenue & Overdue Trend" action="Export"><ChartRevenue /></Card>
      <Card title="Shipment Status" action="View all"><StatusPie /></Card>
      <Card title="Recent Bookings" className="wide" action="Open"><BookingTable compact setPage={setPage}/></Card>
      <Card title="Alert Center" action="Check now"><AlertList /></Card>
    </div>
  </>;
}

function Kpi({ icon: Icon, title, value, trend, text, warn }) { return <div className={`kpi ${warn ? 'warn' : ''}`}><div><span><Icon size={21}/></span><p>{title}</p><h3>{value}</h3><small>{text}</small></div><em>{trend}</em></div>; }
function Card({ title, action, children, className='' }) { return <section className={`card ${className}`}><div className="card-head"><h3>{title}</h3><button>{action}<ChevronRight size={15}/></button></div>{children}</section>; }
function ChartRevenue() { return <div className="chart"><ResponsiveContainer><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="revenue" radius={[8,8,0,0]}/><Bar dataKey="overdue" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>; }
function StatusPie() { return <div className="pie-wrap"><ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={4}>{statusData.map(s => <Cell key={s.name} fill={s.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="legend">{statusData.map(s => <p key={s.name}><i style={{background:s.color}}/> {s.name} <b>{s.value}%</b></p>)}</div></div>; }

function BookingTable({ compact, setPage, query='' }) {
  const rows = bookings.filter(b => JSON.stringify(b).toLowerCase().includes(query.toLowerCase()));
  return <div className="table-wrap"><table><thead><tr><th>AWB</th><th>Customer</th><th>Route</th><th>Cargo</th><th>Weight</th><th>Status</th><th>Revenue</th><th>Owner</th><th></th></tr></thead><tbody>{rows.map(b => <tr key={b.awb}><td className="mono">{b.awb}</td><td>{b.customer}</td><td><span className="route-tag">{b.route}</span></td><td>{b.cargo}</td><td>{b.weight}</td><td><StatusBadge status={b.status}/></td><td>{b.revenue}</td><td>{b.owner}</td><td><button onClick={() => setPage?.('Shipments')} className="icon-btn"><Eye size={16}/></button></td></tr>)}</tbody></table>{compact && <button className="table-cta" onClick={() => setPage('Bookings')}>View full booking list</button>}</div>;
}

function Bookings({ query }) { return <><Toolbar title="Booking Operations" /><Card title="All Bookings" action="Create"><BookingTable query={query}/></Card></>; }
function Shipments() { return <div className="split-grid"><Card title="Shipment Timeline" action="Update"><Timeline /></Card><Card title="Shipment Detail" action="Print"><DetailPanel /></Card></div>; }
function Documents() { return <><Toolbar title="Document Checklist" /><Card title="Pending / Received / Verified Documents" action="Upload"><SimpleTable headers={['Document','AWB','Status','Customer']} rows={docs}/></Card></>; }
function Revenue() { return <div className="dashboard-grid"><Card title="Revenue Overview" className="wide" action="CSV"><ChartRevenue /></Card><Card title="Payment Follow-ups" action="Remind"><AlertList money /></Card></div>; }
function Customers() { return <><Toolbar title="Customer Business" /><Card title="Customer Accounts" action="Add"><SimpleTable headers={['Customer','Revenue','Shipments','Health']} rows={customers}/></Card></>; }
function Staff() { return <><Toolbar title="Staff Ownership" /><Card title="Team Workload" action="Assign"><SimpleTable headers={['Name','Role','Open Tasks','SLA']} rows={staff}/></Card></>; }
function Rates() { return <div className="dashboard-grid"><Card title="Airline Rate Manager" className="wide" action="Import CSV"><SimpleTable headers={['Airline','Route','Rate / kg','Transit','Best For']} rows={[[ 'Emirates','HYD → DXB','₹310','2 days','Fastest'],['Qatar Cargo','BLR → FRA','₹365','3 days','Pharma'],['Singapore Air','MAA → SIN','₹280','2 days','Textiles'],['Lufthansa','DEL → FRA','₹390','4 days','Heavy cargo']]}/></Card><Card title="Cheapest Route Finder" action="Compare"><div className="mini-form"><input placeholder="Origin" defaultValue="HYD"/><input placeholder="Destination" defaultValue="DXB"/><input placeholder="Weight" defaultValue="420 kg"/><button className="primary full">Find Best Rate</button></div></Card></div>; }
function Alerts() { return <><Toolbar title="Alerts & Notifications" /><Card title="Operational Alerts" action="Run Check"><AlertList /></Card></>; }
function Reports() { return <div className="dashboard-grid"><Card title="Monthly Report" className="wide" action="Download PDF"><ChartRevenue /></Card><Card title="Report Cards" action="Export"><div className="report-cards"><Kpi icon={CheckCircle2} title="Success Rate" value="91%" trend="+4%" text="Delivered on time"/><Kpi icon={Clock3} title="Avg Delay" value="7.4h" trend="-2h" text="Improved this month"/></div></Card></div>; }

function Toolbar({ title }) { return <div className="toolbar"><h3>{title}</h3><div><button className="ghost"><Filter size={17}/> Filter</button><button className="ghost"><Download size={17}/> Export</button><button className="primary"><Plus size={17}/> Add New</button></div></div>; }
function SimpleTable({ headers, rows }) { return <div className="table-wrap"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th>Action</th></tr></thead><tbody>{rows.map((r,i) => <tr key={i}>{r.map((c,j) => <td key={j}>{j===2 || j===3 ? <StatusBadge status={String(c)}/> : c}</td>)}<td><button className="icon-btn"><MoreHorizontal size={16}/></button></td></tr>)}</tbody></table></div>; }
function AlertList({ money }) { const list = money ? alerts.filter(a => a.text.includes('₹')) : alerts; return <div className="alerts-list">{list.map(a => <div className={`alert-item ${a.level}`} key={a.text}><AlertTriangle size={19}/><div><b>{a.type}</b><p>{a.text}</p><small>{a.time}</small></div></div>)}</div>; }
function Timeline() { const steps=['Booking created','Documents received','Customs clearance','Flight departed','Arrived at destination','Delivered']; return <div className="timeline">{steps.map((s,i)=><div className={i<4?'done':''} key={s}><span>{i<4?<CheckCircle2 size={16}/>:<Clock3 size={16}/>}</span><div><b>{s}</b><p>{i<4?'Completed':'Pending update'}</p></div></div>)}</div>; }
function DetailPanel() { return <div className="detail-panel"><h2 className="mono">ORB-7842-IND</h2><p>Vistara Pharma Exports · Pharma cold chain</p><div className="info-grid"><span><MapPin/> HYD → DXB</span><span><CalendarClock/> ETA 18 Jun</span><span><PackageCheck/> 428 kg</span><span><IndianRupee/> ₹1,84,500</span></div><button className="primary full"><Save size={17}/> Save Update</button></div>; }

function AssistantPanel() { const [messages,setMessages]=useState(['Show delayed shipments','Draft payment reminder for overdue customers']); return <div className="assistant-page"><Card title="ORBEM Ops Assistant" action="Rule + AI"><div className="chat-box">{messages.map((m,i)=><div className={i%2?'bot-msg':'user-msg'} key={m}>{m}</div>)}<div className="chat-input"><input placeholder="Ask about revenue, documents, delays..."/><button onClick={()=>setMessages([...messages,'Checking current operations data...'])}><Send size={17}/></button></div></div></Card><Card title="Suggested Prompts" action="Use"><div className="prompt-list"><button>Which shipments are delayed today?</button><button>Generate pending document report</button><button>Find cheapest route HYD to DXB</button><button>Send one-day deadline alerts</button></div></Card></div>; }
function Profile() { return <div className="profile-grid"><Card title="Profile" action="Edit"><div className="profile-card"><div className="big-avatar">KB<Camera size={18}/></div><h2>Kariveti Bala Manjunath</h2><p>Admin Manager · ORBEM Operations</p><input defaultValue="Kariveti Bala Manjunath"/><input defaultValue="balamanjunath.kariveti@gmail.com"/><input defaultValue="Bhongir, Hyderabad"/><button className="primary full"><Edit3 size={17}/> Save Profile</button></div></Card><Card title="Security" action="Manage"><div className="settings-list"><Row icon={Lock} title="Password" text="Last changed recently"/><Row icon={Mail} title="Email OTP" text="Enabled for login"/><Row icon={Phone} title="Phone alerts" text="Ready for integration"/></div></Card></div>; }
function SettingsPage() { const sections=[[UserCircle,'Account','Name, photo, email, role'],[MessageCircle,'Notifications','Email alerts, deadline reminders'],[Palette,'Appearance','Theme, sidebar, density'],[ShieldCheck,'Privacy & Security','Password, JWT sessions, OTP'],[Database,'Data & Backup','CSV import/export, database backup'],[Activity,'Automation','Cron alerts and SLA checks'],[Bot,'Assistant','Gemini/Ollama/rule-based mode']]; return <div className="settings-page"><div className="phone-settings"><div className="phone-head"><div className="avatar">KB</div><div><b>Bala Manjunath</b><p>Admin Manager</p></div></div>{sections.map(([Icon,t,d])=><Row key={t} icon={Icon} title={t} text={d}/>)}</div><Card title="Selected Setting" action="Save"><div className="setting-detail"><h2>WhatsApp-style Settings</h2><p>Clean account sections, easy toggles, profile management, notification preferences and security controls.</p><label><input type="checkbox" defaultChecked/> Email deadline alerts</label><label><input type="checkbox" defaultChecked/> Overdue payment reminders</label><label><input type="checkbox"/> Compact table mode</label><button className="primary"><Save size={17}/> Save Settings</button></div></Card></div>; }
function Row({ icon:Icon,title,text }) { return <div className="setting-row"><Icon size={20}/><div><b>{title}</b><p>{text}</p></div><ChevronRight size={17}/></div>; }

export default App;
