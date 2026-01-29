import {
  AccountTree,
  CellTower,
  CloudQueue,
  Hub,
  Lan,
  Security,
  SettingsEthernet,
  TravelExplore,
} from "@mui/icons-material";

import type { NavSection } from "../types";

export const navSections: NavSection[] = [
  {
    title: "Fundamentos",
    items: [
      {
        label: "Fundação VPC",
        path: "/fundacao-vpc",
        description: "Base da rede global, subnets e modos de VPC.",
        icon: <Lan />,
      },
      {
        label: "Hub, Spoke e Peering",
        path: "/hub-spoke-peering",
        description: "Conectividade entre redes e governança centralizada.",
        icon: <Hub />,
      },
      {
        label: "Conectividade híbrida",
        path: "/conectividade-hibrida",
        description: "VPNs e interconnects para datacenters e multicloud.",
        icon: <SettingsEthernet />,
      },
      {
        label: "Roteamento & NAT",
        path: "/roteamento-nat",
        description: "Rotas, Cloud Router e acesso à internet controlado.",
        icon: <AccountTree />,
      },
      {
        label: "Acesso privado & segurança",
        path: "/acesso-privado-seguranca",
        description: "PSC, NGFW, Cloud Armor e Cloud IDS.",
        icon: <Security />,
      },
      {
        label: "Performance & distribuição",
        path: "/performance-distribuicao",
        description: "Load balancing global, tiers e CDN.",
        icon: <CloudQueue />,
      },
      {
        label: "Monitoramento",
        path: "/monitoramento",
        description: "Visibilidade e ações operacionais de rede.",
        icon: <TravelExplore />,
      },
    ],
  },
  {
    title: "IPAM",
    items: [
      {
        label: "IPs Alocados",
        path: "/ips-alocados",
        description: "Lista de blocos IP alocados por serviço.",
        icon: <CellTower />,
      },
    ],
  },
];
