'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const MINUTE = 60000;
const GROUPS = [{id:'casual',name:'Encontros casuais',seats:2,prefix:'C'},{id:'familia',name:'Família e amigos',seats:6,prefix:'F'},{id:'individual',name:'Individual',seats:1,prefix:'I'},{id:'reservada',name:'Mais reservada',seats:4,prefix:'R'}];
const TABLES = GROUPS.flatMap(group=>Array.from({length:5},(_,i)=>({id:`${group.prefix}${i+1}`,category:group.id,categoryName:group.name,seats:group.seats})));
class RuleError extends Error { constructor(message,status=400){super(message);this.status=status;} }
function createStore({file,clock=Date.now}) {
 let state={reservations:[]},queue=Promise.resolve();
 const ready=fs.readFile(file,'utf8').then(text=>{const saved=JSON.parse(text);if(!Array.isArray(saved.reservations))throw Error('Formato de reservas inválido');state=saved;}).catch(error=>{if(error.code!=='ENOENT')throw error;});
 function transaction(fn){const result=queue.then(async()=>{await ready;const draft=structuredClone(state);const result=fn(draft);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',JSON.stringify(draft,null,2),{mode:0o600});await fs.rename(file+'.tmp',file);state=draft;return result;});queue=result.catch(()=>{});return result;}
 function slot(start){const time=Date.parse(start);if(typeof start!=='string'||!Number.isFinite(time)||!/(Z|[+-]\d{2}:\d{2})$/.test(start))throw new RuleError('Informe um horário válido com fuso.');if(time<clock()+30*MINUTE)throw new RuleError('Reserve com pelo menos 30 minutos de antecedência.');return {start:time,end:time+120*MINUTE};}
 function unavailable(tableId,range,data=state){return data.reservations.some(r=>r.tableId===tableId&&((r.status==='occupied')||(r.status==='reserved'&&((r.start<=clock())||(r.start<range.end&&range.start<r.end)))));}
 async function availability(start,guests){await ready;await queue;const range=slot(start);if(!Number.isInteger(guests)||guests<1||guests>6)throw new RuleError('Selecione de 1 a 6 pessoas.');return TABLES.map(table=>({...table,available:table.seats>=guests&&!unavailable(table.id,range)}));}
 async function reserve(input){return transaction(data=>{
  const {tableId,name,phone,requestId}=input;
  if(typeof name!=='string'||name.trim().length<2||name.length>80)throw new RuleError('Informe seu nome (2 a 80 caracteres).');
  if(typeof phone!=='string'||!/^[\d\s()+-]{8,25}$/.test(phone)||phone.replace(/\D/g,'').length<10)throw new RuleError('Informe um telefone com DDD.');
  if(typeof requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(requestId))throw new RuleError('Identificador de envio inválido. Atualize a página.');
  const previous=data.reservations.find(r=>r.requestId===requestId);
  if(previous){if(previous.name!==name.trim()||previous.phone!==phone.trim()||previous.tableId!==tableId||previous.start!==Date.parse(input.start)||previous.guests!==input.guests)throw new RuleError('Envio repetido com dados diferentes.',409);return receipt(previous);}
  const range=slot(input.start);const table=TABLES.find(t=>t.id===tableId);
  if(!table||!Number.isInteger(input.guests)||input.guests<1||input.guests>table.seats)throw new RuleError('Mesa incompatível com o grupo.');
  if(unavailable(table.id,range,data))throw new RuleError('Esta mesa não está mais disponível. Consulte novamente.',409);
  const reservation={id:randomUUID(),requestId,tableId,name:name.trim(),phone:phone.trim(),guests:input.guests,...range,status:'reserved',createdAt:clock()};
  data.reservations.push(reservation);return receipt(reservation);
 });}
 function receipt(r){return {id:r.id,tableId:r.tableId,start:new Date(r.start).toISOString(),end:new Date(r.end).toISOString(),status:r.status};}
 async function list(){await ready;await queue;return state.reservations.map(r=>({...r,requestId:undefined,overdue:['reserved','occupied'].includes(r.status)&&clock()>=r.end})).sort((a,b)=>a.start-b.start);}
 async function transition(id,action){return transaction(data=>{const r=data.reservations.find(r=>r.id===id);if(!r)throw new RuleError('Reserva não encontrada.',404);
  if(action==='checkin'){if(r.status!=='reserved')throw new RuleError('Somente reservas aguardando chegada podem iniciar.',409);if(clock()<r.start||clock()>=r.end)throw new RuleError('A chegada deve ser registrada dentro do horário reservado.',409);if(data.reservations.some(other=>other.id!==id&&other.tableId===r.tableId&&other.status==='occupied'))throw new RuleError('Confirme a saída dos ocupantes anteriores.',409);r.status='occupied';r.checkedInAt=clock();}
  else if(action==='checkout'){if(!['reserved','occupied'].includes(r.status))throw new RuleError('Reserva já encerrada.',409);if(clock()<r.start)throw new RuleError('Para uma reserva futura, use cancelar.',409);r.status='completed';r.checkedOutAt=clock();}
  else if(action==='cancel'){if(r.status!=='reserved')throw new RuleError('Somente reservas sem chegada podem ser canceladas.',409);r.status='cancelled';r.cancelledAt=clock();}
  else throw new RuleError('Ação inválida.');return receipt(r);
 });}
 return {availability,reserve,list,transition};
}
module.exports={createStore,TABLES,GROUPS,RuleError};
