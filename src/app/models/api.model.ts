export interface DeviceResponse {
  deviceName: string;
  summary: Array<{
    date: string;
    paramsSummary: any;
  }>;
  uuid: string;
}

export interface ApiConfig {
  baseUrl: string;
  deviceEndpoint: string;
  plantEndpoint: string;
}

export interface StoredData<T> {
  data: T[];
  timestamp: number;
}

export interface ApiError {
  status: number;
  statusText: string;
  message: string;
}
