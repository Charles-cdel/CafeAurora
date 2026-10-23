'use strict';
// Exporta apenas a apresentação pública. O GitHub Pages não executa a API Node.
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});
 let html=await fs.readFile(path.join(root,'index.html'),'utf8');
 html=html.replace('<script src="booking.js" defer></script>','');
 html=html.replace(/<form id="reservation-form"[\s\S]*?<\/form>/,`<div class="booking-form"><span class="eyebrow">CONHEÇA NOSSAS MESAS</span><h3>Um lugar para cada momento.</h3><p>5 mesas casuais para 2 pessoas, 5 para família e amigos com 6 lugares, 5 individuais e 5 mais reservadas para 4 pessoas.</p><p role="status">Esta é a apresentação pública da Aurora. As reservas online ainda não estão disponíveis neste endereço.</p><a class="button" href="#contato">Planejar minha visita ↗</a><p class="disclaimer">Nenhuma reserva é criada ou confirmada nesta página. Consulte a equipe quando o atendimento estiver disponível.</p></div>`);
 html=html.replace('Sim. Escolha a data, consulte as mesas disponíveis e confirme sua reserva na seção Reservar mesa. A antecedência mínima é de 30 minutos e a permanência é de até 2 horas a partir do horário reservado.','As reservas online ainda não estão disponíveis neste endereço. Esta página apresenta a cafeteria e suas mesas; nenhuma reserva é confirmada aqui.');
 await fs.writeFile(path.join(out,'index.html'),html);
 for(const file of ['style.css','script.js'])await fs.copyFile(path.join(root,file),path.join(out,file));
 await fs.writeFile(path.join(out,'.nojekyll'),'');
 console.log('Pronto: dist/index.html, style.css, script.js e .nojekyll. Sem API, dados ou painel.');
})().catch(error=>{console.error(error);process.exitCode=1;});
