import React,{useState,useEffect,useCallback,createContext,useContext}from'react';import{Routes,Route,Link,useLocation}from'react-router-dom';import{LayoutDashboard,Phone,Users,BarChart3,Menu,X,Globe,Sun,Moon}from'lucide-react';import{t,locales}from'./i18n';import{getTheme}from'./theme';import Dashboard from'./pages/Dashboard';import Calls from'./pages/Calls';import CallDetail from'./pages/CallDetail';import Leads from'./pages/Leads';import Analytics from'./pages/Analytics';

export const ThemeContext=createContext('light');

export default function App(){
const[locale,setLocale]=useState(()=>{try{return localStorage.getItem('app-locale')||'en'}catch{return'en'}});
const[themeMode,setThemeMode]=useState(()=>{try{return localStorage.getItem('app-theme')||'dark'}catch{return'dark'}});
const[so,setSo]=useState(false);const loc=useLocation();
const T=useCallback(k=>t(locale,k),[locale]);
const th=getTheme(themeMode);

useEffect(()=>{try{localStorage.setItem('app-locale',locale)}catch{}},[locale]);
useEffect(()=>{try{localStorage.setItem('app-theme',themeMode)}catch{}},[themeMode]);
useEffect(()=>{setSo(false)},[loc.pathname]);

const act=p=>p==='/'?loc.pathname==='/':loc.pathname.startsWith(p);
const navItems=[{path:'/',icon:LayoutDashboard,label:T('dashboard')},{path:'/calls',icon:Phone,label:T('calls')},{path:'/leads',icon:Users,label:T('leads')},{path:'/analytics',icon:BarChart3,label:T('analytics')}];
const isDark=themeMode==='dark';

return(<ThemeContext.Provider value={themeMode}>
<div style={{display:'flex',height:'100vh',overflow:'hidden',background:th.bg}}>
{so&&<div style={{position:'fixed',inset:0,zIndex:40,background:th.overlay}}onClick={()=>setSo(false)}/>}
<aside style={{position:'fixed',top:0,left:0,bottom:0,zIndex:50,width:250,background:th.sidebar,borderRight:`1px solid ${th.sidebarBorder}`,display:'flex',flexDirection:'column',transform:so?'translateX(0)':'translateX(-100%)',transition:'transform .25s',boxShadow:isDark?'2px 0 30px rgba(0,0,0,.5)':'2px 0 20px rgba(0,0,0,.06)'}}>
<div style={{padding:'20px',borderBottom:`1px solid ${th.sidebarBorder}`}}>
<div style={{display:'flex',alignItems:'center',gap:10}}>
<div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg, #2563eb, #7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:'#fff',boxShadow:'0 4px 15px rgba(37,99,235,.35)'}}>&#9733;</div>
<h1 style={{fontSize:16,fontWeight:700,margin:0,background:'linear-gradient(90deg, #2563eb, #8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{T('appName')}</h1>
</div></div>
<nav style={{flex:1,padding:'12px 10px'}}>{navItems.map(i=>{const a=act(i.path);return(<Link key={i.path}to={i.path}style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,fontSize:14,fontWeight:500,textDecoration:'none',marginBottom:3,transition:'all .15s',background:a?(isDark?'rgba(37,99,235,.1)':'#eff6ff'):'transparent',color:a?th.accent:th.textMuted,border:a?`1px solid ${isDark?'rgba(37,99,235,.25)':'#bfdbfe'}`:'1px solid transparent'}}><i.icon size={18}/>{i.label}</Link>)})}</nav>
<div style={{padding:'12px 10px 10px',borderTop:`1px solid ${th.sidebarBorder}`,margin:'0 8px'}}>
<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><Globe size={15}color={th.textMuted}/>
<select value={locale}onChange={e=>setLocale(e.target.value)}style={{flex:1,background:th.inputBg,border:`1px solid ${th.inputBorder}`,borderRadius:8,padding:'7px 10px',fontSize:13,color:th.text,outline:'none',cursor:'pointer'}}>{locales.map(l=><option key={l.code}value={l.code}style={{background:th.surface,color:th.text}}>{l.nativeLabel}</option>)}</select></div>
<button onClick={()=>setThemeMode(isDark?'light':'dark')}style={{width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:10,border:`1px solid ${th.inputBorder}`,background:th.inputBg,color:th.textSecondary,cursor:'pointer',fontSize:13,fontWeight:500,transition:'all .15s'}}onMouseEnter={e=>e.currentTarget.style.background=th.surfaceHover}onMouseLeave={e=>e.currentTarget.style.background=th.inputBg}>
{isDark?<><Sun size={15}color={th.amber}/>Light Mode</>:<><Moon size={15}color={th.violet}/>Dark Mode</>}</button></div></aside>

<main style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
<header style={{height:56,borderBottom:`1px solid ${th.sidebarBorder}`,display:'flex',alignItems:'center',padding:'0 20px',gap:12,background:th.header}}>
<button onClick={()=>setSo(!so)}style={{padding:8,borderRadius:8,background:'transparent',border:'none',color:th.textMuted,cursor:'pointer',display:'flex'}}>{so?<X size={20}/>:<Menu size={20}/>}</button>
<div style={{flex:1}}/>
<div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 12px',borderRadius:20,background:isDark?'rgba(52,211,153,.1)':'#ecfdf5',border:`1px solid ${isDark?'rgba(52,211,153,.25)':'#a7f3d0'}`}}>
<span style={{width:7,height:7,borderRadius:'50%',background:th.teal,boxShadow:`0 0 8px ${th.teal}80`,animation:'pulse 2s infinite'}}/>
<span style={{fontSize:12,color:isDark?'#34d399':'#059669',fontWeight:500}}>2 active calls</span></div></header>

<div style={{flex:1,overflow:'auto',padding:'24px 20px'}}>
<Routes>
<Route path="/"element={<Dashboard T={T}theme={th}/>}/>
<Route path="/calls"element={<Calls T={T}theme={th}/>}/>
<Route path="/calls/:id"element={<CallDetail T={T}theme={th}/>}/>
<Route path="/leads"element={<Leads T={T}theme={th}/>}/>
<Route path="/analytics"element={<Analytics T={T}theme={th}/>}/>
</Routes></div></main></div></ThemeContext.Provider>)}