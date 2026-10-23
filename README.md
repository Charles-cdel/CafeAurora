# Café Aurora

Landing page em português para apresentar uma cafeteria: cardápio filtrável, seleção de favoritos, história, visita, perguntas frequentes e preparação de mensagem para WhatsApp.

## Executar

Instale Node.js 18 ou superior. Na pasta do projeto:

```sh
npm install
npm run dev
```

Abra http://localhost:5173. O projeto não precisa de dependências externas. Use Ctrl+C para encerrar e atualize o navegador após editar arquivos (sem hot reload). O servidor é apenas para desenvolvimento local.

Alternativa com Python: `python -m http.server 8080`, acessando http://localhost:8080. `index.html` é a nova landing page. O protótipo anterior foi preservado em `demo.html`, com `demo.css` e `demo.js`; é uma demonstração insegura para produção e não está vinculado pela landing page.

## Personalizar para uma cafeteria real

1. Substitua as fotos de referência por fotografias dos produtos e do estabelecimento, com autorização de uso.
2. Valide produtos, preços, ingredientes e alergênicos com a operação.
3. Preencha endereço, horários e dados comerciais reais no HTML.
4. Configure `BUSINESS.whatsapp` em `script.js` com país e DDD, somente números. Sem número, a página apenas prepara a mensagem e informa que nada foi enviado.
5. Revise o conteúdo, os dispositivos alvo e as informações de privacidade antes da publicação.

O formulário não faz requisições a uma API, não armazena dados pessoais e não confirma reservas. Favoritos existem apenas na memória da página. Imagens são carregadas de domínio externo; exigem conexão e enviam a esse provedor os dados usuais da requisição. Sem JavaScript, o conteúdo institucional funciona, mas cardápio interativo e formulário não ficam operacionais.

## Interface

Layout fluido com ajustes em 1500, 1000, 700 e 380 px, navegação móvel com Escape, foco visível, labels, estados `aria-pressed`, imagens com dimensões e lazy loading fora do destaque, transições e revelação por IntersectionObserver. Respeita `prefers-reduced-motion`; o conteúdo institucional permanece visível sem suporte ao observer.

Veja [análise comercial e plano de back-end](docs/PROJETO.md) e [fontes das fotos](docs/IMAGENS.md).
