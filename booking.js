'use strict';
(()=>{
 const form=document.querySelector('#reservation-form'),start=document.querySelector('#reserve-start'),guests=document.querySelector('#reserve-guests'),map=document.querySelector('#table-map'),message=document.querySelector('#availability-message'),result=document.querySelector('#reservation-result'),submit=document.querySelector('#reserve-submit'),check=document.querySelector('#check-tables');
 let selected=null,queried=null,requestId=crypto.randomUUID(),busy=false,revision=0;
 // datetime-local representa sempre o relógio da unidade (UTC-03), independente do dispositivo.
 const dateText=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(value).replace(' ','T');
 const updateMin=()=>{start.min=dateText(new Date(Date.now()+31*60000));};updateMin();start.value=start.min;
 const slot=()=>({start:start.value?`${start.value}:00-03:00`:'',guests:Number(guests.value)});
 function invalidate(){revision++;selected=null;queried=null;map.replaceChildren();submit.disabled=true;message.textContent='Consulte as mesas para o novo horário e tamanho do grupo.';requestId=crypto.randomUUID();}
 start.addEventListener('change',invalidate);guests.addEventListener('change',invalidate);
 for(const id of ['reserve-name','reserve-phone'])document.querySelector('#'+id).addEventListener('input',()=>{requestId=crypto.randomUUID();result.textContent='';});
 async function api(url,options){const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível concluir.');return data;}
 async function consult(){if(busy)return;updateMin();if(!start.reportValidity())return;const current=slot(),version=++revision;check.disabled=true;message.textContent='Consultando mesas…';submit.disabled=true;selected=null;queried=null;map.replaceChildren();
  try{const data=await api(`/api/tables?${new URLSearchParams(current)}`);if(version!==revision)return;queried=current;
   for(const category of ['casual','familia','individual','reservada']){const tables=data.tables.filter(t=>t.category===category);const group=document.createElement('div');group.className='table-group';const heading=document.createElement('h3');heading.textContent=`${tables[0].categoryName} · ${tables[0].seats} cadeira(s)`;group.append(heading);const row=document.createElement('div');row.className='table-row';
    for(const table of tables){const label=document.createElement('label');label.className='table-choice'+(table.available?'':' unavailable');const radio=document.createElement('input');radio.type='radio';radio.name='table';radio.value=table.id;radio.disabled=!table.available;radio.addEventListener('change',()=>{selected=table.id;submit.disabled=false;requestId=crypto.randomUUID();});const text=document.createElement('span');text.textContent=`${table.id} · ${table.available?'Livre':'Indisponível'}`;label.append(radio,text);row.append(label);}group.append(row);map.append(group);
   }message.textContent=`${data.tables.filter(t=>t.available).length} mesas disponíveis para esse horário e grupo. A disponibilidade será validada novamente ao confirmar.`;
  }catch(error){if(version===revision)message.textContent=error.message;}finally{check.disabled=false;}
 }
 check.addEventListener('click',consult);
 form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!selected||!queried)return;busy=true;submit.disabled=true;check.disabled=true;result.textContent='Confirmando sua reserva…';
  try{const receipt=await api('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...queried,tableId:selected,name:document.querySelector('#reserve-name').value.trim(),phone:document.querySelector('#reserve-phone').value.trim(),requestId})});result.textContent=`Reserva confirmada! Código: ${receipt.id}. Mesa ${receipt.tableId}. ${new Date(receipt.start).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'})} até ${new Date(receipt.end).toLocaleTimeString('pt-BR',{timeZone:'America/Fortaleza',hour:'2-digit',minute:'2-digit'})}. Guarde este código e apresente à equipe.`;invalidate();message.textContent='Sua reserva foi registrada no servidor. Consulte novamente para outra reserva.';
  }catch(error){result.textContent=error.message+' Se houve falha de conexão, tente novamente sem alterar os dados para recuperar o mesmo envio.';submit.disabled=!selected;}finally{busy=false;check.disabled=false;}
 });
})();
