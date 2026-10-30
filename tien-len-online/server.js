const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));

const rooms = new Map();
const SUITS = ["♠", "♣", "♦", "♥"];
const RANKS = ["3","4","5","6","7","8","9","10","J","Q","K","A","2"];
const rankValue = r => RANKS.indexOf(r);
const suitValue = s => SUITS.indexOf(s);
const cardValue = c => rankValue(c.rank) * 4 + suitValue(c.suit);
const makeDeck = () => RANKS.flatMap(rank => SUITS.map(suit => ({rank, suit, id: rank+suit})));
const cleanName = s => String(s || "Người chơi").trim().slice(0,18) || "Người chơi";
const roomCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

function publicState(room) {
  return {
    code: room.code, status: room.status, host: room.host,
    players: room.players.map(p => ({id:p.id, name:p.name, count:p.hand.length, ready:p.ready, online:p.online, finished:p.finished})),
    spectators: room.spectators.map(p => ({id:p.id,name:p.name})),
    turn: room.turn, current: room.current ? {playerId:room.current.playerId, playerName:room.current.playerName, cards:room.current.cards} : null,
    passes: room.passes, winner: room.winner, feed: room.feed.slice(-15)
  };
}
function emitRoom(room) { io.to(room.code).emit("state", publicState(room)); }
function say(room, text) { room.feed.push(text); room.feed = room.feed.slice(-30); }
function getMember(room, id) { return room.players.find(p=>p.id===id) || room.spectators.find(p=>p.id===id); }

function classify(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return null;
  const cs = cards.slice().sort((a,b)=>cardValue(a)-cardValue(b));
  const n = cs.length, counts = {};
  cs.forEach(c => counts[c.rank]=(counts[c.rank]||0)+1);
  const groups = Object.values(counts).sort((a,b)=>b-a);
  const unique = Object.keys(counts).length;
  const high = cs[cs.length-1];
  if (n===1) return {type:"single", size:1, power:cardValue(high)};
  if (n===2 && unique===1) return {type:"pair",size:2,power:rankValue(high.rank)*4+suitValue(high.suit)};
  if (n===3 && unique===1) return {type:"triple",size:3,power:rankValue(high.rank)*4+suitValue(high.suit)};
  if (n===4 && unique===1) return {type:"four",size:4,power:rankValue(high.rank)*4+suitValue(high.suit)};
  if (n>=3 && unique===n && cs.every((c,i)=>i===0 || rankValue(c.rank)===rankValue(cs[i-1].rank)+1) && !cs.some(c=>c.rank==="2")) {
    return {type:"straight",size:n,power:rankValue(high.rank)*4+suitValue(high.suit)};
  }
  return null;
}
function beats(next, prev) {
  if (!prev) return true;
  if (next.type!==prev.type || next.size!==prev.size) return false;
  return next.power > prev.power;
}
function nextActive(room, from) {
  for (let step=1; step<=room.players.length; step++) {
    const i=(from+step)%room.players.length;
    if (!room.players[i].finished && room.players[i].hand.length) return i;
  }
  return -1;
}
function begin(room) {
  if (room.players.length<2) return;
  let deck=makeDeck();
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  room.players.forEach(p=>{p.hand=[];p.finished=false;});
  deck.forEach((c,i)=>room.players[i%room.players.length].hand.push(c));
  room.players.forEach(p=>p.hand.sort((a,b)=>cardValue(a)-cardValue(b)));
  room.status="playing"; room.current=null; room.passes=0; room.winner=null;
  const starter=room.players.findIndex(p=>p.hand.some(c=>c.id==="3♠"));
  room.turn=starter<0?0:starter;
  say(room,"Ván mới bắt đầu! Người có 3♠ đi trước.");
  emitRoom(room); sendHands(room);
}
function sendHands(room){room.players.forEach(p=>io.to(p.id).emit("hand",p.hand));}
function roomBySocket(socket){const code=socket.data.room;return code?rooms.get(code):null;}

io.on("connection", socket=>{
  socket.on("create", ({name}, cb)=>{
    let code=roomCode(); while(rooms.has(code)) code=roomCode();
    const p={id:socket.id,name:cleanName(name),hand:[],ready:false,online:true,finished:false};
    const room={code,host:socket.id,status:"lobby",players:[p],spectators:[],turn:0,current:null,passes:0,winner:null,feed:[]};
    rooms.set(code,room); socket.join(code); socket.data.room=code;
    say(room,p.name+" đã tạo phòng."); cb?.({ok:true,code}); emitRoom(room);
  });
  socket.on("join", ({code,name}, cb)=>{
    code=String(code||"").toUpperCase().trim(); const room=rooms.get(code);
    if(!room){cb?.({ok:false,error:"Không tìm thấy phòng."});return;}
    if(room.status==="playing" || room.players.length>=8){
      if(room.spectators.length>=20){cb?.({ok:false,error:"Phòng đã đầy."});return;}
      const s={id:socket.id,name:cleanName(name)};
      room.spectators.push(s); socket.join(code); socket.data.room=code;
      say(room,s.name+" đã vào xem."); cb?.({ok:true,code,spectator:true}); emitRoom(room); return;
    }
    const p={id:socket.id,name:cleanName(name),hand:[],ready:false,online:true,finished:false};
    room.players.push(p); socket.join(code); socket.data.room=code;
    say(room,p.name+" đã tham gia phòng."); cb?.({ok:true,code}); emitRoom(room);
  });
  socket.on("chat", text=>{
    const room=roomBySocket(socket), member=room&&getMember(room,socket.id);
    if(!room||!member)return;
    const msg=String(text||"").trim().slice(0,250); if(!msg)return;
    io.to(room.code).emit("chat",{name:member.name,text:msg,time:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})});
  });
  socket.on("start",()=>{
    const room=roomBySocket(socket); if(!room||room.host!==socket.id||room.status!=="lobby"||room.players.length<2)return;
    begin(room);
  });
  socket.on("play", ids=>{
    const room=roomBySocket(socket); if(!room||room.status!=="playing")return;
    const idx=room.players.findIndex(p=>p.id===socket.id), p=room.players[idx];
    if(!p||idx!==room.turn||p.finished)return;
    if(!Array.isArray(ids)||ids.length>13)return;
    const chosen=p.hand.filter(c=>ids.includes(c.id));
    if(chosen.length!==ids.length||new Set(ids).size!==ids.length)return;
    const combo=classify(chosen);
    if(!combo){socket.emit("notice","Bộ bài không hợp lệ.");return;}
    const previous=room.current&&room.current.combo;
    if(!beats(combo,previous)){socket.emit("notice","Bộ bài chưa chặn được lượt trước.");return;}
    p.hand=p.hand.filter(c=>!ids.includes(c.id));
    room.current={playerId:p.id,playerName:p.name,cards:chosen,combo};
    room.passes=0;
    say(room,p.name+" đánh "+chosen.map(c=>c.rank+c.suit).join(" "));
    if(p.hand.length===0){p.finished=true;room.winner=p.name;room.status="finished";say(room,p.name+" đã hết bài và chiến thắng!");}
    else room.turn=nextActive(room,idx);
    emitRoom(room); sendHands(room);
  });
  socket.on("pass",()=>{
    const room=roomBySocket(socket); if(!room||room.status!=="playing")return;
    const idx=room.players.findIndex(p=>p.id===socket.id);
    if(idx<0||idx!==room.turn||!room.current)return;
    say(room,room.players[idx].name+" bỏ lượt."); room.passes++;
    if(room.passes>=room.players.filter(p=>!p.finished).length-1){
      room.current=null;room.passes=0;
      const last=room.players.findIndex(p=>p.id===room.players[(idx-1+room.players.length)%room.players.length].id && !p.finished);
      room.turn=last>=0?last:nextActive(room,idx);
      say(room,"Vòng đánh mới!");
    } else room.turn=nextActive(room,idx);
    emitRoom(room);
  });
  socket.on("newRound",()=>{
    const room=roomBySocket(socket); if(!room||room.host!==socket.id||room.status!=="finished")return;
    begin(room);
  });
  socket.on("disconnect",()=>{
    const room=roomBySocket(socket); if(!room)return;
    const pi=room.players.findIndex(p=>p.id===socket.id);
    if(pi>=0){room.players[pi].online=false;say(room,room.players[pi].name+" đã mất kết nối.");}
    else {room.spectators=room.spectators.filter(p=>p.id!==socket.id);}
    emitRoom(room);
  });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("Tien Len Online running on "+PORT));