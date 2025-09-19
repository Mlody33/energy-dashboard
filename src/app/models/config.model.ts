export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AppConfig {
  api: {
    baseUrl: string;
    deviceEndpoint: string;
    plantEndpoint: string;
  };
  storage: {
    tokenKey: string;
    monthKey: string;
    yearKey: string;
    dateRangeKey: string;
    inverterDataKey: string;
    meterDataKey: string;
    plantDataKey: string;
    detailedInverterDataKey: string;
    detailedMeterDataKey: string;
  };
  defaults: {
    month: string;
    year: string;
    dateRange: DateRange;
  };
}

export interface LoadingStates {
  isLoading: boolean;
  isInverterLoading: boolean;
  isMeterLoading: boolean;
  isPlantLoading: boolean;
  isDetailedInverterLoading: boolean;
  isDetailedMeterLoading: boolean;
}

export interface AppState {
  loading: LoadingStates;
  error: string;
  showRefreshReminder: boolean;
  currentMonth: string;
  currentYear: string;
  selectedDate: Date;
  detailedDateRange: Date[];
  authToken: string;
}
