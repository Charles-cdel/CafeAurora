# Café Aurora

Landing page em português para apresentar uma cafeteria: cardápio filtrável, seleção de favoritos, história, visita, perguntas frequentes e preparação de mensagem para WhatsApp.

## Executar

Instale Node.js 18 ou superior. Na pasta do projeto:

```sh
npm install
npm run dev
```

Abra http://localhost:5173. O projeto não precisa de dependências externas. Use Ctrl+C para encerrar e atualize o navegador após editar arquivos (sem hot reload). O servidor é apenas para desenvolvimento local.

Para usar as reservas, inicie com Node (`npm run dev`); abrir o HTML diretamente ou usar um servidor estático não executa a API. `index.html` é a nova landing page. O protótipo anterior foi preservado em `demo.html`, com `demo.css` e `demo.js`; esses arquivos não são servidos pelo servidor atual.

## Reservas e painel da equipe

A página permite consultar e reservar 20 mesas: 5 casuais de 2 lugares, 5 família/amigos de 6, 5 individuais e 5 reservadas de 4. Antecedência mínima de 30 minutos e intervalo de 2 horas a partir do horário reservado, sempre no fuso de Fortaleza.

Execute `npm run dev`. O terminal exibe o endereço `/admin.html` e uma chave da equipe, gerada a cada inicialização. Abra esse endereço e informe a chave para registrar chegada, confirmar saída ou cancelar uma reserva. Ela fica apenas na memória da página. Para fixar uma chave, configure `ADMIN_KEY` no ambiente antes de iniciar; nunca a envie ao GitHub.

Reservas aguardando chegada bloqueiam o intervalo reservado. Quando seu horário começa, permanecem bloqueadas até a equipe confirmar saída ou cancelar. Ocupadas bloqueiam novos agendamentos até saída confirmada. O limite de 2 horas gera alerta, sem liberar automaticamente. Mesmo reservas sem comparecimento exigem ação da equipe. Não há expiração automática.

Os dados ficam em `data/reservations.json`, ignorado pelo Git. Apagar o clone também apaga esse arquivo: preserve uma cópia se necessário. Não execute dois processos sobre o mesmo arquivo. Para alterar o caminho, configure `RESERVATIONS_FILE`. Os dados nunca são servidos como arquivos públicos; a listagem com nomes e telefones exige a chave da equipe.

`npm test` verifica regras e API. Esta é uma primeira implementação local, com persistência em arquivo e escritas serializadas em um único processo. Antes de publicar para clientes: migrar para banco transacional, autenticação individual, HTTPS, política de privacidade/retenção, backups, horários/feriados da unidade e revisão operacional. Por não haver horário comercial confirmado, o sistema ainda não restringe dias ou horários de funcionamento. Não pressupõe que a unidade esteja aberta.

## Personalizar para uma cafeteria real

1. Substitua as fotos de referência por fotografias dos produtos e do estabelecimento, com autorização de uso.
2. Valide produtos, preços, ingredientes e alergênicos com a operação.
3. Preencha endereço, horários e dados comerciais reais no HTML.
4. Configure `BUSINESS.whatsapp` em `script.js` com país e DDD, somente números. Sem número, a página apenas prepara a mensagem e informa que nada foi enviado.
5. Revise o conteúdo, os dispositivos alvo e as informações de privacidade antes da publicação.

O formulário de contato apenas prepara uma mensagem. O formulário de reservas consulta a API e salva nome, telefone e agendamento no servidor. Favoritos existem apenas na memória da página. Imagens são carregadas de domínio externo; exigem conexão e enviam a esse provedor os dados usuais da requisição. Sem JavaScript, o conteúdo institucional funciona, mas cardápio interativo e formulário não ficam operacionais.

## Interface

Layout fluido com ajustes em 1500, 1000, 700 e 380 px, navegação móvel com Escape, foco visível, labels, estados `aria-pressed`, imagens com dimensões e lazy loading fora do destaque, transições e revelação por IntersectionObserver. Respeita `prefers-reduced-motion`; o conteúdo institucional permanece visível sem suporte ao observer.

Veja [análise comercial e plano de back-end](docs/PROJETO.md) e [fontes das fotos](docs/IMAGENS.md).

## Direção visual: Aurora Experience

Abertura fotográfica em tela ampla, paleta espresso/cobre, navegação fixa com transparência, indicador de leitura e três cenas escolhidas manualmente. Faixa decorativa em movimento, entrada das seções na rolagem e cartões com zoom, iluminação e inclinação sutil seguindo o ponteiro.

O botão Explorar abre detalhes do produto em uma janela com foto ampliada, preço e favoritos sincronizados com o formulário de contato. Fecha pelo botão, Escape ou clique fora; a ação de reserva leva ao formulário. Em telas de toque, o botão fica sempre visível. `prefers-reduced-motion` desliga movimento contínuo, inclinação e transições. As fotos seguem sendo referências externas e os dados comerciais precisam de confirmação.

As verificações de sintaxe, âncoras e regras de reserva passaram. A revisão visual de recortes, sobreposições e interação em dispositivos reais ainda é necessária: o navegador de teste não pôde ser instalado neste ambiente.

## GitHub Pages

`npm run build:pages` gera `dist/` com apenas a landing page pública (HTML, CSS, JavaScript e .nojekyll). Na exportação, o formulário de reservas é substituído por uma apresentação das mesas com aviso de indisponibilidade. O painel, API, dados e arquivos de demonstração não são incluídos. O site funciona no subcaminho `/CafeAurora/`, com recursos relativos.

A branch `gh-pages` contém essa exportação. Em Settings → Pages, selecione Deploy from a branch → gh-pages → / (root) → Save. Para publicar novas alterações, gere novamente a exportação e atualize essa branch com os quatro arquivos; alterar somente main não atualiza a exportação. A publicação inicial pode levar alguns minutos.

Para reservas reais na internet será necessário hospedar o servidor e banco em uma plataforma que execute Node e então conectar a página à API. GitHub Pages não executa esse servidor. O desenvolvimento local com npm run dev mantém a API e as reservas completas.
