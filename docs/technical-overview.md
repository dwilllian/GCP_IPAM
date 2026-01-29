# GCP Serverless IPAM & Network Automator — Documentação Técnica

> **Escopo**: Esta documentação descreve a arquitetura, componentes, fluxos, banco de dados, API, integrações GCP e procedimentos operacionais do produto.

## 1) Visão geral do produto

O **GCP Serverless IPAM & Network Automator** é um control-plane serverless para **IP Address Management (IPAM)** e automação de rede em Google Cloud. O objetivo é:
- Alocar e gerenciar blocos CIDR de forma centralizada.
- Validar conflitos de endereçamento com inventário e alocações existentes.
- Automatizar criação/remoção de subnets (incluindo Shared VPC).
- Manter inventário de recursos e trilhas de auditoria.
- Integrar com IPAM do Google GDCH via proxy autenticado no Cloud Run.

O backend principal roda em **Cloud Run** com **Node.js 20 + TypeScript + Fastify**, usando **PostgreSQL** como banco transacional e **Cloud Tasks** para jobs.

## 2) Estrutura do repositório

```
/services/ipam-control-plane
  /src
    /api          # Rotas HTTP (Fastify)
    /flows        # Fluxos de negócio (allocation, discovery, deletion)
    /gcp          # Integrações com APIs GCP (inclui proxy GDCH IPAM)
    /db           # Acesso ao banco (queries)
    /utils        # Utilitários (CIDR, config)
/db/migrations    # Migrations SQL
/scripts          # Scripts de provisionamento/deploy/teste
/contract         # Exemplos de chamadas HTTP
/docs/research    # Pesquisas e notas (Infoblox, GDCH)
```

## 3) Componentes e responsabilidades

### 3.1 Cloud Run (ipam-control-plane)
- API HTTP do IPAM (alocação, validação, inventário, auditoria, jobs e proxy GDCH).
- Integração com GCP (Compute, Resource Manager, Tasks).
- Execução dos fluxos de automação (create/delete subnet, discovery).

### 3.2 PostgreSQL
- Estado persistente do IPAM: pools, allocations, inventário e auditoria.
- Locking via **advisory lock** para concorrência de alocação.

### 3.3 Cloud Tasks
- Orquestração de jobs assíncronos (ex.: discovery).

### 3.4 GCP IPAM (GDCH)
- Chamadas via `POST /gcp/ipam/proxy` usando token do metadata server (Cloud Run).

## 4) Banco de dados (schema)

### 4.1 Tabelas principais

#### `ipam_pools`
- **id** (uuid) — PK
- **name** (text, unique)
- **parent_cidr** (cidr) — bloco CIDR pai do pool
- **allowed_prefixes** (int[]) — tamanhos permitidos para alocação (ex.: 22, 24)
- **cursor_ip** (inet) — cursor usado no algoritmo first-fit
- **created_at / updated_at** (timestamptz)

#### `ipam_allocations`
- **id** (uuid) — PK
- **pool_id** (uuid) — FK `ipam_pools`
- **cidr** (cidr) — bloco alocado
- **status** (text) — `reserved|active|released`
- **owner** (text) — time/sistema responsável
- **purpose** (text) — finalidade
- **host_project_id** (text) — Shared VPC host project
- **service_project_id** (text) — Shared VPC service project
- **network** (text) — VPC
- **region** (text)
- **metadata** (jsonb) — atributos livres (app, ambiente, tenant, etc.)
- **expires_at** (timestamptz) — expiração de reserva
- **created_at / updated_at** (timestamptz)

#### `inv_used_cidrs`
- Inventário consolidado (subnets primárias/secundárias, routes, allocations).

#### `jobs`
- Execução e tracking de jobs (discovery, etc.).

#### `audit_events`
- Trilhas de auditoria de ações.

### 4.2 Migrations
- `001_init.sql` — schema base.
- `002_allocation_metadata.sql` — `service_project_id`, `metadata`, `expires_at`.

## 5) API (Fastify)

### 5.1 IPAM
- `GET /ipam/pools`
- `POST /ipam/pools`
- `POST /ipam/allocate`
- `POST /ipam/validate-cidr`
- `GET /ipam/allocations`
- `GET /ipam/pools/:name/summary` — métricas de utilização (total/alocado/livre e por status)

### 5.2 Inventário
- `GET /inventory/used-cidrs`
- `GET /inventory/subnets`
- `GET /inventory/routes`

### 5.3 Network
- `POST /network/subnets/create`

### 5.4 Jobs
- `POST /jobs/discovery/run`

### 5.5 Auditoria
- `GET /audit`

### 5.6 Proxy GDCH IPAM (GCP)
- `POST /gcp/ipam/proxy`
  - Faz chamadas autenticadas para o IPAM GDCH.
  - Requer `GCP_IPAM_BASE_URL` e/ou token.

## 6) Fluxos principais

### 6.1 Alocação de CIDR (first-fit)
1. Valida pool e prefixo permitido.
2. Adquire advisory lock via `pg_advisory_xact_lock(hashtext(poolName))`.
3. Itera subnets candidatas usando cursor (`candidateSubnets`).
4. Verifica conflitos no inventário e alocações existentes.
5. Insere allocation (`status=reserved`).
6. Atualiza cursor (`nextCursorIp`).

### 6.2 Validação de CIDR
- Confronta CIDR com `inv_used_cidrs` e `ipam_allocations`.

### 6.3 Discovery
- Job que coleta subnets/routes de projetos/hosts e alimenta `inv_used_cidrs`.

## 7) Integrações GCP

### 7.1 Autenticação
- Token obtido via metadata server do Cloud Run (`computeMetadata/v1/instance/service-accounts/default/token`).
- Alternativamente, pode usar `GCP_IPAM_ACCESS_TOKEN`.

### 7.2 IPAM GDCH Proxy
- `ipamRequest()` usa `GCP_IPAM_BASE_URL` + `path` definido pelo cliente.
- Timeout configurável (`GCP_IPAM_TIMEOUT_MS`).

### 7.3 Shared VPC
- A alocação já registra `host_project_id` e `service_project_id`.

## 8) Configuração (env vars)

- `DATABASE_URL`
- `TASKS_QUEUE_NAME`
- `TASKS_LOCATION`
- `TASKS_PROJECT_ID`
- `TASKS_SERVICE_URL`
- `TASKS_SERVICE_ACCOUNT`
- `GCP_IPAM_BASE_URL`
- `GCP_IPAM_ACCESS_TOKEN` (opcional)
- `GCP_IPAM_TIMEOUT_MS`
- `MOCK_GCP=true`

## 9) Scripts

- `00_enable_apis.sh` — habilita APIs GCP.
- `01_create_sql.sh` — cria Cloud SQL.
- `02_create_redis.sh` — opcional.
- `03_create_tasks.sh` — cria Cloud Tasks.
- `04_deploy_run.sh` — deploy Cloud Run.
- `05_smoke_test.sh` — smoke test básico.
- `08_gcp_ipam_proxy_test.sh` — teste rápido do proxy GDCH IPAM.

## 10) Observabilidade e auditoria

- `audit_events` captura ações relevantes.
- Recomenda-se: logs estruturados com request-id, latência, status e payload resumido.

## 11) Testes

- `npm run lint` — validação estática (eslint configurado).
- `05_smoke_test.sh` — sanity check de endpoints.
- `08_gcp_ipam_proxy_test.sh` — validação do proxy GDCH IPAM.

## 12) Backlog técnico (prioridades)

1. **Integração completa com GDCH IPAM**
   - Confirmar host base oficial e recursos (pools/ranges/allocations).
   - Sincronizar dados para `inv_used_cidrs`.

2. **RBAC e governança**
   - Escopos por pool/projeto/tenant.

3. **DNS automation**
   - Provisionamento e limpeza de registros DNS integrados ao ciclo de vida de subnets/allocations.

4. **SLOs e alertas**
   - Alertas de esgotamento de pool, taxa de erro, tempos de execução.

5. **Expiração automática**
   - Job para expirar reservas (`expires_at`) e liberar CIDRs.

---

**Referências internas**
- `docs/research/infoblox-vnios-google-cloud-summary.md`
- `docs/research/gdch-ipam-integration-notes.md`
