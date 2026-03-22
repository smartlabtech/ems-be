import{r as l,F as $,ax as O,av as V,az as B,j as e,A as W,B as r,v as d,T as g,ai as A,aB as M,w as z,aw as H,aC as L,a0 as U}from"./index-Da7PvzL_.js";import{G as Y,T as q,E as J,M as K,a as Q}from"./EmailServiceProviderManagement-CNZCVgEX.js";import{T as X}from"./Title-CcstBxYe.js";import{B as Z}from"./Badge-Bc5GyfPr.js";import{C as f}from"./Card-BeZqGAf3.js";import{G as j}from"./Grid-CzDi8A5h.js";import"./Pagination-CZBGciwK.js";import"./Textarea-B2i_vNQJ.js";import"./MultiSelect-BDyXFhd8.js";import"./OptionsDropdown-B165x-gC.js";import"./PillsInput-BmL_th8_.js";import"./Select-CiWMm0Dq.js";import"./List-D1FvG84T.js";import"./Table-DwnsJ1j7.js";import"./Tooltip-BGQi_nQE.js";import"./get-style-object-DUJZA7T_.js";import"./TagsInput-CeGzvyPy.js";import"./Switch-DW7iUg9V.js";import"./Collapse-CtTLkAxc.js";import"./format-UhTdluDS.js";const _=`
  .email-marketing-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  }
  
  .preset-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid transparent;
  }
  
  .preset-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  .preset-button.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;
  }
  
  .settings-button {
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
  }
  
  .settings-button:hover {
    transform: rotate(90deg) scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .grid-container {
    gap: 24px;
  }
  
  .component-wrapper {
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`,F=[{key:"groups",label:"Group Management",component:Y,icon:$,color:"#51cf66"},{key:"tags",label:"Tag Management",component:q,icon:O,color:"#fd7e14"},{key:"emails",label:"Email Management",component:J,icon:V,color:"#4c6ef5"},{key:"messages",label:"Email Messages",component:K,icon:B,color:"#9775fa"}],ee={campaign:{order:["tags","groups","emails"],visible:["tags","groups","emails"],spans:{tags:12,groups:6,emails:6}},inbox:{order:["tags","messages","emails"],visible:["tags","messages"],spans:{tags:12,messages:12,emails:6}}},Ie=()=>{const[o,w]=l.useState("inbox"),[G,y]=l.useState(!1),[n,p]=l.useState({tagIds:[]}),[C,m]=l.useState(null),[I,x]=l.useState(!1),[se,ae]=l.useState(0),{order:S,visible:R,spans:N}=ee[o],P=Object.fromEntries(F.map(s=>[s.key,s])),k=s=>{!s||s.length===0||p(a=>({tagIds:s}))},T=s=>{p(a=>({tagIds:a.tagIds.includes(s)?a.tagIds.filter(t=>t!==s):[...a.tagIds,s]}))},v=s=>{p({tagIds:s||[]})},u=()=>{p({tagIds:[]})},E=(s,a)=>{if(console.log("EmailMarketing - handleReplyMessage called with:",{replyData:s,originalMessage:a}),!s&&!a){m(null),x(!0);return}a&&!a.providerId&&U.show({title:"Warning",message:"No email provider found for this message. Please select a provider in the Email composer.",color:"orange",autoClose:8e3});const t={...s,originalMessage:a,providerWarning:a&&!a.providerId};console.log("EmailMarketing - Setting replyMessageData:",t),m(t),console.log("EmailMarketing - Setting openEmailComposer to true"),x(!0)};return e.jsxs(W,{px:"lg",py:"md",children:[e.jsx("style",{children:_}),e.jsx(r,{className:"email-marketing-header",children:e.jsxs(d,{justify:"space-between",align:"center",children:[e.jsxs(r,{children:[e.jsx(X,{order:1,style:{color:"white",fontWeight:700,marginBottom:"8px"},children:"Email Marketing Dashboard"}),e.jsx(g,{size:"lg",style:{color:"rgba(255, 255, 255, 0.9)"},children:"Manage your email campaigns, contacts, and messaging"})]}),e.jsxs(d,{spacing:"md",children:[e.jsx(Z,{size:"lg",variant:"light",color:"white",style:{backgroundColor:"rgba(255, 255, 255, 0.2)",color:"white",textTransform:"none"},children:o==="campaign"?"Campaign Mode":"Inbox Mode"}),e.jsx(A,{size:"xl",className:"settings-button",onClick:()=>y(!0),children:e.jsx(M,{size:20})})]})]})}),e.jsx(f,{shadow:"md",padding:"lg",radius:"lg",withBorder:!0,style:{marginBottom:"24px"},children:e.jsxs(d,{justify:"space-between",align:"center",children:[e.jsxs(r,{children:[e.jsx(g,{fw:600,size:"lg",mb:4,children:"View Mode"}),e.jsx(g,{size:"sm",c:"dimmed",children:"Switch between different dashboard layouts"})]}),e.jsxs(d,{spacing:"md",children:[e.jsx(z,{leftSection:e.jsx(H,{size:16}),onClick:()=>w("campaign"),size:"md",radius:"md",variant:o==="campaign"?"filled":"outline",className:`preset-button ${o==="campaign"?"active":""}`,style:{background:o==="campaign"?"linear-gradient(135deg, #667eea 0%, #764ba2 100%)":"transparent",borderColor:"#667eea"},children:"Campaign"}),e.jsx(z,{leftSection:e.jsx(B,{size:16}),onClick:()=>w("inbox"),size:"md",radius:"md",variant:o==="inbox"?"filled":"outline",className:`preset-button ${o==="inbox"?"active":""}`,style:{background:o==="inbox"?"linear-gradient(135deg, #667eea 0%, #764ba2 100%)":"transparent",borderColor:"#667eea"},children:"Inbox"})]})]})}),e.jsxs(j,{className:"grid-container",gutter:"lg",children:[S.map((s,a)=>{const t=P[s],i=t.component,b=N[s]||4,D=t.icon,h=R.includes(s);let c={};return s==="groups"?c={onGroupSelect:k,onSetTags:v,selectedTagIds:n.tagIds}:s==="tags"?c={onTagToggle:T,selectedTagIds:n.tagIds,tagType:""}:s==="emails"?c={tagIds:n.tagIds,onClearFilters:u,replyMessageData:C,openEmailComposer:I,onComposerClose:()=>{x(!1),m(null)},isVisible:h}:s==="messages"&&(c={onReplyMessage:E,tagIds:n.tagIds,onClearFilters:u,isVisible:h}),e.jsx(j.Col,{span:{base:12,sm:b>=6?b:12,lg:b},style:{display:h?"block":"none",...s==="emails"&&!h?{display:"block",position:"absolute",left:"-9999px",width:"1px",height:"1px",overflow:"hidden"}:{}},children:e.jsxs(f,{shadow:"md",padding:0,radius:"lg",withBorder:!0,className:"component-wrapper",style:{height:"100%",minHeight:s==="tags"?"auto":"600px"},children:[e.jsx(r,{style:{background:`linear-gradient(135deg, ${t.color}15 0%, ${t.color}05 100%)`,borderBottom:`1px solid ${t.color}20`,padding:"16px 24px",marginBottom:"16px"},children:e.jsxs(d,{spacing:"xs",align:"center",children:[e.jsx(r,{style:{width:32,height:32,borderRadius:"8px",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",color:"white"},children:e.jsx(D,{size:16})}),e.jsx(g,{fw:600,size:"md",c:"dark",children:t.label})]})}),e.jsx(r,{style:{padding:"0"},children:e.jsx(i,{...c})})]})},s)}),F.filter(s=>!S.includes(s.key)).map(s=>{const a=s.key,t=s.component;s.icon;let i={};return a==="groups"?i={onGroupSelect:k,onSetTags:v,selectedTagIds:n.tagIds}:a==="tags"?i={onTagToggle:T,selectedTagIds:n.tagIds,tagType:""}:a==="emails"?i={tagIds:n.tagIds,onClearFilters:u,replyMessageData:C,openEmailComposer:I,onComposerClose:()=>{x(!1),m(null)},isVisible:!1}:a==="messages"&&(i={onReplyMessage:E}),e.jsx(j.Col,{span:12,style:{display:"none"},children:e.jsx(f,{style:{display:"none"},children:e.jsx(t,{...i})})},a)})]}),e.jsx(L,{opened:G,onClose:()=>y(!1),title:e.jsxs(d,{spacing:"xs",align:"center",children:[e.jsx(r,{style:{width:32,height:32,borderRadius:"8px",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",color:"white"},children:e.jsx(M,{size:16})}),e.jsx(g,{fw:600,size:"lg",children:"Email Marketing Settings"})]}),padding:"lg",size:"xl",position:"right",radius:"lg",children:e.jsx(Q,{})})]})};export{Ie as default};
