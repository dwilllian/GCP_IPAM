# Tecnologias recomendadas para o backend e descoberta de rede

Este documento reúne opções práticas (com base em serviços GCP e padrões já previstos no repositório) para
implementar o backend do IPAM, manter o inventário de rede atualizado e suportar o dashboard. A ideia é
servir como guia técnico para implementação, com alternativas quando necessário.

## 0) Stack escolhida (implementada no repositório)

Esta é a combinação **adotada no código atual** e considerada a melhor opção para o projeto:
- **API/Control-plane:** Cloud Run + Node.js (Fastify/TypeScript).
- **Banco:** PostgreSQL (Cloud SQL).
- **Jobs de discovery:** Cloud Tasks + rotas `/jobs/discovery/*`.
- **Integração IPAM:** Proxy GDCH (`/gcp/ipam/proxy`).

Arquivos de referência:
- `services/ipam-control-plane/src` (API, flows e integrações).
- `db/migrations` (schema do Postgres).
- `docs/technical-overview.md` (arquitetura detalhada).

## 1) Camada de API (control-plane)

### Opção principal (recomendada)
- **Cloud Run + Node.js (Fastify/TypeScript)**: API HTTP do IPAM, inventário, jobs e proxy GDCH.
- **Por quê**: custo sob demanda, cold start baixo, integração nativa com IAM/metadata server e boa maturidade
  para workloads HTTP stateless.
- **Boas práticas**:
  - Separar módulos de API, discovery e proxy para reduzir acoplamento.
  - Limitar timeouts e payloads para evitar impacto em alocações.
  - Log estruturado (request-id, latência, status, pool/projeto).

### Alternativas (GCP)
- **Cloud Run + Python (FastAPI)**: mesma arquitetura, com stack Python.
- **GKE Autopilot**: útil se houver necessidade de sidecars, long-running processes ou controle de rede avançado.
- **App Engine**: opção PaaS tradicional, mas menos flexível que Cloud Run.

## 2) Banco de dados (estado e inventário)

### Opção principal (recomendada)
- **PostgreSQL (Cloud SQL)**:
  - Tabelas de estado (`ipam_pools`, `ipam_allocations`) e inventário (`inv_used_cidrs`).
  - Suporta transações fortes e locking (advisory lock) para concorrência de alocação.
  - Ecossistema sólido para SQL, índices e relatórios operacionais.
  - **Otimizações recomendadas**:
    - Índices em `cidr`, `pool_id`, `status`, `region` e colunas de lookup frequente.
    - Particionar `inv_used_cidrs` por projeto/região para reduzir scans.
    - Uso de `EXPLAIN` e métricas para ajustar queries críticas.

### Alternativas (GCP)
- **AlloyDB**: compatível com Postgres, com melhor performance para workloads exigentes.
- **Spanner**: consistência forte global, útil se o IPAM for multi-região global com alto volume.
- **Firestore**: útil para metadados ou eventos, mas menos indicado para transações críticas de alocação.

## 3) Descoberta e atualização contínua do inventário

### Opção principal (recomendada)
- **Cloud Tasks + Jobs assíncronos**:
  - Dispara rotinas de discovery (`/jobs/discovery/run`).
  - Atualiza `inv_used_cidrs` com subnets e rotas reais.
  - **Otimizações recomendadas**:
    - Paginar listagens de subnets/routes por projeto/região.
    - Deduplicação antes de persistir (hash de CIDR + project + region).
    - Roda incremental com marcador de atualização (timestamp).

### Alternativas (GCP)
- **Cloud Scheduler + Cloud Run**:
  - Execução periódica (cron) para descoberta e reconciliação automática.
- **Pub/Sub + Cloud Run**:
  - Pipeline orientado a eventos, ideal para atualizações em tempo real.

## 4) Integrações com APIs GCP

Para descoberta de rede, as principais integrações envolvem:
- **Compute API**: leitura de VPCs, subnets, routes.
- **Resource Manager API**: listagem de projetos/organizations.
- **Network Connectivity API**: caso seja necessário correlacionar NCC, hubs e spokes.
- **IPAM GDCH API**: integração com IPAM oficial do Google (via proxy).

## 5) Autenticação e autorização

- **IAM + metadata server do Cloud Run** (padrão recomendado).
- **JWT/Bearer tokens** no dashboard para chamadas API.
- **RBAC** por pool/projeto, se necessário (backlog recomendado).

## 6) Observabilidade e auditoria

- **Cloud Logging** com logs estruturados (latência, status, payload resumido).
- **Cloud Monitoring** para métricas de API, erros, tempo de execução de jobs.
- **Audit log interno** em tabelas (`audit_events`).
- **Otimizações recomendadas**:
  - Alertas de esgotamento de pool e falhas de discovery.
  - Dashboards por região/projeto com latência de sync.

## 7) Referências oficiais da Google (pontos para pesquisa)

Para avançar na implementação, o time deve consultar a documentação oficial da Google:
- **Cloud Run** (deploy, IAM, service accounts, metadata server).
- **Cloud SQL (Postgres)** e **AlloyDB** (comparação de desempenho e custo).
- **Cloud Tasks** (jobs assíncronos e retries).
- **Cloud Scheduler** (execução periódica).
- **Compute API** (VPC, subnets, routes).
- **Network Connectivity Center (NCC)** (hub/spoke).
- **GDCH IPAM API** (host base, paths válidos, permissões).

---

Se quiser, este documento pode virar checklists de implementação (deploy, IAM, discovery, sync GDCH).
