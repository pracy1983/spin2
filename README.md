# SpinSelling

Sistema de vendas baseado no projeto AskPod, utilizando Clean Architecture e princípios SOLID.

## Estrutura do Projeto

```
src/
├── application/     # Casos de uso e regras de aplicação
├── domain/         # Entidades e regras de negócio
├── infrastructure/ # Implementações concretas (banco de dados, serviços externos)
└── interfaces/     # Controllers, views e apresentação
```

## Tecnologias Utilizadas

- Python
- FastAPI
- SQLAlchemy
- Tailwind CSS
- React/Next.js

## Como Iniciar

1. Clone o repositório
2. Instale as dependências
3. Configure as variáveis de ambiente
4. Execute o servidor de desenvolvimento

## Desenvolvimento

Este projeto segue os princípios de Clean Architecture e SOLID para garantir:

- Separação clara de responsabilidades
- Independência de frameworks
- Testabilidade
- Manutenibilidade
- Flexibilidade para mudanças

## Deploy

O deploy é feito automaticamente no Netlify quando há um push para a branch master.

### Variáveis de Ambiente Necessárias

```
VITE_OPENAI_API_KEY
VITE_DEEPSEEK_API_KEY
VITE_AZURE_SPEECH_KEY
VITE_AZURE_SPEECH_REGION
VITE_AZURE_SPEECH_ENDPOINT
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```
```bash
npm install
npm run dev
