export interface ChatSource {
  title: string;
  url: string;
  snippet?: string;
  liveViewUrl?: string;
  type: "browser" | "search";
}

export interface AssistantAction {
  id: string;
  type: "navigate";
  targetType: "category" | "page" | "product" | "section";
  title: string;
  label: string;
  description: string;
  path: string;
  sectionId?: string;
  requiresConfirmation: boolean;
}

export interface ChatResponse {
  answer?: string;
  tools?: string[];
  sources?: ChatSource[];
  action?: AssistantAction | null;
  error?: string;
}
