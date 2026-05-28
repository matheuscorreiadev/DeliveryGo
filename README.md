# DeliveryGo Menu QR

MVP de SaaS para cardapio digital por QR Code. Restaurantes editam dados, itens,
precos e disponibilidade no painel. O cliente abre o QR da mesa no navegador,
sem baixar app.

## Rodar localmente

```powershell
node server.cjs
```

Depois acesse:

```text
http://localhost:5173
```

## O que ja esta pronto

- Painel do restaurante com dados operacionais, visitas, status do cardapio e QR principal.
- Editor de cardapio com categorias, preco, descricao e disponibilidade.
- QR por mesa apontando para a URL publica com `?mesa=XX#public`.
- Menu publico responsivo com carrinho simples e envio por WhatsApp.
- Persistencia em `localStorage` para demonstrar atualizacao imediata.

## Proximo passo para virar SaaS

- Autenticacao para restaurantes.
- Banco de dados com restaurantes, unidades, mesas e itens.
- Dominio publico por restaurante, exemplo: `cliente.deliverygo.com.br/m/01`.
- Assinatura recorrente com Stripe, Mercado Pago ou Asaas.
- Area admin para planos, clientes inadimplentes e suporte.
