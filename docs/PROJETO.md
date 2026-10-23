# Análise e evolução comercial

## Diagnóstico do repositório original

Base analisada: main, commit 070b64378e554d6637a4fca6b7e43ed4bc91ce84.

Pontos positivos: HTML, CSS e JavaScript separados, identidade consistente, navegação móvel, tratamento de texto antes de inserir dados e fluxo demonstrativo de reservas.

Lacunas para venda a uma cafeteria:
- Produtos representados por emojis e destaque desenhado em CSS, sem fotografias que permitam avaliar o produto.
- Página comercial misturada com conta de cliente e painel administrativo.
- Login permite escolher administrador, sem autenticação. Ocultar painel não resolveria autorização.
- Clientes, preços e reservas em localStorage: sem fonte compartilhada, integridade ou controle de acesso.
- Confirmação local pode gerar expectativa de reserva real. Não há proteção contra concorrência entre dispositivos.
- Horário informado fecha às segundas, mas a disponibilidade não bloqueia segunda-feira.
- Edição de preços usa prompt; logout recebe listener antes da criação dinâmica do botão.
- Ausência de dados comerciais confirmados e documentação de implantação.

## Entrega

Landing page com paleta creme/verde/terracota, tipografia editorial, fotografia, CTAs, categorias do cardápio, favoritos, FAQ e preparação de mensagem. Conteúdo demonstrativo claramente identificado. Proposta de posicionamento: uma pausa acolhedora para café e encontros.

O protótipo antigo foi preservado, sem ligação na navegação comercial. Não deve ser publicado como sistema real. Para produção, excluir arquivos demo da publicação ou manter em ambiente de demonstração separado.

## Escopo comercial inicial

Primeira versão vendável: apresentação, cardápio atualizado e contato da unidade. Não exige login de clientes, checkout ou reservas automáticas. Antes do lançamento: dados reais, fotos próprias, revisão de ingredientes/alergênicos, avaliação de contraste e acessibilidade com pessoas, validação nos navegadores suportados e domínio/HTTPS. Não inventar avaliações de clientes, certificações ou números de vendas.

## Primeiros passos do back-end

1. **Definir regras com o responsável:** haverá apenas contato, solicitação de reserva ou confirmação automática? Quantas mesas, duração, tolerância, antecedência, dias fechados, feriados e política de cancelamento? Quem pode editar preços?
2. **Primeiro incremento:** API de cardápio e painel com acesso da equipe. Uma implementação possível é Node.js + TypeScript e PostgreSQL; escolher versões suportadas ao iniciar. Manter o front-end atual e trocar a lista local por GET /api/products.
3. **Modelar dados:** categories; products (id, category_id, name, description, price_cents, image_url, active, allergens); business_settings; opening_hours; staff_users; audit_log. Usar valores monetários em centavos. Migrações versionadas e seed separado de produção.
4. **Autenticar a equipe:** preferir autenticação gerenciada, autorização no servidor por função, sessões seguras, limitação de tentativas e nenhuma credencial no JavaScript. Escritas administrativas protegidas e registradas em auditoria.
5. **Contrato inicial:** GET /api/products e GET /api/business públicos; POST/PATCH/DELETE /api/admin/products para equipe autorizada. Validar entradas no servidor, limitar requisições, tratar falhas e fornecer estados de carregamento/erro no front-end.
6. **Reservas em segundo incremento:** tables, closures e reservations (table_id, start_at, end_at, guests, contact, status). GET /api/availability e POST /api/reservations. Validar horários e lotação no servidor. Usar transação e restrição de exclusão por mesa/intervalo no PostgreSQL, considerando estados que ocupam mesa; duas requisições simultâneas devem resultar em uma confirmação e um conflito 409. Não usar apenas uma consulta seguida de insert sem proteção. Empregar chave de idempotência para repetições.
7. **Operação:** horários da unidade no fuso America/Fortaleza, instantes armazenados com timezone, notificações somente após gravação e distinção entre solicitada/confirmada/cancelada. Cancelamento com autorização ou token não previsível.
8. **Implantação:** ambientes de homologação e produção, HTTPS, segredos no servidor, backup com teste de restauração, monitoramento e retenção mínima de dados pessoais. Publicar aviso de privacidade compatível com o fluxo realmente implementado.

## Critérios de aceite do back-end

Cardápio consistente entre dispositivos; edição administrativa negada a visitante; preços inválidos rejeitados; reserva em dia fechado ou passada recusada; concorrência de reservas coberta; repetição de envio não duplica registro; cancelamento libera disponibilidade; falha de notificação não perde reserva. Não adicionar pagamentos até existir necessidade operacional definida.
