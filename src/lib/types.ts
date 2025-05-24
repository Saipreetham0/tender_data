// export interface TenderDownloadLink {
//   text: string;
//   url: string;
// }

// export interface Tender {
//   name: string;
//   postedDate: string;
//   closingDate: string;
//   downloadLinks: TenderDownloadLink[];
//   source: string; // Add this line
// }

// export interface APIResponse {
//   success: boolean;
//   data?: Tender[];
//   error?: string;
//   timestamp: string;
//   source: string;
// }

// export interface DownloadLink {
//   url: string;
//   text: string;
// }

// export interface Campus {
//   id: string;
//   name: string;
//   icon: React.ComponentType;
// }

// export interface TenderData {
//   data: Tender[];
// }

// export interface TenderDataMap {
//   [key: string]: TenderData;
// }

// src/lib/types.ts
export interface TenderDownloadLink {
  text: string;
  url: string;
}

export interface Tender {
  name: string;
  postedDate: string;
  closingDate: string;
  downloadLinks: TenderDownloadLink[];
  source?: string; // Make source optional to maintain compatibility
}

export interface APIResponse {
  success: boolean;
  data?: Tender[];
  error?: string;
  timestamp: string;
  source: string;
  message?: string;
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
