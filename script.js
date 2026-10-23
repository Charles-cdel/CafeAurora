'use strict';
// Configure apenas com o número comercial autorizado, incluindo código do país e DDD.
const BUSINESS = Object.freeze({ whatsapp: '' });
const products = [
 {id:'espresso',name:'Espresso Aurora',category:'cafes',price:8,description:'Curto, intenso e cheio de aroma. Um clássico para a sua pausa.',photo:'photo-1510707577719-ae7c14805e3a',alt:'Café espresso em xícara sobre um pires',badge:'O CLÁSSICO'},
 {id:'latte',name:'Latte da casa',category:'cafes',price:14,description:'Café com leite cremoso. A combinação que abraça o dia.',photo:'photo-1461023058943-07fcbe16d735',alt:'Bebida de café com leite servida em um copo',badge:'PAUSA CREMOSA'},
 {id:'croissant',name:'Croissant amanteigado',category:'forno',price:12,description:'Camadas delicadas e douradas para acompanhar seu café.',photo:'photo-1555507036-ab1f4038808a',alt:'Croissants dourados com camadas de massa folhada',badge:'DO FORNO'},
 {id:'bolo',name:'Bolo de chocolate',category:'doces',price:18,description:'Chocolate e uma boa conversa. Uma dupla difícil de resistir.',photo:'photo-1578985545062-69928b1d9587',alt:'Bolo de chocolate com cobertura de chocolate',badge:'DOCE PAUSA'},
 {id:'coado',name:'Café coado',category:'cafes',price:10,description:'Um ritual simples, preparado para ser apreciado sem pressa.',photo:'photo-1495474472287-4d71bcdd2085',alt:'Preparo de café coado com filtro sobre uma jarra',badge:'SEM PRESSA'},
 {id:'pao',name:'Pão artesanal',category:'forno',price:14,description:'Uma proposta de acompanhamento para dividir bons momentos.',photo:'photo-1509440159596-0249088772ff',alt:'Pães artesanais com crosta dourada',badge:'PARA COMPARTILHAR'}
];
const favorites = new Set();
const grid = document.querySelector('#products');
const money = value => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
products.forEach(product => {
 const article = document.createElement('article');
 article.className='product reveal'; article.dataset.category=product.category;
 article.innerHTML=`<div class="product-image"><img src="https://images.unsplash.com/${product.photo}?auto=format&fit=crop&w=650&q=80" alt="${product.alt}" width="650" height="650" loading="lazy"><span class="product-badge">${product.badge}</span><button class="quick-view" data-view="${product.id}" aria-label="Ver detalhes de ${product.name}">Explorar <span>↗</span></button></div><div class="product-line"><h3>${product.name}</h3><span class="price">${money(product.price)}</span></div><p>${product.description}</p><button class="favorite" data-id="${product.id}" aria-pressed="false" aria-label="Adicionar ${product.name} aos favoritos">Adicionar aos favoritos +</button>`;
 grid.append(article);
});
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');}
toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();toggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
window.matchMedia('(min-width: 701px)').addEventListener('change',closeMenu);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
 let count=0;grid.querySelectorAll('.product').forEach(item=>{item.hidden=button.dataset.filter!=='todos'&&item.dataset.category!==button.dataset.filter;if(!item.hidden)count++;});
 document.querySelector('#filter-status').textContent=`${count} produtos na categoria ${button.textContent}.`;
}));
let toastTimeout;
function toast(text){const target=document.querySelector('#toast');target.textContent=text;target.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>target.classList.remove('show'),2600);}
grid.addEventListener('click',event=>{
 const button=event.target.closest('[data-id]');if(!button)return;
 const product=products.find(item=>item.id===button.dataset.id);
 if(favorites.has(product.id))favorites.delete(product.id);else favorites.add(product.id);
 const active=favorites.has(product.id);button.setAttribute('aria-pressed',String(active));button.textContent=active?'Nos seus favoritos ✓':'Adicionar aos favoritos +';button.setAttribute('aria-label',`${active?'Remover':'Adicionar'} ${product.name} ${active?'dos':'aos'} favoritos`);
 document.querySelector('#favorites').textContent=favorites.size?`Seus favoritos: ${products.filter(item=>favorites.has(item.id)).map(item=>item.name).join(', ')}.`:'Nenhum favorito selecionado. Explore o cardápio para adicionar.';
 document.querySelector('#contact-result').replaceChildren();toast(active?'Adicionado à sua seleção.':'Removido da sua seleção.');
});
document.querySelector('#contact-form').addEventListener('submit',event=>{
 event.preventDefault();const name=document.querySelector('#name').value.trim();if(!name){document.querySelector('#name').setCustomValidity('Digite seu primeiro nome.');document.querySelector('#name').reportValidity();return;}
 const selection=products.filter(item=>favorites.has(item.id)).map(item=>item.name).join(', ');
 const message=`Olá! Meu nome é ${name}. Gostaria de conversar sobre: ${document.querySelector('#occasion').value}.${selection?` Meus favoritos: ${selection}.`:''}\n${document.querySelector('#message').value.trim()}`;
 const result=document.querySelector('#contact-result');result.replaceChildren();result.className='contact-result';
 const notice=document.createElement('p');notice.textContent=BUSINESS.whatsapp?'Mensagem pronta. Envie para a equipe consultar o atendimento.':'Mensagem preparada abaixo. O WhatsApp comercial ainda não está configurado; nada foi enviado.';result.append(notice);
 const preview=document.createElement('p');preview.textContent=message;result.append(preview);
 if(/^\d{10,15}$/.test(BUSINESS.whatsapp)){const link=document.createElement('a');link.className='button light';link.href=`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Enviar pelo WhatsApp ↗';result.append(link);}
});
document.querySelector('#name').addEventListener('input',event=>event.target.setCustomValidity(''));
document.querySelector('#contact-form').addEventListener('input',()=>document.querySelector('#contact-result').replaceChildren());
document.querySelector('#year').textContent=new Date().getFullYear();
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
 document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(item=>observer.observe(item));
}

// Destaques, detalhes e movimento progressivo: navegação manual, sem autoplay.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const scenes = [
 {photo:'photo-1511081692775-05d0f180a065',alt:'Café com leite cremoso em uma mesa',caption:'O ritual do primeiro gole',description:'O primeiro gole muda o ritmo. Encontre o seu momento entre um café, um sabor e uma boa conversa.'},
 {photo:'photo-1555507036-ab1f4038808a',alt:'Croissants dourados de massa folhada',caption:'Pequenos sabores. Grandes pausas.',description:'Camadas, aromas e aquela primeira mordida. Escolha um acompanhamento e deixe a conversa acontecer.'},
 {photo:'photo-1501339847302-ac426a4a7cbb',alt:'Ambiente de cafeteria com mesas e plantas',caption:'Um lugar para ficar mais um pouco',description:'Uma mesa, sua companhia favorita e tempo para estar presente. Seu próximo encontro começa aqui.'}
];
let sceneVersion=0;
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.scene),scene=scenes[index],version=++sceneVersion,photo=document.querySelector('#hero-photo');
 document.querySelectorAll('[data-scene]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
 const preload=new Image();preload.onload=()=>{if(version!==sceneVersion)return;photo.src=preload.src;photo.alt=scene.alt;document.querySelector('#hero-description').textContent=scene.description;document.querySelector('#hero-caption').textContent=scene.caption;document.querySelector('#hero-number').textContent=`0${index+1} / 03`;if(!reducedMotion.matches)photo.animate([{opacity:.4,transform:'scale(1.035)'},{opacity:1,transform:'scale(1)'}],{duration:700,easing:'ease-out'});};preload.onerror=()=>toast('Não foi possível carregar a foto. Tente novamente.');preload.src=`https://images.unsplash.com/${scene.photo}?auto=format&fit=crop&w=1800&q=85`;
}));
const detailDialog=document.querySelector('#product-dialog');let detailProduct=null,detailTrigger=null;
function updateDetailFavorite(){const active=favorites.has(detailProduct.id);const button=document.querySelector('#detail-favorite');button.textContent=active?'Remover dos favoritos −':'Adicionar aos favoritos +';button.setAttribute('aria-pressed',String(active));}
grid.addEventListener('click',event=>{const button=event.target.closest('[data-view]');if(!button)return;detailProduct=products.find(item=>item.id===button.dataset.view);detailTrigger=button;document.querySelector('#detail-name').textContent=detailProduct.name;document.querySelector('#detail-description').textContent=detailProduct.description;document.querySelector('#detail-price').textContent=money(detailProduct.price);const image=document.querySelector('#detail-image');image.src=`https://images.unsplash.com/${detailProduct.photo}?auto=format&fit=crop&w=900&q=85`;image.alt=detailProduct.alt;updateDetailFavorite();detailDialog.showModal();});
document.querySelector('#detail-favorite').addEventListener('click',()=>{grid.querySelector(`[data-id="${detailProduct.id}"]`).click();updateDetailFavorite();});
document.querySelector('.dialog-close').addEventListener('click',()=>detailDialog.close());
document.querySelector('#detail-reserve').addEventListener('click',()=>{detailDialog.close();requestAnimationFrame(()=>document.querySelector('#reserve-name')?.focus({preventScroll:true}));});
detailDialog.addEventListener('click',event=>{if(event.target===detailDialog){const rect=detailDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)detailDialog.close();}});
detailDialog.addEventListener('close',()=>{if(detailTrigger)detailTrigger.focus({preventScroll:true});});
// Inclinação leve e luz seguem o ponteiro; sem efeitos dependentes do mouse no celular.
grid.querySelectorAll('.product').forEach(card=>{
 let frame=0;
 card.addEventListener('pointermove',event=>{if(!finePointer.matches||reducedMotion.matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const rect=card.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;card.style.setProperty('--tilt-x',`${(0.5-y)*4}deg`);card.style.setProperty('--tilt-y',`${(x-0.5)*4}deg`);card.style.setProperty('--light-x',`${x*100}%`);card.style.setProperty('--light-y',`${y*100}%`);});});
 card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
});
let scrollFrame=0;
function updateScroll(){scrollFrame=0;const range=document.documentElement.scrollHeight-innerHeight;document.querySelector('.scroll-progress').style.transform=`scaleX(${range>0?scrollY/range:0})`;document.querySelector('.header').classList.toggle('scrolled',scrollY>35);}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});window.addEventListener('resize',updateScroll);updateScroll();
if('IntersectionObserver' in window){const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;document.querySelectorAll('#navigation a').forEach(link=>{const current=link.getAttribute('href')===`#${entry.target.id}`;if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}),{rootMargin:'-20% 0px -55% 0px',threshold:0});document.querySelectorAll('main section[id]').forEach(section=>sectionObserver.observe(section));}
