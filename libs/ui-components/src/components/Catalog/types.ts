export type CatalogItem = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export type OSCatalogItem = CatalogItem & {
  osImage: string;
};

export type AppCatalogItem = CatalogItem & {
  appImage: string;
  models?: { name: string; image: string }[];
};

export type AIModelCatalogItem = CatalogItem & {
  repository: string;
  path: string;
  targetRevision?: string;
};

export const isAppCatalogItem = (item: CatalogItem): item is AppCatalogItem => Object.keys(item).includes('appImage');
export const isOSCatalogItem = (item: CatalogItem): item is OSCatalogItem => Object.keys(item).includes('osImage');
export const isAIModelCatalogItem = (item: CatalogItem): item is AIModelCatalogItem =>
  Object.keys(item).includes('repository');
