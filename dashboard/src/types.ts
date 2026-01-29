import type { ReactNode } from "react";

export interface Allocation {
  id: number;
  cidr: string;
  vpc: string;
  region: string;
  resource_type: string;
  resource_name: string;
  status: string;
  created_by: string;
  created_at: string;
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
