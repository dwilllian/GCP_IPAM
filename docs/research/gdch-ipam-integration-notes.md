# GDCH IPAM API integration notes (GCP)

## O que já está no código
- Implementamos um proxy autenticado em Cloud Run (`/gcp/ipam/proxy`) que usa o token do metadata server ou um token explícito e encaminha chamadas para um `GCP_IPAM_BASE_URL` configurável.

## Pontos ainda pendentes para uma integração completa
1. **Base URL e paths oficiais**
   - A documentação do IPAM do GDCH é publicada em páginas HTML e não expõe claramente o host/endpoint base em texto simples.
   - No HTML da referência, aparece o prefixo de versão `/v1/ipam-v1` e `/v1/global-ipam-v1`, mas o host precisa ser confirmado conforme o ambiente GDCH. 
   - A configuração atual exige definir `GCP_IPAM_BASE_URL` com o host correto do GDCH (ex.: endpoint interno do ambiente GDCH) e usar `path` relativo no proxy.

2. **Modelos de recursos**
   - Precisamos mapear explicitamente quais recursos do IPAM GDCH serão sincronizados com o nosso inventário: pools, ranges, allocations e operações de validação.

3. **Autorização IAM**
   - A service account do Cloud Run deve ter permissões para as chamadas de IPAM GDCH; isso precisa ser documentado e validado no ambiente.

4. **Sincronização/descoberta**
   - O próximo passo é um job de descoberta que consuma os recursos do IPAM GDCH e grave em `inv_used_cidrs` e/ou em novas tabelas de inventário.

5. **Erros e observabilidade**
   - Log estruturado de chamadas ao IPAM GDCH (latência, status, payloads) para facilitar troubleshooting.

## Ações recomendadas
- Confirmar o host base oficial do IPAM GDCH (ex.: endpoint do control plane do ambiente GDCH) e registrar exemplos de `path` válidos.
- Definir um mapeamento mínimo de recursos (listagem de pools/ranges e validação de conflitos) e construir um job de sync.
- Adicionar documentação de IAM/roles necessárias para o Cloud Run.
