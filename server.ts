import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { TRIVIA_QUESTIONS } from './server/trivia';
import logger from './server/logger';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT || 3000);
app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

interface Player {
  id: string; name: string; avatar: string; coins: number; bet: number; score: number; streak: number;
  isReady: boolean; isConnected: boolean; isHost: boolean; hasAnsweredCurrent: boolean;
  currentAnswerIndex: number | null; lastAnswerCorrect: boolean | null; lastPointsEarned: number; isBot?: boolean; ws?: WebSocket;
}
interface Room {
  roomId: string; roomCode: string; status: 'lobby'|'countdown'|'in_question'|'round_recap'|'game_over';
  hostId: string; players: Player[]; potTotal: number; settings: any; questions: any[]; currentIndex: number;
  timeRemaining: number; maxTime: number; hostCommentary: string; hostMood: string; eliminatedOptions: number[];
  winner?: { player: Player; coinPrize: number }; chatMessages: any[]; timer?: ReturnType<typeof setInterval>; recap?: ReturnType<typeof setTimeout>;
}

const rooms = new Map<string, Room>();
const seedLeaderboard = [
  { id:'seed-1', playerName:'QuizMaster_X', score:28450, accuracyPct:100, difficulty:'Hard', category:'science_nature', highestStreak:10, hostName:'Prof. Archibald Sterling', hostId:'sterling', totalQuestions:10, correctQuestions:10, timestamp:'2026-08-30T14:22:00.000Z' },
  { id:'seed-2', playerName:'NovaRider', score:23100, accuracyPct:90, difficulty:'Hard', category:'world_history', highestStreak:8, hostName:'Roxy Sparks', hostId:'roxy', totalQuestions:10, correctQuestions:9, timestamp:'2026-08-29T19:45:00.000Z' },
  { id:'seed-3', playerName:'CosmicVoyager', score:18900, accuracyPct:100, difficulty:'Medium', category:'pop_culture_gaming', highestStreak:8, hostName:'Sunny Sparkle', hostId:'sunny', totalQuestions:8, correctQuestions:8, timestamp:'2026-08-28T11:15:00.000Z' },
];
function loadScores() { try { return JSON.parse(fs.readFileSync(LEADERBOARD_FILE,'utf8')); } catch { fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(seedLeaderboard,null,2)); return seedLeaderboard; } }
function saveScores(scores:any[]) { fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(scores.slice(0,100),null,2)); }

function localQuestions(category:string, difficulty:string, count:number) {
  let pool = TRIVIA_QUESTIONS.filter(q => (category === 'all_mix' || !category || q.category === category) && (!difficulty || difficulty === 'All' || q.difficulty === difficulty));
  if (pool.length < count) pool = TRIVIA_QUESTIONS.filter(q => category === 'all_mix' || !category || q.category === category);
  if (pool.length < count) pool = [...TRIVIA_QUESTIONS];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

app.get('/api/health', (_req,res) => res.json({ status:'ok', mode:'offline', externalApis:false }));
app.post('/api/generate-trivia', (req,res) => {
  const { category='all_mix', difficulty='Medium', count=5 } = req.body || {};
  res.json({ questions: localQuestions(category, difficulty, Math.max(1, Math.min(20, Number(count)||5))), source:'offline_vault' });
});
app.get('/api/weekly-status', (_req,res) => res.json({ source:'bundled_offline_vault', externalApis:false, questionCount:TRIVIA_QUESTIONS.length }));
app.get('/api/leaderboard', (_req,res) => res.json({ entries: loadScores().sort((a:any,b:any)=>b.score-a.score).slice(0,50) }));
app.post('/api/leaderboard', (req,res) => { const scores=loadScores(); scores.push(req.body); saveScores(scores); res.json({success:true}); });

const wss = new WebSocketServer({ server, path:'/ws/multiplayer' });
function code() { return `TRV-${Math.floor(100+Math.random()*900)}`; }
function stamp() { return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function publicRoom(room:Room) {
  const current = room.questions[room.currentIndex];
  const players = room.players.map(({ws,...p}) => ({...p, currentAnswerIndex: room.status === 'in_question' ? null : p.currentAnswerIndex}));
  const question = current && room.status === 'in_question' ? { id:current.id, question:current.question, options:current.options, category:current.category, difficulty:current.difficulty, hostCommentary:current.hostCommentary } : current;
  return { roomId:room.roomId, roomCode:room.roomCode, status:room.status, hostId:room.hostId, players, potTotal:room.potTotal, settings:room.settings, currentIndex:room.currentIndex, currentQuestion:question, totalQuestions:room.questions.length, timeRemaining:room.timeRemaining, maxTime:room.maxTime, hostCommentary:room.hostCommentary, hostMood:room.hostMood, eliminatedOptions:room.eliminatedOptions, winner:room.winner ? {player:{id:room.winner.player.id,name:room.winner.player.name,avatar:room.winner.player.avatar,score:room.winner.player.score},coinPrize:room.winner.coinPrize}:undefined, chatMessages:room.chatMessages.slice(-30)};
}
function broadcast(room:Room) { const state=publicRoom(room); const msg=JSON.stringify({type:'room_state', state, room:state}); room.players.forEach(p=>{ if(p.ws?.readyState===WebSocket.OPEN) p.ws.send(msg); }); }
function chat(room:Room,text:string) { room.chatMessages.push({id:`m_${Date.now()}_${Math.random()}`,senderId:'system',senderName:'Host Announcer',text,time:stamp(),isSystem:true}); }
function resetAnswers(room:Room) { room.players.forEach(p=>{p.hasAnsweredCurrent=false;p.currentAnswerIndex=null;p.lastAnswerCorrect=null;p.lastPointsEarned=0;}); }
function startQuestion(room:Room) {
  clearInterval(room.timer); clearTimeout(room.recap); resetAnswers(room); room.status='in_question'; room.timeRemaining=room.maxTime; room.hostMood='focused'; room.hostCommentary='Eyes up. This one counts.'; broadcast(room);
  room.timer=setInterval(()=>{ room.timeRemaining--; if(room.timeRemaining<=0) finishRound(room,true); else broadcast(room); },1000);
}
function finishRound(room:Room, timeout=false) {
  if(room.status!=='in_question') return; clearInterval(room.timer); room.status='round_recap';
  const q=room.questions[room.currentIndex];
  room.players.forEach(p=>{ if(!p.hasAnsweredCurrent){p.lastAnswerCorrect=false;p.lastPointsEarned=0;} });
  const winner=room.players.filter(p=>p.lastAnswerCorrect).sort((a,b)=>b.lastPointsEarned-a.lastPointsEarned)[0];
  if(winner && room.players.length>1){ const loser=room.players.filter(p=>p.id!==winner.id).sort((a,b)=>a.score-b.score)[0]; chat(room, `${winner.name} is cooking. ${loser?.name || 'Someone'} is providing the smoke alarm.`); }
  room.hostMood=timeout?'teasing':'reactive'; room.hostCommentary=timeout?'Time is up. The clock wins this round.':`Correct answer: ${q.correctAnswer}`; broadcast(room);
  room.recap=setTimeout(()=>{ room.currentIndex++; if(room.currentIndex>=room.questions.length) endGame(room); else startQuestion(room); },2500);
}
function endGame(room:Room) { clearInterval(room.timer); clearTimeout(room.recap); room.status='game_over'; const winner=room.players.slice().sort((a,b)=>b.score-a.score)[0]; room.winner=winner?{player:winner,coinPrize:Math.max(0,room.potTotal)}:undefined; room.hostMood='celebratory'; room.hostCommentary=winner?`${winner.name} wins the arena!`:'Match complete.'; broadcast(room); }

wss.on('connection',(ws)=>{
  let playerId:string|undefined; let roomId:string|undefined;
  ws.on('message',(raw)=>{
    try {
      const data=JSON.parse(raw.toString()); const type=data.type;
      if(type==='heartbeat_ping'){ws.send(JSON.stringify({type:'heartbeat_pong',timestamp:Date.now()}));return;}
      if(type==='create_room'){
        playerId=data.playerId || `p_${Date.now()}`; roomId=`room_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
        const settings=data.settings||{}; const bet=Number(settings.betAmount)||0;
        const player:Player={id:playerId,name:data.playerName||'Player 1',avatar:'trophy',coins:500,bet,score:0,streak:0,isReady:true,isConnected:true,isHost:true,hasAnsweredCurrent:false,currentAnswerIndex:null,lastAnswerCorrect:null,lastPointsEarned:0,ws};
        const room:Room={roomId,roomCode:code(),status:'lobby',hostId:playerId,players:[player],potTotal:bet,settings:{...settings,roundCount:Math.min(20,Math.max(1,Number(settings.roundCount)||5)),timePerQuestion:Math.min(60,Math.max(10,Number(settings.timePerQuestion)||20))},questions:[],currentIndex:0,timeRemaining:20,maxTime:Number(settings.timePerQuestion)||20,hostCommentary:'Room created. Invite your rival.',hostMood:'welcoming',eliminatedOptions:[],chatMessages:[]}; rooms.set(roomId,room); ws.send(JSON.stringify({type:'room_joined',roomId,roomCode:room.roomCode,playerId})); broadcast(room); return;
      }
      if(type==='join_room'){
        const wanted=String(data.roomCode||'').toUpperCase(); const room=Array.from(rooms.values()).find(r=>r.roomCode===wanted); if(!room){ws.send(JSON.stringify({type:'error',message:'Room not found.'}));return;}
        playerId=data.playerId || `p_${Date.now()}`; roomId=room.roomId; const existing=room.players.find(p=>p.id===playerId);
        if(existing){existing.ws=ws;existing.isConnected=true;} else { const p:Player={id:playerId,name:data.playerName||`Contender ${room.players.length+1}`,avatar:'zap',coins:500,bet:room.settings.betAmount||0,score:0,streak:0,isReady:false,isConnected:true,isHost:false,hasAnsweredCurrent:false,currentAnswerIndex:null,lastAnswerCorrect:null,lastPointsEarned:0,ws}; room.players.push(p); room.potTotal+=p.bet; chat(room,`${p.name} has entered the arena.`); }
        ws.send(JSON.stringify({type:'room_joined',roomId:room.roomId,roomCode:room.roomCode,playerId,reconnected:!!existing})); broadcast(room); return;
      }
      const room=roomId?rooms.get(roomId):undefined; if(!room || !playerId) return; const me=room.players.find(p=>p.id===playerId); if(!me) return;
      if(type==='toggle_ready'){me.isReady=!me.isReady;broadcast(room);return;}
      if(type==='add_bot'){ if(room.players.length<8){const bot:Player={id:`bot_${Date.now()}`,name:['CyberSage','QuantumBrain','PixelPaladin','NeonNerd'][room.players.length%4],avatar:'bot',coins:1000,bet:room.settings.betAmount||0,score:0,streak:0,isReady:true,isConnected:true,isHost:false,hasAnsweredCurrent:false,currentAnswerIndex:null,lastAnswerCorrect:null,lastPointsEarned:0,isBot:true};room.players.push(bot);room.potTotal+=bot.bet;chat(room,`${bot.name} joined the arena. Let the roasting commence.`);broadcast(room);}return;}
      if(type==='start_match' && me.isHost){ room.questions=localQuestions(room.settings.category||'all_mix',room.settings.difficulty||'Medium',room.settings.roundCount||5); room.currentIndex=0;room.maxTime=room.settings.timePerQuestion||20;room.status='countdown';room.hostCommentary='Get ready...';broadcast(room);setTimeout(()=>startQuestion(room),1200);return; }
      if(type==='submit_answer' && room.status==='in_question' && !me.hasAnsweredCurrent){ const q=room.questions[room.currentIndex]; me.hasAnsweredCurrent=true;me.currentAnswerIndex=Number(data.optionIndex);me.lastAnswerCorrect=me.currentAnswerIndex===q.correctIndex;me.lastPointsEarned=me.lastAnswerCorrect?1000+Math.max(0,room.timeRemaining*25):0; if(me.lastAnswerCorrect){me.score+=me.lastPointsEarned;me.streak++;}else me.streak=0; if(room.players.every(p=>p.hasAnsweredCurrent)) finishRound(room); else broadcast(room); return; }
      if(type==='send_chat'){const text=String(data.text||'').trim().slice(0,240);if(text){room.chatMessages.push({id:`m_${Date.now()}_${Math.random()}`,senderId:me.id,senderName:me.name,text,time:stamp()});broadcast(room);}return;}
      if(type==='leave_room'){me.isConnected=false;me.ws=undefined;broadcast(room);return;}
    } catch(err){ logger.error?.(err); ws.send(JSON.stringify({type:'error',message:'Invalid multiplayer message.'})); }
  });
  ws.on('close',()=>{ if(roomId&&playerId){const room=rooms.get(roomId);const p=room?.players.find(x=>x.id===playerId);if(p){p.isConnected=false;p.ws=undefined;broadcast(room!);}} });
});

async function start() {
  const isProd=process.env.NODE_ENV==='production';
  if(!isProd){ const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'}); app.use(vite.middlewares); }
  else { app.use(express.static(path.join(process.cwd(),'dist'))); app.get('*',(_req,res)=>res.sendFile(path.join(process.cwd(),'dist','index.html'))); }
  server.listen(PORT,()=>console.log(`Snap Crackle Trivia offline server listening on ${PORT}`));
}
start();
