import type { ReactNode } from "react";

export interface Allocation {
  id: string;
  cidr: string;
  status: "reserved" | "created" | "deleted";
  owner: string | null;
  purpose: string | null;
  host_project_id: string;
  service_project_id: string | null;
  network: string;
  region: string;
  metadata: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NavItem {
  label: string;
  path: string;
  description: string;
  icon: ReactNode;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  details: string[];
  actions: string[];
};

export type PageContent = {
  title: string;
  description: string;
  highlights: string[];
  features: FeatureItem[];
};
