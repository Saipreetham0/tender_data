export interface TenderDownloadLink {
  text: string;
  url: string;
}

export interface Tender {
  name: string;
  postedDate: string;
  closingDate: string;
  downloadLinks: TenderDownloadLink[];
}

export interface APIResponse {
  success: boolean;
  data?: Tender[];
  error?: string;
  timestamp: string;
  source: string;
}

export interface DownloadLink {
  url: string;
  text: string;
}

export interface Campus {
  id: string;
  name: string;
  icon: React.ComponentType;
}

export interface TenderData {
  data: Tender[];
}

export interface TenderDataMap {
  [key: string]: TenderData;
}
