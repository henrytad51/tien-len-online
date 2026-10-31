const socket=io();
const $=id=>document.getElementById(id);
let myHand=[], selected=new Set(), state=null, myId=null, currentCode=null;
socket.on("connect",()=>{$("connection").textContent="● Đã kết nối";myId=socket.id;});
socket.on("disconnect",()=>{$("connection").textContent="● Mất kết nối";});
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2300);}
function show(id){["home","lobby","game"].forEach(x=>$(x).classList.toggle("hidden",x!==id));}
function name(){return $("name").value.trim()||"Người chơi";}
function enter(code){currentCode=code;history.replaceState({}, "", "?room="+code);$("roomCode").textContent=code;$("gameCode").textContent=code;show("lobby");}
function doCreate(){socket.emit("create",{name:name()},r=>{if(!r?.ok)return toast("Không tạo được phòng.");enter(r.code);});}
function doJoin(code){socket.emit("join",{code,name:name()},r=>{if(!r?.ok)return toast(r?.error||"Không vào được phòng.");enter(r.code);if(r.spectator)toast("Bạn đang vào xem ván chơi.");});}
$("create").onclick=doCreate;
$("join").onclick=()=>doJoin($("code").value);
$("code").addEventListener("keydown",e=>{if(e.key==="Enter")$("join").click();});
const invite=()=>location.origin+location.pathname+"?room="+currentCode;
async function copyInvite(){try{await navigator.clipboard.writeText(invite());toast("Đã sao chép link mời!");}catch(e){prompt("Sao chép link này để mời bạn bè:",invite());}}
$("copy").onclick=copyInvite;$("copy2").onclick=copyInvite;
$("start").onclick=()=>socket.emit("start");
$("newRound").onclick=()=>socket.emit("newRound");
$("play").onclick=()=>{if(!selected.size)return toast("Hãy chọn lá bài muốn đánh.");socket.emit("play",[...selected]);selected.clear();};
$("pass").onclick=()=>socket.emit("pass");
socket.on("notice",toast);
socket.on("hand",h=>{myHand=h;selected.clear();renderHand();});
socket.on("state",s=>{state=s;if(s.status==="playing"||s.status==="finished")show("game");else show("lobby");renderState();});
function renderState(){
 if(!state)return;
 $("roomCode").textContent=state.code;$("gameCode").textContent=state.code;
 $("count").textContent=state.players.length+"/8";
 $("players").innerHTML=state.players.map((p,i)=>`<div class="player"><div class="avatar">${i+1}</div><div><b>${esc(p.name)}</b><small>${p.id===state.host?"Chủ phòng · ":""}${p.online?"Đang online":"Mất kết nối"}</small></div></div>`).join("");
 $("spectators").innerHTML=state.spectators.length?`<p class="tiny">Đang xem: ${state.spectators.map(p=>esc(p.name)).join(", ")}</p>`:"";
 $("start").classList.toggle("hidden",state.host!==myId||state.status!=="lobby");
 $("hostHint").textContent=state.host===myId?"Bạn là chủ phòng. Có ít nhất 2 người để bắt đầu.":"Chờ chủ phòng bắt đầu ván chơi.";
 $("seatList").innerHTML=state.players.map((p,i)=>`<div class="seat ${state.players[state.turn]?.id===p.id&&state.status==="playing"?"active":""}">${esc(p.name)} <small>${p.count} lá</small></div>`).join("");
 $("turnLabel").textContent=state.status==="finished"?"🏆 "+state.winner+" chiến thắng!":state.players[state.turn]?.id===myId?"ĐẾN LƯỢT CỦA BẠN":"Lượt của "+(state.players[state.turn]?.name||"...");
 $("played").innerHTML=state.current?state.current.cards.map(cardHTML).join(""):'<span class="tiny">Chưa có lá bài nào được đánh</span>';
 $("feed").textContent=state.feed.slice(-2).join(" · ");
 $("handCount").textContent=myHand.length+" LÁ";
 $("play").disabled=state.status!=="playing"||state.players[state.turn]?.id!==myId;
 $("pass").disabled=$("play").disabled||!state.current;
 $("newRound").classList.toggle("hidden",state.status!=="finished"||state.host!==myId);
 renderHand();
}
function cardHTML(c){let red=c.suit==="♥"||c.suit==="♦";return `<div class="card ${red?"red":""}"><span>${c.rank}</span><span class="suit">${c.suit}</span></div>`;}
function renderHand(){$("hand").innerHTML=myHand.map(c=>`<div class="card ${c.suit==="♥"||c.suit==="♦"?"red":""} ${selected.has(c.id)?"selected":""}" data-id="${c.id}"><span>${c.rank}</span><span class="suit">${c.suit}</span></div>`).join("");$("hand").querySelectorAll(".card").forEach(el=>el.onclick=()=>{let id=el.dataset.id;selected.has(id)?selected.delete(id):selected.add(id);renderHand();});}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addChat(target,msg){const el=$(target),div=document.createElement("div");div.className="message";div.innerHTML=`<b>${esc(msg.name)}</b>: ${esc(msg.text)} <time>${esc(msg.time)}</time>`;el.appendChild(div);el.scrollTop=el.scrollHeight;}
socket.on("chat",m=>{addChat("messages",m);addChat("gameMessages",m);});
function sendChat(input){let v=$(input).value.trim();if(v){socket.emit("chat",v);$(input).value="";}}
$("chatForm").onsubmit=e=>{e.preventDefault();sendChat("chatInput");};
$("gameChatForm").onsubmit=e=>{e.preventDefault();sendChat("gameChatInput");};
const params=new URLSearchParams(location.search);if(params.get("room")){$("code").value=params.get("room").toUpperCase();}