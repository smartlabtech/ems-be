import{r as c,F as O,ay as V,c0 as A,as as G,j as e,A as W,B as i,v as g,T as m,ai as H,ar as z,w as B,at as L,au as U,a0 as b}from"./index-zlAVvmiM.js";import{G as Y,T as q,E as J,M as K,a as Q,F as X}from"./EmailServiceProviderManagement-B8YOYJcP.js";import{T as Z}from"./Title-DYPHeQNi.js";import{B as _}from"./Badge-B93Kkn4u.js";import{C as f}from"./Card-CRfkZ0oV.js";import{G as j}from"./Grid-BzAcKQq1.js";import"./Pagination-H349nWAo.js";import"./Textarea-DUMo4L02.js";import"./MultiSelect-CFfR8qMv.js";import"./OptionsDropdown-DsXu-PVs.js";import"./PillsInput-DUJzs4EV.js";import"./Select-D3DybRCE.js";import"./List-Dk4RFw-F.js";import"./Table-Dx-eLoER.js";import"./Tooltip-6ov--tMx.js";import"./get-style-object-DUJZA7T_.js";import"./TagsInput-BAeIcPaY.js";import"./Switch-DKPCKzKA.js";import"./Collapse-BLiGFMDf.js";import"./format-UhTdluDS.js";const ee=`
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
`,F=[{key:"groups",label:"Group Management",component:Y,icon:O,color:"#51cf66"},{key:"tags",label:"Tag Management",component:q,icon:V,color:"#fd7e14"},{key:"emails",label:"Email Management",component:J,icon:A,color:"#4c6ef5"},{key:"messages",label:"Email Messages",component:K,icon:G,color:"#9775fa"}],se={campaign:{order:["tags","groups","emails"],visible:["tags","groups","emails"],spans:{tags:12,groups:6,emails:6}},inbox:{order:["tags","messages","emails"],visible:["tags","messages"],spans:{tags:12,messages:12,emails:6}}},ke=()=>{const[o,w]=c.useState("inbox"),[P,y]=c.useState(!1),[r,x]=c.useState({tagIds:[]}),[C,l]=c.useState(null),[I,d]=c.useState(!1),[ae,te]=c.useState(0),{order:k,visible:N,spans:R}=se[o],D=Object.fromEntries(F.map(s=>[s.key,s])),T=s=>{!s||s.length===0||x(a=>({tagIds:s}))},v=s=>{x(a=>({tagIds:a.tagIds.includes(s)?a.tagIds.filter(t=>t!==s):[...a.tagIds,s]}))},E=s=>{x({tagIds:s||[]})},S=()=>{x({tagIds:[]})},M=(s,a)=>{if(!s&&!a){l(null),d(!0);return}a&&!a.providerId&&b.show({title:"Warning",message:"No email provider found for this message. Please select a provider in the Email composer.",color:"orange",autoClose:8e3}),l({...s,originalMessage:a,providerWarning:a&&!a.providerId}),d(!0)};return e.jsxs(W,{px:"lg",py:"md",children:[e.jsx("style",{children:ee}),e.jsx(i,{className:"email-marketing-header",children:e.jsxs(g,{justify:"space-between",align:"center",children:[e.jsxs(i,{children:[e.jsx(Z,{order:1,style:{color:"white",fontWeight:700,marginBottom:"8px"},children:"Email Marketing Dashboard"}),e.jsx(m,{size:"lg",style:{color:"rgba(255, 255, 255, 0.9)"},children:"Manage your email campaigns, contacts, and messaging"})]}),e.jsxs(g,{spacing:"md",children:[e.jsx(_,{size:"lg",variant:"light",color:"white",style:{backgroundColor:"rgba(255, 255, 255, 0.2)",color:"white",textTransform:"none"},children:o==="campaign"?"Campaign Mode":"Inbox Mode"}),e.jsx(H,{size:"xl",className:"settings-button",onClick:()=>y(!0),children:e.jsx(z,{size:20})})]})]})}),e.jsx(f,{shadow:"md",padding:"lg",radius:"lg",withBorder:!0,style:{marginBottom:"24px"},children:e.jsxs(g,{justify:"space-between",align:"center",children:[e.jsxs(i,{children:[e.jsx(m,{fw:600,size:"lg",mb:4,children:"View Mode"}),e.jsx(m,{size:"sm",c:"dimmed",children:"Switch between different dashboard layouts"})]}),e.jsxs(g,{spacing:"md",children:[e.jsx(B,{leftSection:e.jsx(L,{size:16}),onClick:()=>w("campaign"),size:"md",radius:"md",variant:o==="campaign"?"filled":"outline",className:`preset-button ${o==="campaign"?"active":""}`,style:{background:o==="campaign"?"linear-gradient(135deg, #667eea 0%, #764ba2 100%)":"transparent",borderColor:"#667eea"},children:"Campaign"}),e.jsx(B,{leftSection:e.jsx(G,{size:16}),onClick:()=>w("inbox"),size:"md",radius:"md",variant:o==="inbox"?"filled":"outline",className:`preset-button ${o==="inbox"?"active":""}`,style:{background:o==="inbox"?"linear-gradient(135deg, #667eea 0%, #764ba2 100%)":"transparent",borderColor:"#667eea"},children:"Inbox"})]})]})}),e.jsxs(j,{className:"grid-container",gutter:"lg",children:[k.map((s,a)=>{const t=D[s],n=t.component,u=R[s]||4,$=t.icon,h=N.includes(s);let p={};return s==="groups"?p={onGroupSelect:T,onSetTags:E,selectedTagIds:r.tagIds}:s==="tags"?p={onTagToggle:v,selectedTagIds:r.tagIds,tagType:""}:s==="emails"?p={tagIds:r.tagIds,onClearFilters:S,replyMessageData:C,openEmailComposer:I,onComposerClose:()=>{d(!1),l(null)},isVisible:h}:s==="messages"&&(p={onReplyMessage:M}),e.jsx(j.Col,{span:{base:12,sm:u>=6?u:12,lg:u},style:{display:h?"block":"none",...s==="emails"&&!h?{display:"block",position:"absolute",left:"-9999px",width:"1px",height:"1px",overflow:"hidden"}:{}},children:e.jsxs(f,{shadow:"md",padding:0,radius:"lg",withBorder:!0,className:"component-wrapper",style:{height:"100%",minHeight:s==="tags"?"auto":"600px"},children:[e.jsx(i,{style:{background:`linear-gradient(135deg, ${t.color}15 0%, ${t.color}05 100%)`,borderBottom:`1px solid ${t.color}20`,padding:"16px 24px",marginBottom:"16px"},children:e.jsxs(g,{spacing:"xs",align:"center",children:[e.jsx(i,{style:{width:32,height:32,borderRadius:"8px",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",color:"white"},children:e.jsx($,{size:16})}),e.jsx(m,{fw:600,size:"md",c:"dark",children:t.label})]})}),e.jsx(i,{style:{padding:"0"},children:e.jsx(n,{...p})})]})},s)}),F.filter(s=>!k.includes(s.key)).map(s=>{const a=s.key,t=s.component;s.icon;let n={};return a==="groups"?n={onGroupSelect:T,onSetTags:E,selectedTagIds:r.tagIds}:a==="tags"?n={onTagToggle:v,selectedTagIds:r.tagIds,tagType:""}:a==="emails"?n={tagIds:r.tagIds,onClearFilters:S,replyMessageData:C,openEmailComposer:I,onComposerClose:()=>{d(!1),l(null)},isVisible}:a==="messages"&&(n={onReplyMessage:M}),e.jsx(j.Col,{span:12,style:{display:"none"},children:e.jsx(f,{style:{display:"none"},children:e.jsx(t,{...n})})},a)})]}),e.jsx(U,{opened:P,onClose:()=>y(!1),title:e.jsxs(g,{spacing:"xs",align:"center",children:[e.jsx(i,{style:{width:32,height:32,borderRadius:"8px",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",color:"white"},children:e.jsx(z,{size:16})}),e.jsx(m,{fw:600,size:"lg",children:"Email Marketing Settings"})]}),padding:"lg",size:"xl",position:"right",radius:"lg",children:e.jsx(Q,{})}),e.jsx(X,{selectedEmails:[],onBulkTagManagement:()=>{b.show({title:"Bulk Tag Management",message:"Please select emails from the Email Management section first",color:"blue"})},onGmailCompose:()=>{l(null),d(!0)},onClassicCompose:()=>{l(null),d(!0)},onBulkDelete:()=>{b.show({title:"Bulk Delete",message:"Please select emails from the Email Management section first",color:"blue"})},visible:!0})]})};export{ke as default};
