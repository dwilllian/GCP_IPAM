import type { PageContent } from "../types";

export const pageContentByPath: Record<string, PageContent> = {
  "/fundacao-vpc": {
    title: "Fundação: Virtual Private Cloud (VPC)",
    description:
      "A VPC é global no GCP e permite arquiteturas multi-região sem complexidade adicional.",
    highlights: [
      "VPC global com sub-redes regionais.",
      "Modos Auto e Custom para provisionamento de subnets.",
      "Endereçamento preparado para expansão.",
    ],
    features: [
      {
        id: "vpc-global",
        title: "VPC Global",
        description: "Uma rede privada global, consistente entre regiões.",
        details: [
          "Evita necessidade de VPNs internas entre regiões.",
          "Simplifica políticas de firewall e roteamento.",
          "Centraliza governança de endereçamento.",
        ],
        actions: ["Validar alcance", "Simular expansão"],
      },
      {
        id: "subnets",
        title: "Subnets regionais",
        description: "Divisão por regiões com ranges dedicados.",
        details: [
          "Define CIDRs específicos por região.",
          "Permite isolamento e escalabilidade local.",
          "Facilita políticas de latência e compliance.",
        ],
        actions: ["Criar subnet", "Revisar ranges"],
      },
      {
        id: "vpc-modes",
        title: "Modos de VPC",
        description: "Auto Mode cria subnets automaticamente; Custom Mode oferece controle total.",
        details: [
          "Auto Mode acelera ambientes de desenvolvimento.",
          "Custom Mode recomendado para produção e governança.",
          "Permite padrões de IP coerentes com on-premises.",
        ],
        actions: ["Alternar modo", "Exportar padrão"],
      },
    ],
  },
  "/hub-spoke-peering": {
    title: "Conectividade e Arquitetura",
    description:
      "Organize a conectividade entre redes com peering, Shared VPC e Network Connectivity Center.",
    highlights: [
      "Peering direto entre VPCs sem trânsito indireto.",
      "Shared VPC para governança centralizada.",
      "NCC como hub moderno com transitividade entre spokes.",
    ],
    features: [
      {
        id: "peering",
        title: "VPC Network Peering",
        description: "Conecta duas VPCs para comunicação interna.",
        details: [
          "Não é transitivo entre múltiplas VPCs.",
          "Funciona entre organizações diferentes.",
          "Ideal para integrações diretas.",
        ],
        actions: ["Criar peering", "Validar rotas"],
      },
      {
        id: "shared-vpc",
        title: "Shared VPC",
        description: "Host project concentra a rede e projetos de serviço compartilham subnets.",
        details: [
          "Separação clara entre times de rede e de aplicação.",
          "Políticas e firewall centralizados.",
          "Reduz duplicidade de endereçamento.",
        ],
        actions: ["Adicionar service project", "Revisar permissões"],
      },
      {
        id: "ncc",
        title: "Network Connectivity Center",
        description: "Hub-and-spoke moderno com transitividade.",
        details: [
          "Conecta VPCs, VPNs e Interconnects em um hub.",
          "Simplifica arquiteturas complexas.",
          "Ideal para organizações com múltiplas redes.",
        ],
        actions: ["Criar hub", "Anexar spoke"],
      },
    ],
  },
  "/conectividade-hibrida": {
    title: "Conectividade Híbrida",
    description:
      "Conecte data centers locais, outras nuvens e filiais com segurança e desempenho.",
    highlights: [
      "Cloud VPN para túneis IPsec de baixo custo.",
      "Interconnect dedicado para alta capacidade.",
      "Cross-Cloud Interconnect para multicloud.",
    ],
    features: [
      {
        id: "cloud-vpn",
        title: "Cloud VPN",
        description: "Túneis IPsec pela internet pública.",
        details: [
          "Até 3 Gbps por túnel.",
          "Rápida ativação e custo reduzido.",
          "Boa opção para tráfego moderado.",
        ],
        actions: ["Criar túnel", "Checar SLA"],
      },
      {
        id: "dedicated-interconnect",
        title: "Dedicated Interconnect",
        description: "Conexão física direta com 10G/100G.",
        details: [
          "Baixa latência e alta confiabilidade.",
          "Atende requisitos de conformidade.",
          "Ideal para workloads críticos.",
        ],
        actions: ["Solicitar porta", "Monitorar BGP"],
      },
      {
        id: "partner-interconnect",
        title: "Partner Interconnect",
        description: "Conexão via provedor quando não há colocation.",
        details: [
          "Flexível para locais sem presença do Google.",
          "Provisionamento rápido.",
          "Integração com provedores como Equinix.",
        ],
        actions: ["Selecionar parceiro", "Revisar contrato"],
      },
      {
        id: "cross-cloud",
        title: "Cross-Cloud Interconnect",
        description: "Conecta GCP com AWS e Azure diretamente.",
        details: [
          "Evita tráfego pela internet pública.",
          "Reduz latência entre nuvens.",
          "Suporte para ambientes multicloud.",
        ],
        actions: ["Provisionar link", "Mapear latência"],
      },
    ],
  },
  "/roteamento-nat": {
    title: "Roteamento e Gerenciamento de Tráfego",
    description: "Controle o caminho do tráfego e habilite acesso à internet com segurança.",
    highlights: [
      "Rotas estáticas e dinâmicas via BGP.",
      "Cloud Router como cérebro de roteamento.",
      "Cloud NAT para saída segura sem IP público.",
    ],
    features: [
      {
        id: "routes",
        title: "Rotas",
        description: "Definem o direcionamento do tráfego interno e externo.",
        details: [
          "Rotas estáticas criadas manualmente.",
          "Rotas dinâmicas aprendidas via BGP.",
          "Integração com VPC, VPN e Interconnect.",
        ],
        actions: ["Adicionar rota", "Auditar rotas"],
      },
      {
        id: "cloud-router",
        title: "Cloud Router",
        description: "Troca rotas com redes externas usando BGP.",
        details: [
          "Suporta alta disponibilidade.",
          "Automatiza atualização de rotas.",
          "Essencial para VPN e Interconnect dinâmicos.",
        ],
        actions: ["Criar Cloud Router", "Ver sessão BGP"],
      },
      {
        id: "cloud-nat",
        title: "Cloud NAT",
        description: "Saída para internet sem IP público nas VMs.",
        details: [
          "Mantém instâncias privadas.",
          "Permite atualizações e downloads controlados.",
          "Compatível com logs e auditoria.",
        ],
        actions: ["Ativar NAT", "Revisar logs"],
      },
    ],
  },
  "/acesso-privado-seguranca": {
    title: "Acesso Privado e Segurança",
    description:
      "Proteja workloads e consuma serviços privados sem exposição à internet.",
    highlights: [
      "PSC com endpoints internos para APIs e parceiros.",
      "NGFW, Cloud Armor e Cloud IDS para defesa em camadas.",
      "Segurança distribuída e observabilidade central.",
    ],
    features: [
      {
        id: "psc",
        title: "Private Service Connect",
        description: "Consuma serviços com IP interno, sem peering.",
        details: [
          "Elimina necessidade de rotas complexas.",
          "Conexão privada a serviços Google e parceiros.",
          "Reduz exposição de rede.",
        ],
        actions: ["Criar endpoint", "Testar acesso"],
      },
      {
        id: "ngfw",
        title: "Cloud NGFW",
        description: "Firewall distribuído de próxima geração.",
        details: [
          "Inspeção avançada de tráfego.",
          "Regras centralizadas por política.",
          "Proteção em alta performance.",
        ],
        actions: ["Configurar regra", "Simular bloqueio"],
      },
      {
        id: "cloud-armor",
        title: "Cloud Armor",
        description: "Proteção DDoS e WAF para balanceadores.",
        details: [
          "Mitigação automática de ataques.",
          "Regras de WAF personalizadas.",
          "Integração com load balancers globais.",
        ],
        actions: ["Aplicar política", "Ver métricas"],
      },
      {
        id: "cloud-ids",
        title: "Cloud IDS",
        description: "Detecção nativa de intrusão na rede.",
        details: [
          "Sinais de ameaças em tempo real.",
          "Baseado em assinaturas gerenciadas.",
          "Integração com SOC e SIEM.",
        ],
        actions: ["Ativar sensor", "Revisar alertas"],
      },
    ],
  },
  "/performance-distribuicao": {
    title: "Performance e Distribuição",
    description: "Entregue aplicações globais com baixa latência.",
    highlights: [
      "Load balancing L4 e L7 com auto scaling.",
      "Network Service Tiers Premium e Standard.",
      "Cloud CDN para cache na borda.",
    ],
    features: [
      {
        id: "load-balancing",
        title: "Cloud Load Balancing",
        description: "Balanceamento global/regional com auto-healing.",
        details: [
          "Distribui tráfego para múltiplas regiões.",
          "Compatível com HTTP(S), TCP/UDP e SSL.",
          "Integração com Cloud Armor.",
        ],
        actions: ["Criar balanceador", "Testar failover"],
      },
      {
        id: "service-tiers",
        title: "Network Service Tiers",
        description: "Escolha entre Premium e Standard para custo x latência.",
        details: [
          "Premium usa backbone global do Google.",
          "Standard utiliza internet pública.",
          "Seleção por serviço ou região.",
        ],
        actions: ["Selecionar tier", "Comparar latências"],
      },
      {
        id: "cloud-cdn",
        title: "Cloud CDN",
        description: "Cache de conteúdo estático na borda.",
        details: [
          "Reduz latência para usuários globais.",
          "Diminui carga nos backends.",
          "Integrado aos load balancers.",
        ],
        actions: ["Ativar CDN", "Limpar cache"],
      },
    ],
  },
  "/monitoramento": {
    title: "Monitoramento Operacional",
    description: "Acompanhe saúde da rede, alertas e ações recomendadas.",
    highlights: [
      "Painéis de latência e disponibilidade.",
      "Alertas por severidade com resposta rápida.",
      "Checklist de governança contínua.",
    ],
    features: [
      {
        id: "observabilidade",
        title: "Observabilidade",
        description: "Métricas de tráfego e telemetria unificada.",
        details: [
          "Coleta de logs e métricas por região.",
          "Dashboards por aplicação e por rede.",
          "Integração com alertas automatizados.",
        ],
        actions: ["Abrir painel", "Exportar relatório"],
      },
      {
        id: "alertas",
        title: "Alertas inteligentes",
        description: "Detecta anomalias e sugere mitigação.",
        details: [
          "Alertas por severidade e impacto.",
          "Sugestão de playbooks.",
          "Integração com canais de comunicação.",
        ],
        actions: ["Criar alerta", "Simular incidente"],
      },
      {
        id: "governanca",
        title: "Governança",
        description: "Checklist de compliance e segurança contínua.",
        details: [
          "Revisão de ranges IP e permissões.",
          "Status de políticas de firewall.",
          "Auditoria de mudanças recentes.",
        ],
        actions: ["Revisar compliance", "Gerar auditoria"],
      },
    ],
  },
};
