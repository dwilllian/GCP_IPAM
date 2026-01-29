# Mapa do Backend — IPAM Control Plane

Este documento descreve a estrutura modular do backend e como os componentes se relacionam.

## Estrutura de pastas

```
services/ipam-control-plane/src
├── api        # Rotas Fastify (HTTP)
├── flows      # Regras de negócio e orquestração
├── db         # Camada de dados (SQL parametrizado e transações)
├── gcp        # Integrações GCP (Compute, Resource Manager, Cloud Tasks, IPAM)
└── utils      # Configuração, CIDR, validações e erros
```

## Principais módulos

### api/
- **health.ts**: rota de saúde e metadados do serviço.
- **ipam.ts**: pools, alocação, validação e resumo.
- **inventory.ts**: inventário e conflitos de CIDR.
- **network.ts**: criação e remoção de subnets.
- **jobs.ts**: criação e consulta de jobs de discovery.
- **audit.ts**: consulta de auditoria.
- **gcp-ipam.ts**: proxy para o IPAM GDCH.
- **worker.ts**: execução de flows internos protegidos.

### flows/
- **creationFlow/**: criação de alocações e subnets.
- **deletionFlow/**: exclusão de subnets.
- **discoveryFlow/**: coleta de subnets/routes e atualização do inventário.

### db/
- **pool.ts**: cliente e transações.
- **pools.ts**: operações de pools.
- **allocations.ts**: operações de alocações.
- **inventory.ts**: inventário de CIDRs em uso.
- **jobs.ts**: tracking de jobs.
- **audit.ts**: auditoria de ações.

### gcp/
- **compute.ts**: subnets e routes (com suporte a MOCK_GCP).
- **resource-manager.ts**: listagem de projetos.
- **cloud-tasks.ts**: enfileiramento de tasks de discovery.
- **ipam.ts**: proxy para o IPAM GDCH.

### utils/
- **config.ts**: variáveis de ambiente e flags.
- **cidr.ts**: operações determinísticas de CIDR.
- **errors.ts**: padrão de erros e códigos.
