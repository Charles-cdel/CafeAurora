'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomBytes,timingSafeEqual}=require('node:crypto');
const {createStore}=require('../server/reservations.cjs');
const root=path.resolve(__dirname,'..');
const assets={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/script.js':'script.js','/booking.js':'booking.js','/admin.html':'admin.html','/admin.js':'admin.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function createApp({file=process.env.RESERVATIONS_FILE||path.join(root,'data/reservations.json'),adminKey,clock=Date.now}={}){
 if(!adminKey)throw Error('Chave administrativa necessária');
 const store=createStore({file,clock});
 const limits=new Map();
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 const authorized=req=>{const got=Buffer.from(req.headers.authorization||'');const expected=Buffer.from(`Bearer ${adminKey}`);return got.length===expected.length&&timingSafeEqual(got,expected);};
 async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)throw Object.assign(Error('Envio muito grande.'),{status:413});}try{return JSON.parse(text);}catch{throw Object.assign(Error('JSON inválido.'),{status:400});}}
 return http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');const p=url.pathname;
  if(p.startsWith('/api/')){
   // Sem CORS: requisições de outros sites não podem ler a API.
   if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`){send(res,403,{error:'Origem não permitida.'});return;}
   if(req.method!=='GET'){
    const now=Date.now();for(const [ip,item] of limits)if(item.until<now)limits.delete(ip);
    const ip=req.socket.remoteAddress;const count=limits.get(ip)||{count:0,until:now+60000};limits.set(ip,count);if(++count.count>60){send(res,429,{error:'Aguarde um minuto antes de tentar novamente.'});return;}
   }
   if(p.startsWith('/api/admin/')&&!authorized(req)){send(res,401,{error:'Chave da equipe inválida.'});return;}
   if(p==='/api/tables'&&req.method==='GET'){send(res,200,{tables:await store.availability(url.searchParams.get('start'),Number(url.searchParams.get('guests'))),serverNow:new Date(clock()).toISOString()});return;}
   if(p==='/api/reservations'&&req.method==='POST'){send(res,201,await store.reserve(await body(req)));return;}
   if(p==='/api/admin/reservations'&&req.method==='GET'){send(res,200,{reservations:await store.list()});return;}
   const match=p.match(/^\/api\/admin\/reservations\/([a-f0-9-]+)\/(checkin|checkout|cancel)$/);
   if(match&&req.method==='POST'){send(res,200,await store.transition(match[1],match[2]));return;}
   send(res,404,{error:'Rota não encontrada.'});return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  if(!assets[p]){res.writeHead(404);res.end('Arquivo não encontrado');return;}
  const content=await fs.readFile(path.join(root,assets[p]));res.writeHead(200,{'Content-Type':types[path.extname(assets[p])],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:content);
 }catch(error){if(!error.status)console.error('Erro interno:',error.message);send(res,error.status||500,{error:error.status?error.message:'Não foi possível concluir. Tente novamente.'});}});
}
if(require.main===module){const port=Number(process.env.PORT||5173);if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT inválida');const adminKey=process.env.ADMIN_KEY||randomBytes(24).toString('hex');const server=createApp({adminKey});server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Porta ${port} em uso. Feche o outro servidor.`:error.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`Café Aurora: http://localhost:${port}\nEquipe: http://localhost:${port}/admin.html\nChave da equipe (uso local): ${adminKey}\nReservas salvas no servidor. Ctrl+C para encerrar.`));}
module.exports={createApp};
