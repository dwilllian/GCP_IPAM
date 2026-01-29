# GCP Serverless IPAM & Network Automator (MVP)

Produto interno para IPAM + inventário de rede em GCP (sem Terraform), com API serverless em Cloud Run.

## Visão geral
- Alocação de CIDR com algoritmo **first-fit** + cursor (Postgres + advisory lock)
- Validação de colisões com **subnets** (primary/secondary) e **routes destRange**
- Criação/deleção de subnets em **Shared VPC** sempre no **Host Project**
- Inventário de onde cada CIDR está usado

## Estrutura do repositório
```
/services/ipam-control-plane
  /src
    /api
    /flows
      /creationFlow
      /deletionFlow
      /discoveryFlow
    /gcp
    /db
    /utils
/db
  /migrations
/scripts
/contract
```

## Serviço principal
`ipam-control-plane` (Node.js 20 + TypeScript + Fastify).

### Variáveis de ambiente
- `DATABASE_URL` (obrigatório)
- `TASKS_QUEUE_NAME` (default: ipam-control-plane)
- `TASKS_LOCATION` (default: us-central1)
- `TASKS_PROJECT_ID`
- `TASKS_SERVICE_URL`
- `TASKS_SERVICE_ACCOUNT`
- `MOCK_GCP=true` (para rodar sem chamadas reais)

### Rodar localmente
```bash
cd services/ipam-control-plane
npm install
npm run dev
```

## Banco de dados
Execute a migration em `db/migrations/001_init.sql` no Postgres.

## Scripts de deploy
Os scripts em `/scripts` criam recursos e fazem deploy no Cloud Run:
- `00_enable_apis.sh`
- `01_create_sql.sh`
- `02_create_redis.sh` (opcional)
- `03_create_tasks.sh`
- `04_deploy_run.sh`
- `05_smoke_test.sh`

## Contrato de API
Exemplos de uso em `contract/examples.http`.
