import{r as i,j as t}from"./index-DWrDNutn.js";const b=()=>{const[m,s]=i.useState([]),[c,p]=i.useState(0),d=["Something big is coming...","The wait will be worth it...","Preparing something special...","Magic is being made...","Innovation in progress..."];i.useEffect(()=>{const n=r=>{if(Math.random()>.85){const l=Date.now()+Math.random(),h=["✨","⭐","💫"],x={id:l,x:r.clientX,y:r.clientY,emoji:h[Math.floor(Math.random()*3)]};s(o=>[...o,x]),setTimeout(()=>{s(o=>o.filter(y=>y.id!==l))},2e3)}},a=setInterval(()=>{p(r=>(r+1)%d.length)},4e3);return document.addEventListener("mousemove",n),()=>{document.removeEventListener("mousemove",n),clearInterval(a)}},[]);const e={page:{margin:0,padding:0,fontFamily:"'Arial', sans-serif",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"},bgParticles:{position:"absolute",top:0,left:0,width:"100%",height:"100%",overflow:"hidden",zIndex:1},particle:{position:"absolute",width:"4px",height:"4px",background:"rgba(255, 255, 255, 0.3)",borderRadius:"50%",animation:"particleFloat 8s linear infinite"},container:{textAlign:"center",color:"white",maxWidth:"600px",padding:"2rem",position:"relative",zIndex:10},mysteryIcon:{fontSize:"6rem",marginBottom:"2rem",animation:"pulse 2s ease-in-out infinite",textShadow:"0 0 30px rgba(255, 255, 255, 0.5)"},title:{fontSize:"4rem",fontWeight:"bold",marginBottom:"1rem",textShadow:"2px 2px 4px rgba(0,0,0,0.3)",animation:"fadeInUp 1s ease-out",background:"linear-gradient(45deg, #fff, #f0f0f0, #fff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},title2:{fontSize:"2.5rem",fontWeight:"bold",marginTop:"-0.5rem",marginBottom:"1rem",textShadow:"2px 2px 4px rgba(0,0,0,0.3)",animation:"fadeInUp 1s ease-out 0.2s both",background:"linear-gradient(45deg, #fff, #f0f0f0, #fff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"},subtitle:{fontSize:"1.5rem",marginBottom:"3rem",opacity:.9,animation:"fadeInUp 1s ease-out 0.3s both",lineHeight:1.6},mysteryBox:{background:"rgba(255, 255, 255, 0.1)",backdropFilter:"blur(10px)",borderRadius:"20px",padding:"3rem 2rem",margin:"2rem 0",border:"1px solid rgba(255, 255, 255, 0.2)",animation:"fadeInUp 1s ease-out 0.6s both",position:"relative",overflow:"hidden"},mysteryText:{fontSize:"1.3rem",marginBottom:"2rem",position:"relative",zIndex:2},progressContainer:{background:"rgba(255, 255, 255, 0.2)",borderRadius:"25px",padding:"8px",margin:"2rem 0",animation:"fadeInUp 1s ease-out 0.9s both"},progressBar:{background:"linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b)",height:"25px",borderRadius:"20px",width:"0%",animation:"loading 4s ease-in-out infinite",position:"relative",overflow:"hidden",backgroundSize:"200% 100%"},countdownGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))",gap:"1rem",margin:"2rem 0",animation:"fadeInUp 1s ease-out 1.2s both"},countdownItem:{background:"rgba(255, 255, 255, 0.15)",borderRadius:"15px",padding:"1.5rem 1rem",border:"1px solid rgba(255, 255, 255, 0.3)"},countdownNumber:{fontSize:"2rem",fontWeight:"bold",color:"#ffd700",textShadow:"0 0 10px rgba(255, 215, 0, 0.5)"},countdownLabel:{fontSize:"0.9rem",opacity:.8,marginTop:"0.5rem"},contactSection:{marginTop:"3rem",animation:"fadeInUp 1s ease-out 1.5s both"},contactText:{fontSize:"1.1rem",marginBottom:"1rem",opacity:.9},floatingElements:{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:2},floatingElement:{position:"absolute",opacity:.1,animation:"mysteryFloat 10s ease-in-out infinite",fontSize:"2.5rem"},sparkle:{position:"fixed",color:"#ffd700",fontSize:"20px",pointerEvents:"none",animation:"sparkleOut 2s forwards",zIndex:1e3}},f=[{emoji:"✨",top:"10%",left:"10%",delay:"0s"},{emoji:"🔮",top:"20%",right:"15%",delay:"2s"},{emoji:"⭐",bottom:"30%",left:"20%",delay:"4s"},{emoji:"💫",top:"60%",right:"25%",delay:"6s"},{emoji:"🌟",bottom:"10%",right:"10%",delay:"8s"},{emoji:"✨",top:"70%",left:"5%",delay:"3s"}],g=Array.from({length:50},(n,a)=>({id:a,left:Math.random()*100+"%",animationDelay:Math.random()*8+"s",animationDuration:Math.random()*10+5+"s"}));return t.jsxs(t.Fragment,{children:[t.jsx("style",{children:`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          @keyframes loading {
            0% { width: 0%; }
            70% { width: 90%; }
            100% { width: 0%; }
          }

          @keyframes mysteryFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
            25% { transform: translateY(-30px) rotate(90deg); opacity: 0.2; }
            50% { transform: translateY(-10px) rotate(180deg); opacity: 0.15; }
            75% { transform: translateY(-20px) rotate(270deg); opacity: 0.1; }
          }

          @keyframes particleFloat {
            0% { transform: translateY(100vh) translateX(0); }
            100% { transform: translateY(-10vh) translateX(50px); }
          }

          @keyframes sparkleOut {
            0% { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); }
            100% { opacity: 0; transform: scale(0.3) translateY(-40px) rotate(180deg); }
          }

          .progress-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
            animation: progressShine 2s ease-in-out infinite;
          }

          .mystery-box::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: boxShine 3s ease-in-out infinite;
          }

          @keyframes progressShine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }

          @keyframes boxShine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
          }

          .email:hover {
            color: #fff !important;
            text-shadow: 0 0 15px #ffd700 !important;
            transform: scale(1.05);
          }

          @media (max-width: 768px) {
            .title {
              font-size: 3rem !important;
            }
            .title2 {
              font-size: 2rem !important;
            }
            .mystery-icon {
              font-size: 4rem !important;
            }
            .container {
              padding: 1rem !important;
            }
            .countdown-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .mystery-box {
              padding: 2rem 1rem !important;
            }
          }
        `}),t.jsxs("div",{style:e.page,children:[t.jsx("div",{style:e.bgParticles,children:g.map(n=>t.jsx("div",{style:{...e.particle,left:n.left,animationDelay:n.animationDelay,animationDuration:n.animationDuration}},n.id))}),t.jsx("div",{style:e.floatingElements,children:f.map((n,a)=>t.jsx("div",{style:{...e.floatingElement,top:n.top,left:n.left,right:n.right,bottom:n.bottom,animationDelay:n.delay},children:n.emoji},a))}),m.map(n=>t.jsx("div",{style:{...e.sparkle,left:n.x,top:n.y},children:n.emoji},n.id)),t.jsxs("div",{style:e.container,children:[t.jsx("div",{style:e.mysteryIcon,children:"🎭"}),t.jsx("h1",{style:e.title,children:"Something Amazing"}),t.jsx("h2",{style:e.title2,children:"Is Coming"}),t.jsx("p",{style:e.subtitle,children:"We're crafting something extraordinary behind the scenes. Get ready for a surprise that will change everything."}),t.jsx("div",{style:e.mysteryBox,className:"mystery-box",children:t.jsxs("div",{style:e.mysteryText,children:[t.jsx("strong",{children:"What's brewing?"}),t.jsx("br",{}),d[c]]})}),t.jsx("div",{style:e.progressContainer,children:t.jsx("div",{style:e.progressBar,className:"progress-bar"})}),t.jsxs("div",{style:e.countdownGrid,className:"countdown-grid",children:[t.jsxs("div",{style:e.countdownItem,children:[t.jsx("div",{style:e.countdownNumber,children:"?"}),t.jsx("div",{style:e.countdownLabel,children:"Days"})]}),t.jsxs("div",{style:e.countdownItem,children:[t.jsx("div",{style:e.countdownNumber,children:"?"}),t.jsx("div",{style:e.countdownLabel,children:"Hours"})]}),t.jsxs("div",{style:e.countdownItem,children:[t.jsx("div",{style:e.countdownNumber,children:"?"}),t.jsx("div",{style:e.countdownLabel,children:"Minutes"})]}),t.jsxs("div",{style:e.countdownItem,children:[t.jsx("div",{style:e.countdownNumber,children:"?"}),t.jsx("div",{style:e.countdownLabel,children:"Secrets"})]})]}),t.jsx("div",{style:e.contactSection,children:t.jsx("p",{style:e.contactText,children:"The mystery unfolds soon. Stay tuned for the big reveal!"})})]})]})]})};export{b as default};
