import*as D from"https://esm.sh/react@18";import V from"https://esm.sh/react@18";import{createRoot as J}from"https://esm.sh/react-dom@18/client";import{v4 as M}from"https://esm.sh/uuid@9";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function o(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerPolicy&&(a.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?a.credentials="include":e.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(e){if(e.ep)return;e.ep=!0;const a=o(e);fetch(e.href,a)}})();const{useState:w,useEffect:T,useMemo:B,useCallback:S}=D;function Y(i=""){return`You are a build system that outputs ONLY strict JSON. No prose. No markdown. The JSON must parse directly with JSON.parse().

Analyze the following React application code (single-file JSX). Identify any CDN scripts needed to run it inside a non-module Babel sandbox with global variables. Also provide any JS bindings needed to map imports to window globals.

Return a JSON object with exactly these keys:
{
  "scripts": [
    { "url": "https://...", "global": "GlobalNameIfAnyOrNull", "critical": false }
  ],
  "bindings": "const { motion, AnimatePresence } = window; ..."
}

Rules:
- Include React and ReactDOM only if missing (the host usually injects them) but it's safe to duplicate.
- Prefer UMD builds from unpkg/jsdelivr for React, ReactDOM, Axios, Recharts, Framer Motion, Marked, PropTypes, Lucide React.
- Never include npm or node-only packages; use browser CDNs only.
- "bindings" must be plain JavaScript statements (no backticks), safe to prepend before the user's code to create globals.
- Do NOT include comments in the JSON or the JS string.

Here is the code to analyze:
<CODE>
${String(i||"").slice(0,14e3)}
</CODE>`}const O=[{id:"llama-3.1-70b-versatile",label:"Llama 3.1 70B · General Purpose"},{id:"llama-3.1-8b-instant",label:"Llama 3.1 8B · Fast Drafts"},{id:"mixtral-8x7b-32768",label:"Mixtral 8x7B · Creative"},{id:"mixtral-8x22b-32768",label:"Mixtral 8x22B · High Fidelity"},{id:"gemma-7b-it",label:"Gemma 7B · Instruction Tuned"}];function z(i=""){return i?i.replace(/[-_]/g," ").split(" ").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" "):"Unknown Model"}class W{constructor(){this.apiKey=null,this.baseUrl="https://api.groq.com/openai/v1",this.modelCache=O}async generatePreviewManifestStrict(t,o="llama-3.1-70b-versatile"){var e,a,n,l,u;if(!this.apiKey)throw new Error("Groq API key not configured");const s=Y(t||"");try{const c=await fetch(`${this.baseUrl}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:o,messages:[{role:"system",content:"You output STRICT JSON only. No prose, no markdown. JSON must parse with JSON.parse() without modifications."},{role:"user",content:s}],temperature:0,max_tokens:800,stream:!1})});if(!c.ok){let k="";try{const f=await c.json();k=((e=f==null?void 0:f.error)==null?void 0:e.message)||(f==null?void 0:f.message)||""}catch{k=c.statusText}throw new Error(`Groq API error (${c.status}): ${k||"Unexpected response"}`)}const b=(u=(l=(n=(a=(await c.json()).choices)==null?void 0:a[0])==null?void 0:n.message)==null?void 0:l.content)==null?void 0:u.trim();if(!b)throw new Error("No manifest content returned");let d=null;try{d=JSON.parse(b)}catch{const f=b.indexOf("{"),E=b.lastIndexOf("}");if(f>=0&&E>f){const R=b.slice(f,E+1);d=JSON.parse(R)}else throw new Error("Manifest was not valid JSON")}if(d&&typeof d=="object")return Array.isArray(d.scripts)||(d.scripts=[]),typeof d.bindings!="string"&&(d.bindings=""),d;throw new Error("Invalid manifest structure")}catch(c){throw console.error("Groq preview manifest error:",c),c}}setApiKey(t){this.apiKey=t}getApiKey(){return this.apiKey}getAvailableModels(){return this.modelCache}async refreshModels(){if(!this.apiKey)return this.modelCache;try{const t=await fetch(`${this.baseUrl}/models`,{method:"GET",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"}});if(!t.ok)throw new Error(`Groq model list error (${t.status}): ${t.statusText}`);const o=await t.json(),s=Array.isArray(o==null?void 0:o.data)?o.data.filter(e=>!(!(e!=null&&e.id)||e!=null&&e.type&&e.type!=="chat.completions"||e!=null&&e.capabilities&&!e.capabilities.includes("chat.completions"))).map(e=>({id:e.id,label:e.display_name||z(e.id)})):[];s.length?this.modelCache=s:(console.warn("Groq returned no chat-capable models; using fallback list."),this.modelCache=O)}catch(t){console.error("Failed to refresh Groq models:",t),this.modelCache=O}return this.modelCache}async generateCode(t,o="llama-3.1-70b-versatile"){var s,e,a;if(!this.apiKey)throw new Error("Groq API key not configured");try{const n=await fetch(`${this.baseUrl}/chat/completions`,{method:"POST",headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({model:o,messages:[{role:"system",content:"You are an elite React developer. Output ONLY working React JSX code. No explanations, no markdown, no comments outside the code. The code must be immediately executable in a browser."},{role:"user",content:t}],temperature:.3,max_tokens:4e3,stream:!1})});if(!n.ok){let c="";try{const m=await n.json();c=((s=m==null?void 0:m.error)==null?void 0:s.message)||(m==null?void 0:m.message)||""}catch{c=n.statusText}throw new Error(`Groq API error (${n.status}): ${c||"Unexpected response"}`)}const u=(a=(e=(await n.json()).choices[0])==null?void 0:e.message)==null?void 0:a.content;if(!u)throw new Error("No code generated from Groq API");return this.sanitizeCode(u)}catch(n){throw console.error("Groq generation error:",n),n}}sanitizeCode(t){let o=t.replace(/```jsx?\n?/g,"").replace(/```\n?/g,"");const s=o.split(`
`);let e=0,a=s.length-1;for(let n=0;n<s.length;n++)if(s[n].trim().match(/^(import|export|function|const|class)/)){e=n;break}for(let n=s.length-1;n>=0;n--)if(s[n].trim()&&!s[n].trim().startsWith("//")){a=n;break}if(o=s.slice(e,a+1).join(`
`),!o.includes("export default")){const n=o.match(/function\s+(\w+)/);n&&(o+=`

export default ${n[1]};`)}return o.trim()}validateCode(t){if(!t||!/export\s+default/.test(t))return!1;const s=/(function\s+\w+\s*\(|const\s+\w+\s*=\s*\(?\s*\w*\s*=>)/,e=/<\w+[\s>]/;return s.test(t)||e.test(t)}}const A=new W;class H{constructor(){this.storageKey="morphic-web-versions",this.currentAppKey="morphic-web-current"}saveVersion(t){const o=this.getAllVersions(),s={id:M(),timestamp:Date.now(),appIdea:t.appIdea,model:t.model,template:t.template,code:t.code,prompt:t.prompt,isWorking:t.isWorking??!0};return o.unshift(s),o.length>50&&o.splice(50),localStorage.setItem(this.storageKey,JSON.stringify(o)),this.setCurrentApp(s),s}getAllVersions(){try{const t=localStorage.getItem(this.storageKey);return t?JSON.parse(t):[]}catch(t){return console.error("Error loading versions:",t),[]}}getVersion(t){return this.getAllVersions().find(s=>s.id===t)}deleteVersion(t){const s=this.getAllVersions().filter(e=>e.id!==t);return localStorage.setItem(this.storageKey,JSON.stringify(s)),s}setCurrentApp(t){localStorage.setItem(this.currentAppKey,JSON.stringify(t))}getCurrentApp(){try{const t=localStorage.getItem(this.currentAppKey);return t?JSON.parse(t):null}catch(t){return console.error("Error loading current app:",t),null}}clearCurrentApp(){localStorage.removeItem(this.currentAppKey)}updateVersion(t,o={}){try{const s=this.getAllVersions(),e=s.findIndex(l=>l.id===t);if(e===-1)return null;const a={...s[e],...o||{}};s[e]=a,localStorage.setItem(this.storageKey,JSON.stringify(s));const n=this.getCurrentApp();return n&&n.id===t&&this.setCurrentApp(a),a}catch(s){return console.error("updateVersion error:",s),null}}exportVersion(t){const o=this.getVersion(t);if(!o)return null;const s={...o,exportedAt:Date.now(),exportedBy:"Morphic Web"},e=new Blob([JSON.stringify(s,null,2)],{type:"application/json"}),a=URL.createObjectURL(e),n=document.createElement("a");return n.href=a,n.download=`morphic-app-${o.appIdea.slice(0,20).replace(/[^a-zA-Z0-9]/g,"-")}-${Date.now()}.json`,n.click(),URL.revokeObjectURL(a),s}importVersion(t){return new Promise((o,s)=>{const e=new FileReader;e.onload=a=>{try{const l={...JSON.parse(a.target.result),id:M(),timestamp:Date.now(),imported:!0},u=this.getAllVersions();u.unshift(l),localStorage.setItem(this.storageKey,JSON.stringify(u)),o(l)}catch{s(new Error("Invalid file format"))}},e.onerror=()=>s(new Error("File read error")),e.readAsText(t)})}getVersionStats(){var e;const t=this.getAllVersions(),o={},s={};return t.forEach(a=>{o[a.model]=(o[a.model]||0)+1,s[a.template]=(s[a.template]||0)+1}),{total:t.length,models:o,templates:s,lastGenerated:((e=t[0])==null?void 0:e.timestamp)||null}}}const x=new H,Q={base:{name:"Basic App",template:`Create a React app: {APP_IDEA}

STRICT RULES:
- Use React hooks, no class components
- Include all imports at top
- Make it responsive and beautiful
- Single functional component export
- Browser-compatible
- Output ONLY working React JSX code (no markdown or commentary).
- Provide complete state, handlers, and sample data so the app runs instantly in the browser.
- Never prompt the user for API keys. The environment already supplies one.
- If AI features are needed, declare const GROQ_API_KEY = '{API_KEY}' once and reuse it.
- When the experience requires AI, call Groq's REST API with model '{MODEL_ID}' using the authorization header Bearer \${GROQ_API_KEY}.
- Do not expose or log the API key.
- Automatically include AI capabilities when the app idea suggests it (chatbots, recommendations, analysis, etc.).
- For AI chatbots, ensure proper error handling and loading states for API calls.
{AI_FEATURES}

Return complete working code:`},aiChat:{name:"AI Chat App",template:`Create React chat app: {APP_IDEA}

REQUIREMENTS:
- Working React JSX only
- Use useState, useEffect hooks
- Groq API integration with key: {API_KEY}
- Chat interface with messages
- Send/receive functionality
- Tailwind CSS styling
- Mobile responsive
{AI_FEATURES}

API endpoint available: /api/groq/chat
Return complete code:`},dashboard:{name:"Dashboard App",template:`Create React dashboard: {APP_IDEA}

SPECS:
- Modern dashboard layout
- Charts/graphs if needed
- Sidebar navigation
- Responsive grid system
- Tailwind CSS + Lucide icons
- Working React hooks
- No external data calls
{AI_FEATURES}

Output working JSX:`},game:{name:"Interactive Game",template:`Create React game: {APP_IDEA}

GAME RULES:
- Interactive gameplay
- Score tracking
- Game state management
- Keyboard/mouse controls
- Animated elements
- Tailwind CSS styling
- React hooks only
{AI_FEATURES}

Return playable code:`},utility:{name:"Utility Tool",template:`Create React utility: {APP_IDEA}

UTILITY SPECS:
- Functional tool interface
- Input/output handling
- Real-time calculations
- Clean, minimal design
- Form validation
- Tailwind CSS
- React hooks
{AI_FEATURES}

Output working tool:`}},X=`
GROQ USAGE NOTES:
- Wire helper functions that call https://api.groq.com/openai/v1/chat/completions.
- Use fetch with headers { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${GROQ_API_KEY}\` }.
- Send the selected model '{MODEL_ID}' alongside any messages payload.
- Guard calls with loading and error states and only invoke them when the user workflow requires AI.
- Never request or display the API key to the user.
- Example fetch call:
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${GROQ_API_KEY}\`
    },
    body: JSON.stringify({
      model: '{MODEL_ID}',
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7
    })
  });
`,Z=`
import React, { useState } from 'react';

export default function FallbackApp() {
  const [message, setMessage] = useState('App generation failed - using fallback');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generation Error</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
`;function ee(i,t,o={}){const s=typeof o=="boolean"?{includeAI:o}:o??{},{apiKey:e="",modelId:a="",includeAI:n=!0}=s;let l=i.replace("{APP_IDEA}",t);return l=l.replace("{API_KEY}",e||"[[GROQ_API_KEY]]"),l=l.replace("{MODEL_ID}",a||"groq-model"),l=l.replace("{AI_FEATURES}",n?X:""),l}const G={react:{url:"https://unpkg.com/react@18/umd/react.development.js",global:"React",critical:!0},"react-dom":{url:"https://unpkg.com/react-dom@18/umd/react-dom.development.js",global:"ReactDOM",critical:!0},"framer-motion":{url:"https://unpkg.com/framer-motion@11/dist/framer-motion.js",global:"FramerMotion"},"lucide-react":{url:"https://unpkg.com/lucide-react@0.294.0/dist/umd/lucide-react.js",global:"LucideReact"},recharts:{url:"https://unpkg.com/recharts@2.8.0/umd/Recharts.js",global:"Recharts"},axios:{url:"https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js",global:"axios"},marked:{url:"https://unpkg.com/marked@9.1.2/marked.min.js",global:"marked"},"prop-types":{url:"https://unpkg.com/prop-types@15.8.1/prop-types.min.js",global:"PropTypes"}};function te(i){const t=new Set,o=[];for(const s of i){if(!s||!s.url)continue;const e=s.url;t.has(e)||(t.add(e),o.push(s))}return o}function re(i=""){const t={react:[/\bReact\b/,/from\s+['"]react['"]/],"react-dom":[/\bReactDOM\b/,/from\s+['"]react-dom['"]/],"framer-motion":[/from\s+['"]framer-motion['"\)]/,/\bmotion\./,/\bAnimatePresence\b/],"lucide-react":[/from\s+['"]lucide-react['"\)]/,/<\s*Lucide[\s>]/],recharts:[/from\s+['"]recharts['"\)]/,/\b(LineChart|BarChart|PieChart|XAxis|YAxis|AreaChart|CartesianGrid|Tooltip|Legend|ResponsiveContainer)\b/],axios:[/from\s+['"]axios['"\)]/,/\baxios\./],marked:[/from\s+['"]marked['"\)]/,/\bmarked\./],"prop-types":[/from\s+['"]prop-types['"\)]/,/\bPropTypes\./]},o=new Set(["react","react-dom"]);for(const[e,a]of Object.entries(t))a.some(n=>n.test(i))&&o.add(e);const s=Array.from(i.matchAll(/from\s+['"](https?:\/\/[^'"\s]+)['"]/g)).map(e=>e[1]);return{packages:Array.from(o),cdnImports:s}}function oe(){return`const React = window.React;
const ReactDOM = window.ReactDOM;
const { useState, useEffect, useMemo, useCallback, useRef, Fragment, forwardRef, Component } = React || {};
const axios = window.axios;
const marked = window.marked;
const { motion, AnimatePresence } = window;
const Recharts = window.Recharts || {};
const PropTypes = window.PropTypes;
const LucideReact = window.LucideReact || window;
`}function se(i="",t=""){let o=String(i||"");o=o.replace(/^\s*import\s+[^;]+;?\s*$/gm,"");let s="";o=o.replace(/export\s+default\s+function\s+(\w+)\s*\(/,(n,l)=>(s=l,`function ${l}(`)),o=o.replace(/export\s+default\s+const\s+(\w+)\s*=\s*/g,(n,l)=>(s=l,`const ${l} = `)),o=o.replace(/export\s+default\s+class\s+(\w+)/,(n,l)=>(s=l,`class ${l}`)),o=o.replace(/export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/,(n,l)=>(s=s||l,"")),o=o.replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm,"");const e=t&&String(t).trim()||oe(),a=`

(function(){
  var __candidate = ${s||'typeof App !== "undefined" ? App : (typeof GeneratedApp !== "undefined" ? GeneratedApp : null)'};
  if (__candidate) { window.__APP_DEFAULT__ = __candidate; }
})();`;return`${e}

${o}
${a}`}function ae(){window.React||(window.React={createElement:(i,t,...o)=>({t:i,p:t,c:o}),forwardRef:i=>i,useState:i=>[i,()=>{}],useEffect:()=>{},useRef:()=>({current:null}),useMemo:i=>i(),useCallback:i=>i,Fragment:"fragment",Component:class{setState(){}}}),window.ReactDOM||(window.ReactDOM={createRoot:()=>({render:()=>{}})}),window.motion||(window.motion=new Proxy({},{get:(i,t)=>(o={})=>{const s=window.React&&window.React.createElement||((a,n,...l)=>({t:a,p:n,c:l})),e={...o};return delete e.initial,delete e.animate,delete e.exit,delete e.transition,delete e.variants,delete e.whileHover,delete e.whileTap,delete e.drag,delete e.dragConstraints,s(t,e,o&&o.children)}}),window.AnimatePresence||(window.AnimatePresence=({children:i})=>i||null)),window.Lucide||(window.Lucide=({name:i,className:t,...o})=>(window.React&&window.React.createElement||((e,a,...n)=>({t:e,p:a,c:n})))("span",{className:t,...o},i||"icon")),window.Recharts||(window.Recharts={}),["LineChart","BarChart","PieChart","AreaChart","Line","Bar","Pie","Area","XAxis","YAxis","CartesianGrid","Tooltip","Legend","ResponsiveContainer"].forEach(i=>{var t;(t=window.Recharts)[i]||(t[i]=()=>null)}),window.PropTypes||(window.PropTypes={oneOfType:()=>null,shape:()=>null,arrayOf:()=>null,string:null,number:null,bool:null,func:null,object:null,node:null})}function ne(i,t={}){const{manifest:o}=t,s=re(i||""),e=["react","react-dom"],a=[{url:"https://unpkg.com/@babel/standalone/babel.min.js"},{url:"https://cdn.tailwindcss.com"},...e.map(d=>({url:G[d].url}))],n=(s.packages||[]).filter(d=>!e.includes(d)).map(d=>G[d]&&{url:G[d].url}),l=(s.cdnImports||[]).map(d=>({url:d})),u=Array.isArray(o==null?void 0:o.scripts)?o.scripts:[],c=te([...u,...a,...n,...l].filter(Boolean)),m=(o==null?void 0:o.bindings)||"",b=se(i,m);return`<!DOCTYPE html><html><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Generated App Preview</title>
${c.map(d=>`<script src="${d.url}" crossorigin="anonymous"><\/script>`).join(`
`)}
<script>(${ae.toString()})()<\/script>
<style>
  html, body { height:100%; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #0b1020; color: #e2e8f0; }
  .error-boundary { padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; margin: 20px; color:#7c2d12; }
</style>
</head><body>
<div id="root"></div>
<script type="text/babel">
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  class ErrorBoundary extends React.Component {
    constructor(props){ super(props); this.state = { hasError:false, error:null }; }
    static getDerivedStateFromError(error){ return { hasError:true, error }; }
    componentDidCatch(error, info){ console.error('Preview Error:', error, info); }
    render(){ if (this.state.hasError){ return React.createElement('div', { className:'error-boundary' }, 'Preview Error: ' + (this.state.error?.message||'')); } return this.props.children; }
  }

  ${b}

  try {
    const Candidate = window.__APP_DEFAULT__ || window.App || window.GeneratedApp || (function DefaultApp(){ return React.createElement('div', { className:'p-8 text-center' }, 'App component not found'); });
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(ErrorBoundary, null, React.createElement(Candidate)));
    window.parent.postMessage({ type: 'preview-loaded', success: true }, '*');
  } catch (error) {
    console.error('Render error:', error);
    window.parent.postMessage({ type: 'preview-error', error: error?.message || String(error) }, '*');
  }
<\/script>
</body></html>`}const r=D.createElement,ie=["AI productivity hub with task insights and focus music","Mood-based recipe recommender with pantry inventory","Interactive workout planner with adaptive difficulty","Financial wellness dashboard with smart savings goals","AI storytelling studio with character memory","Habit tracker with celebratory streak animations"];function le(){const[i,t]=w("generate"),[o,s]=w(""),[e,a]=w(!1),[n,l]=w(""),u="base",[c,m]=w("llama-3.1-70b-versatile"),[b,d]=w(A.getAvailableModels()),k=!0,[f,E]=w(!1),[R,P]=w(""),[I,N]=w(null),[L,j]=w([]),y=S(()=>{j(x.getAllVersions())},[]);T(()=>{const p=localStorage.getItem("groq-api-key");p?(s(p),A.setApiKey(p)):a(!0);const g=x.getCurrentApp();g&&(N(g),t("preview")),y()},[y]),T(()=>{let p=!1;return(async()=>{const h=await A.refreshModels();if(p)return;d(h),!h.find(C=>C.id===c)&&h.length&&m(h[0].id)})(),()=>{p=!0}},[o]);const q=S(p=>{const g=p.trim();localStorage.setItem("groq-api-key",g),A.setApiKey(g),s(g),a(!1),A.refreshModels().then(h=>{d(h),!h.find(C=>C.id===c)&&h.length&&m(h[0].id)})},[]),K=S(async()=>{if(!n.trim()){P("Describe what you want Morphic Web to build.");return}if(!o){a(!0);return}const p=Q[u],g=ee(p.template,n,{apiKey:o,modelId:c,includeAI:k});E(!0),P("");try{const h=await A.generateCode(g,c),v={id:Date.now().toString(),appIdea:n,model:c,template:"base",code:h,prompt:g,timestamp:Date.now(),isWorking:!0};N(v),t("preview"),x.saveVersion(v),setTimeout(()=>y(),0)}catch(h){console.error(h);const v=(h==null?void 0:h.message)||"Generation failed.";if(P(v),/401|api key|unauthorized/i.test(v)){localStorage.removeItem("groq-api-key"),A.setApiKey(null),s(""),a(!0),N(null),t("generate");return}const _={id:Date.now().toString(),appIdea:`Fallback for: ${n}`,model:c,template:"fallback",code:Z,prompt:"Fallback shell because generation failed.",timestamp:Date.now(),isWorking:!1};N(_),t("preview"),x.saveVersion(_),setTimeout(()=>y(),0)}finally{E(!1)}},[n,o,c,y]),$=S(p=>{N(p),x.setCurrentApp(p),t("preview")},[]),F=S(p=>{x.deleteVersion(p),y();const g=x.getCurrentApp();g&&g.id===p&&(x.clearCurrentApp(),N(null),t("generate"))},[y]),U=S(p=>{x.exportVersion(p)},[]);return r("div",{className:"min-h-screen flex flex-col"},[r(ce,{activeView:i,setActiveView:t,generatedApp:I,onOpenSettings:()=>a(!0)}),r("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10"},[i==="generate"?r(de,{appIdea:n,onAppIdeaChange:l,modelKey:c,onModelChange:m,isGenerating:f,onGenerate:K,modelOptions:b,errorMessage:R,onUseExample:l}):null,i==="preview"&&I?r(ue,{app:I}):null,i==="code"&&I?r(me,{app:I}):null,i==="history"?r(he,{versions:L,onSelect:$,onDelete:F,onExport:U}):null]),e?r(fe,{apiKey:o,onSubmit:q,onClose:()=>a(!1)}):null,f?r(ge,null):null])}function ce({activeView:i,setActiveView:t,generatedApp:o,onOpenSettings:s}){const e=[{key:"generate",label:"Generate",icon:"✨"},{key:"preview",label:"Preview",icon:"▶",disabled:!o},{key:"code",label:"View Code",icon:"🧠",disabled:!o},{key:"history",label:"Versions",icon:"🗂"}];return r("header",{className:"border-b border-white/10 backdrop-blur bg-black/20"},[r("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"},[r("div",{className:"flex items-center gap-3"},[r("div",{className:"w-11 h-11 rounded-xl bg-gradient-to-r from-iris to-magenta flex items-center justify-center text-xl font-semibold shadow-lg"},"⚡"),r("div",null,[r("div",{className:"text-lg font-semibold leading-tight"},"Morphic Web"),r("p",{className:"text-sm text-white/70"},"Instant Groq-powered interface creation")])]),r("nav",{className:"flex flex-wrap gap-2"},e.map(a=>r("button",{key:a.key,disabled:a.disabled,onClick:()=>!a.disabled&&t(a.key),className:`px-4 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-medium ${i===a.key?"bg-white/20 text-white shadow-lg shadow-iris/30":a.disabled?"text-white/40 cursor-not-allowed border border-white/10":"text-white/80 hover:text-white hover:bg-white/15 border border-white/10"}`},[`${a.icon}`,a.label]))),r("button",{onClick:s,className:"ml-auto px-4 py-2 rounded-lg border border-white/15 text-sm bg-white/10 hover:bg-white/20 transition-colors shadow-sm flex items-center gap-2"},["⚙","Groq API"])])])}function de({appIdea:i,onAppIdeaChange:t,modelKey:o,onModelChange:s,isGenerating:e,onGenerate:a,modelOptions:n,errorMessage:l,onUseExample:u}){return r("section",{className:"bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-iris/20 backdrop-blur-lg p-8 space-y-8"},[r("div",{className:"text-center space-y-3"},[r("span",{className:"inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 text-2xl"},"🪄"),r("h1",{className:"text-3xl md:text-4xl font-bold tracking-tight"},"Describe your vision. Groq builds it instantly."),r("p",{className:"text-white/70 max-w-2xl mx-auto text-sm md:text-base"},"Combine Groq model excellence with Morphic Web prompt intelligence. Every submission becomes a polished, working React experience in seconds.")]),l?r("div",{className:"p-4 rounded-2xl border border-red-500/40 bg-red-500/15 text-sm text-red-100 flex items-center gap-3"},["⚠",l]):null,r("div",{className:"space-y-6"},[r("div",{className:"space-y-3"},[r("label",{className:"text-sm font-medium uppercase tracking-wide text-white/70"},"App concept"),r("textarea",{value:i,onChange:c=>t(c.target.value),placeholder:"Example: Build a travel companion that recommends destinations with AI summaries, packing lists, and budgeting tips based on user mood and time frame.",className:"w-full min-h-[150px] rounded-2xl bg-black/40 border border-white/10 px-5 py-4 text-sm md:text-base leading-relaxed text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-iris/60 focus:border-white/10 shadow-inner"})]),r("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4"},[r(pe,{label:"Groq model",value:o,onChange:s,options:(Array.isArray(n)&&n.length?n:[{id:o,label:o}]).map(c=>({value:c.id,label:c.label}))}),r("div",{className:"space-y-2 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70"},[r("h3",{className:"text-sm font-semibold text-white"},"Automatic AI usage"),r("p",null,"Groq decides when to call its APIs. Generated apps automatically receive the secure GROQ_API_KEY without prompting end users."),r("p",null,"Feel free to request any AI behaviors in your prompt—Groq has the context it needs.")])]),r("div",{className:"space-y-2"},[r("h3",{className:"text-sm font-medium uppercase tracking-wide text-white/60"},"Need a spark?"),r("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-3"},ie.map((c,m)=>r("button",{key:`idea-${m}`,onClick:()=>u(c),className:"text-left rounded-2xl border border-white/10 bg-black/25 hover:bg-white/10 px-4 py-3 text-sm text-white/70 hover:text-white transition-all"},["→ ",c])))])]),r("div",null,[r("button",{onClick:a,disabled:e,className:"w-full md:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-iris to-magenta text-white font-semibold text-base shadow-lg shadow-magenta/30 hover:shadow-xl hover:shadow-magenta/40 transition-transform transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"},[e?"Generating with Groq…":"Generate Application"])])])}function pe({label:i,value:t,onChange:o,options:s}){return r("div",{className:"space-y-3"},[r("span",{className:"text-sm font-medium uppercase tracking-wide text-white/70 block"},i),r("select",{value:t,onChange:e=>o(e.target.value),className:"w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-iris/60"},s.map(e=>r("option",{key:e.value,value:e.value},e.label)))])}function ue({app:i}){const t=B(()=>we(i.code),[i.code]);return r("section",{className:"bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20"},[r("div",{className:"flex items-center justify-between px-6 py-4 border-b border-white/10"},[r("div",null,[r("h2",{className:"text-xl font-semibold"},"Live Preview"),r("p",{className:"text-white/60 text-sm"},`${i.appIdea}`)]),r("div",{className:"flex items-center gap-3 text-xs text-white/60"},[r("span",null,i.model),r("span",null,"•"),r("span",null,i.template)])]),r("div",{className:"relative h-[70vh]"},[r("iframe",{srcDoc:t,className:"absolute inset-0 w-full h-full rounded-b-3xl border-0 bg-white",sandbox:"allow-scripts allow-forms allow-same-origin",title:"Generated application preview"})])])}function me({app:i}){const t=()=>{navigator.clipboard.writeText(i.code)};return r("section",{className:"bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20 overflow-hidden"},[r("div",{className:"flex items-center justify-between px-6 py-4 border-b border-white/10"},[r("div",null,[r("h2",{className:"text-xl font-semibold"},"Generated Code"),r("p",{className:"text-xs text-white/60"},"Fully sanitized Groq output ready to run in browser")]),r("button",{onClick:t,className:"px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs tracking-wide"},"Copy code")]),r("div",{className:"bg-black/70 max-h-[60vh] overflow-auto p-6 font-mono text-xs leading-relaxed text-emerald-200"},i.code)])}function he({versions:i,onSelect:t,onDelete:o,onExport:s}){return i.length?r("section",{className:"bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20 p-6 space-y-4"},[r("h2",{className:"text-xl font-semibold"},"Version history"),r("div",{className:"grid gap-4"},i.map(e=>r("div",{key:e.id,className:"rounded-2xl border border-white/10 bg-black/30 hover:border-iris/50 transition-all p-5 space-y-3"},[r("div",{className:"flex flex-wrap items-start justify-between gap-3"},[r("div",{className:"space-y-1"},[r("button",{className:"text-left text-base font-semibold text-white hover:text-iris transition-colors",onClick:()=>t(e)},e.appIdea),r("div",{className:"text-xs text-white/60 flex flex-wrap gap-3"},[r("span",null,new Date(e.timestamp).toLocaleString()),r("span",null,e.model),r("span",null,e.template),r("span",null,`${e.code.split(`
`).length} lines`)])]),r("div",{className:"flex items-center gap-2"},[r("button",{onClick:()=>s(e.id),className:"px-3 py-2 rounded-lg border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/30"},"Export"),r("button",{onClick:()=>o(e.id),className:"px-3 py-2 rounded-lg border border-red-500/40 text-xs text-red-200 hover:bg-red-500/10"},"Delete")])])])))]):r("section",{className:"bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-iris/20 p-12 text-center space-y-4"},[r("div",{className:"text-3xl"},"🗂"),r("h2",{className:"text-xl font-semibold"},"No versions yet"),r("p",{className:"text-white/60 text-sm max-w-lg mx-auto"},"Generate your first application to start building your Morphic Web timeline.")])}function fe({apiKey:i,onSubmit:t,onClose:o}){const[s,e]=w(i??""),[a,n]=w(""),l=()=>{if(!s.trim()){n("Enter your Groq API key starting with gsk_");return}if(!s.trim().startsWith("gsk_")){n("Groq keys begin with gsk_. Double-check and try again.");return}t(s)};return r("div",{className:"fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50 px-4"},[r("div",{className:"w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/70 p-8 space-y-6 shadow-2xl shadow-iris/30"},[r("div",{className:"space-y-2 text-center"},[r("div",{className:"text-3xl"},"🔑"),r("h2",{className:"text-2xl font-semibold"},"Connect Groq"),r("p",{className:"text-white/70 text-sm"},"Morphic Web talks directly to Groq infrastructure. Your key stays in the browser and is never shared.")]),r("div",{className:"space-y-3"},[r("label",{className:"text-sm font-medium uppercase tracking-wide text-white/70 block"},"Groq API key"),r("input",{value:s,onChange:u=>{e(u.target.value),n("")},placeholder:"gsk_********************************",className:"w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-iris/60"}),a?r("p",{className:"text-xs text-red-200"},a):null]),r("div",{className:"flex flex-col sm:flex-row gap-3"},[r("button",{onClick:l,className:"flex-1 rounded-2xl bg-gradient-to-r from-iris to-magenta px-6 py-3 font-medium shadow-lg shadow-magenta/30 hover:shadow-xl"},"Save & Activate"),r("button",{onClick:o,className:"flex-1 rounded-2xl border border-white/15 px-6 py-3 text-white/70 hover:text-white hover:border-white/30"},"Cancel")]),r("p",{className:"text-xs text-white/50 text-center"},"Get your key at https://console.groq.com/keys")])])}function ge(){return r("div",{className:"fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur"},[r("div",{className:"bg-slate-900/80 border border-white/10 rounded-3xl px-10 py-8 text-center space-y-4 shadow-2xl shadow-iris/30"},[r("div",{className:"w-14 h-14 mx-auto rounded-full border-4 border-white/10 border-t-white animate-spin"}),r("h3",{className:"text-lg font-semibold"},"Groq is crafting your app…"),r("p",{className:"text-sm text-white/60"},"Prompt instructions, sanitization, and live preview are being assembled.")])])}function we(i){return ne(i)}const be=document.getElementById("root"),xe=J(be);xe.render(V.createElement(le));
