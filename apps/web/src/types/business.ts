export type ProductStatus =
  | "detectado"
  | "en_analisis"
  | "aprobado"
  | "campana_activa"
  | "escalar"
  | "ajustar"
  | "pausado"
  | "descartado"
  | "ganador";

export type CampaignStatus =
  | "pendiente"
  | "activa"
  | "en_revision"
  | "escalada"
  | "pausada"
  | "finalizada";

export type LogisticComplexity = "baja" | "media" | "alta";

export type CampaignChannel = "meta_ads" | "organico" | "whatsapp" | "catalogo" | "tiktok_ads";

export type DecisionType = "escalar" | "ajustar" | "pausar" | "descartar" | "mantener_test";

export const PRODUCT_STATUSES: ProductStatus[] = [
  "detectado",
  "en_analisis",
  "aprobado",
  "campana_activa",
  "escalar",
  "ajustar",
  "pausado",
  "descartado",
  "ganador"
];

export const CAMPAIGN_STATUSES: CampaignStatus[] = [
  "pendiente",
  "activa",
  "en_revision",
  "escalada",
  "pausada",
  "finalizada"
];

export const CAMPAIGN_CHANNELS: CampaignChannel[] = ["meta_ads", "organico", "whatsapp", "catalogo", "tiktok_ads"];
