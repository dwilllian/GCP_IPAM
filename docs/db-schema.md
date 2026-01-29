# Banco de Dados — Esquema IPAM

Este documento descreve as tabelas principais e índices do PostgreSQL.

## Tabelas

### ipam_pools
- **id** (uuid, PK)
- **name** (text, unique)
- **parent_cidr** (cidr)
- **allowed_prefixes** (int[])
- **cursor_ip** (inet)
- **created_at / updated_at** (timestamptz)

### ipam_allocations
- **id** (uuid, PK)
- **pool_id** (uuid, FK ipam_pools)
- **cidr** (cidr)
- **first_ip / last_ip** (bigint)
- **status** (text, valores: reserved, created, deleted)
- **owner / purpose** (text)
- **host_project_id / service_project_id** (text)
- **network / region** (text)
- **metadata** (jsonb)
- **expires_at** (timestamptz)
- **created_at / updated_at** (timestamptz)

Índices:
- **ipam_allocations_range_idx** em (first_ip, last_ip)
- **ipam_allocations_expires_at_idx** em (expires_at)
- **unique_active_cidr** em (cidr, status)

### inv_used_cidrs
- **id** (bigserial, PK)
- **source** (text, valores: subnet_primary, subnet_secondary, route_static, allocation)
- **project_id** (text)
- **network / region** (text)
- **cidr** (cidr)
- **first_ip / last_ip** (bigint)
- **resource_id** (text)
- **meta** (jsonb)
- **updated_at** (timestamptz)

Índices:
- **inv_used_cidrs_unique** em (source, project_id, region, cidr, resource_id)
- **inv_used_cidrs_range_idx** em (first_ip, last_ip)
- **inv_used_cidrs_project_idx** em (project_id)
- **inv_used_cidrs_source_idx** em (source)

### jobs
- **id** (uuid, PK)
- **type** (text)
- **status** (text, valores: queued, running, done, failed)
- **payload / result** (jsonb)
- **attempts** (int)
- **last_error** (text)
- **created_at / updated_at** (timestamptz)

### audit_events
- **id** (bigserial, PK)
- **ts** (timestamptz)
- **actor** (text)
- **action** (text)
- **request / result** (jsonb)
- **ok** (boolean)
- **request_id** (text)
