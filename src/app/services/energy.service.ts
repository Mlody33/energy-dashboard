import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  EnergyData, 
  MeterEnergyData, 
  PlantData, 
  DetailedDeviceData, 
  DetailedMeterData,
  MetricCard,
  LoadingStates,
  AppState
} from '../models';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { DataTransformService } from './data-transform.service';

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  // Application State
  private appStateSubject = new BehaviorSubject<AppState>({
    loading: {
      isLoading: false,
      isInverterLoading: false,
      isMeterLoading: false,
      isPlantLoading: false,
      isDetailedInverterLoading: false,
      isDetailedMeterLoading: false
    },
    error: '',
    showRefreshReminder: false,
    currentMonth: '09',
    currentYear: '2025',
    selectedDate: new Date(2025, 8),
    detailedDateRange: [new Date(2025, 8, 1), new Date(2025, 8, 10)],
    authToken: ''
  });

  // Data State
  private inverterDataSubject = new BehaviorSubject<EnergyData[]>([]);
  private meterDataSubject = new BehaviorSubject<MeterEnergyData[]>([]);
  private plantDataSubject = new BehaviorSubject<PlantData[]>([]);
  private detailedInverterDataSubject = new BehaviorSubject<DetailedDeviceData[]>([]);
  private detailedMeterDataSubject = new BehaviorSubject<DetailedMeterData[]>([]);
  private metricCardsSubject = new BehaviorSubject<MetricCard[]>([]);

  // Public Observables
  public appState$ = this.appStateSubject.asObservable();
  public inverterData$ = this.inverterDataSubject.asObservable();
  public meterData$ = this.meterDataSubject.asObservable();
  public plantData$ = this.plantDataSubject.asObservable();
  public detailedInverterData$ = this.detailedInverterDataSubject.asObservable();
  public detailedMeterData$ = this.detailedMeterDataSubject.asObservable();
  public metricCards$ = this.metricCardsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private dataTransformService: DataTransformService
  ) {
    this.initializeApp();
  }

  /**
   * Initialize the application state
   */
  private initializeApp(): void {
    console.log('🔧 Energy Service initializing...');
    
    // Load settings and token
    this.loadSettings();
    this.loadToken();
    
    // Load stored data or create fallback data
    this.loadStoredData();
    
    // Update metric cards
    this.updateMetricCards();
    
    console.log('✅ Energy Service initialized');
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): void {
    const currentState = this.appStateSubject.value;
    
    const storedMonth = this.storageService.getMonth() || currentState.currentMonth;
    const storedYear = this.storageService.getYear() || currentState.currentYear;
    const storedDateRange = this.storageService.getDetailedDateRange() || currentState.detailedDateRange;
    
    this.updateAppState({
      currentMonth: storedMonth,
      currentYear: storedYear,
      selectedDate: new Date(parseInt(storedYear), parseInt(storedMonth) - 1),
      detailedDateRange: storedDateRange
    });
  }

  /**
   * Load token from storage
   */
  private loadToken(): void {
    const storedToken = this.storageService.getToken();
    
    if (storedToken) {
      this.updateAppState({ authToken: storedToken });
      console.log('✅ Token loaded from storage');
    } else {
      // Set default token if none exists
      const defaultToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiIwX3phcGFydG1Ab3V0bG9vay5jb21fMiIsIm1vZGlmeV9wYXNzd29yZCI6MSwic2NvcGUiOlsiYWxsIl0sImRldGFpbCI6eyJvcmdhbml6YXRpb25JZCI6MCwidG9wR3JvdXBJZCI6bnVsbCwiZ3JvdXBJZCI6bnVsbCwicm9sZUlkIjotMSwidXNlcklkIjo3NzQzMTAsInZlcnNpb24iOjEwMDAsImlkZW50aWZpZXIiOiJ6YXBhcnRtQG91dGxvb2suY29tIiwiaWRlbnRpdHlUeXBlIjoyLCJtZGMiOiJGT1JFSUdOXzEiLCJhcHBJZCI6bnVsbH0sImV4cCI6MTc2Mjk3MzY1NCwibWRjIjoiRk9SRUlHTl8xIiwiYXV0aG9yaXRpZXMiOlsiYWxsIl0sImp0aSI6Ijk1YTIyMTE2LWI2NTktNDI2OS04ZDZkLTRlYTMxMjljODI0YSIsImNsaWVudF9pZCI6InRlc3QifQ.X5iYdIm8n9pf0wHaEVbBhc5VPOwIfLskber417iq62JJGDpr6BsR7vLlSoRgBpxIqfkTXRevlPhPDOx6svCnVlK7y66aLbCu2KaGd6jG5Sk-9TyCwHoenDpRMZLAEw29VcZkFeobiUC3urZkJet1NgJRSArfFXGM5jbgAh8tO0eiTalQZ5-GD2pIoofNQfShH6cq66jl9XkDqoGAADTo0UuVb3z2EfQStpeJhKgz2SWU0dQfK4sMHODuJfFCtHGBD66qWJVKQjWwSY4oSt2qTk4d45uznfOs-436ixeq5zpVPp2vQT9sbkqQy27Aoi2ZGsyN-bEyjyju_N5Dr09IcA';
      this.setToken(defaultToken);
      console.log('🔧 Using default token');
    }
  }

  /**
   * Load stored data or create fallback data
   */
  private loadStoredData(): void {
    const currentState = this.appStateSubject.value;
    
    // Load inverter data
    const storedInverterData = this.storageService.loadInverterData();
    if (storedInverterData) {
      this.inverterDataSubject.next(storedInverterData);
    } else {
      const fallbackData = this.dataTransformService.createFallbackInverterData(
        currentState.currentMonth,
        currentState.currentYear
      );
      this.inverterDataSubject.next(fallbackData);
    }

    // Load meter data
    const storedMeterData = this.storageService.loadMeterData();
    if (storedMeterData) {
      this.meterDataSubject.next(storedMeterData);
    } else {
      const fallbackData = this.dataTransformService.createFallbackMeterData(
        currentState.currentMonth,
        currentState.currentYear
      );
      this.meterDataSubject.next(fallbackData);
    }

    // Load plant data
    const storedPlantData = this.storageService.loadPlantData();
    if (storedPlantData) {
      this.plantDataSubject.next(storedPlantData);
    } else {
      const fallbackData = this.dataTransformService.createFallbackPlantData(
        currentState.currentMonth,
        currentState.currentYear
      );
      this.plantDataSubject.next(fallbackData);
    }

    // Load detailed data
    const storedDetailedInverterData = this.storageService.loadDetailedInverterData();
    if (storedDetailedInverterData) {
      this.detailedInverterDataSubject.next(storedDetailedInverterData);
    }

    const storedDetailedMeterData = this.storageService.loadDetailedMeterData();
    if (storedDetailedMeterData) {
      this.detailedMeterDataSubject.next(storedDetailedMeterData);
    }
  }

  /**
   * Update application state
   */
  private updateAppState(updates: Partial<AppState>): void {
    const currentState = this.appStateSubject.value;
    this.appStateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Update loading state
   */
  private updateLoadingState(updates: Partial<LoadingStates>): void {
    const currentState = this.appStateSubject.value;
    const newLoading = { ...currentState.loading, ...updates };
    this.updateAppState({ loading: newLoading });
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.storageService.setToken(token);
    this.updateAppState({ authToken: token });
  }

  /**
   * Prompt user for token
   */
  async promptForToken(): Promise<string> {
    return new Promise((resolve) => {
      const currentToken = this.appStateSubject.value.authToken;
      const token = prompt('Please enter your Global Home API Token (X-Global-Home-Token):', currentToken);
      
      if (token !== null && token.trim() !== '') {
        const trimmedToken = token.trim();
        this.setToken(trimmedToken);
        resolve(trimmedToken);
      } else {
        resolve(currentToken);
      }
    });
  }

  /**
   * Change date settings
   */
  changeDateSettings(month: string, year: string): void {
    this.storageService.setDateSettings(month, year);
    this.updateAppState({ 
      currentMonth: month, 
      currentYear: year,
      selectedDate: new Date(parseInt(year), parseInt(month) - 1),
      showRefreshReminder: true 
    });

    // Reload data for new date
    this.loadStoredData();
    this.updateMetricCards();
  }

  /**
   * Change detailed date range
   */
  changeDetailedDateRange(dateRange: Date[]): void {
    this.storageService.setDetailedDateRange(dateRange);
    this.updateAppState({ detailedDateRange: dateRange });
  }

  /**
   * Refresh all data
   */
  async refreshAllData(): Promise<void> {
    const currentState = this.appStateSubject.value;
    
    if (!this.hasValidToken()) {
      await this.promptForToken();
    }

    if (!this.hasValidToken()) {
      this.updateAppState({ error: 'API token is required to fetch data.' });
      return;
    }

    this.updateLoadingState({ isLoading: true });
    this.updateAppState({ error: '' });

    try {
      await Promise.all([
        this.fetchInverterData(),
        this.fetchMeterData(),
        this.fetchPlantData()
      ]);

      this.updateAppState({ showRefreshReminder: false });
      this.updateMetricCards();
      console.log('✅ Data refresh completed successfully!');
    } catch (error: any) {
      this.handleApiError(error);
    } finally {
      this.updateLoadingState({ isLoading: false });
    }
  }

  /**
   * Refresh inverter data only
   */
  async refreshInverterData(): Promise<void> {
    if (!this.hasValidToken()) {
      await this.promptForToken();
    }

    if (!this.hasValidToken()) {
      this.updateAppState({ error: 'API token is required to fetch data.' });
      return;
    }

    this.updateLoadingState({ isInverterLoading: true });
    this.updateAppState({ error: '' });

    try {
      await this.fetchInverterData();
      this.updateAppState({ showRefreshReminder: false });
      this.updateMetricCards();
      console.log('✅ Inverter data refresh completed successfully!');
    } catch (error: any) {
      this.handleApiError(error);
    } finally {
      this.updateLoadingState({ isInverterLoading: false });
    }
  }

  /**
   * Refresh meter data only
   */
  async refreshMeterData(): Promise<void> {
    if (!this.hasValidToken()) {
      await this.promptForToken();
    }

    if (!this.hasValidToken()) {
      this.updateAppState({ error: 'API token is required to fetch data.' });
      return;
    }

    this.updateLoadingState({ isMeterLoading: true });
    this.updateAppState({ error: '' });

    try {
      await this.fetchMeterData();
      this.updateAppState({ showRefreshReminder: false });
      this.updateMetricCards();
      console.log('✅ Meter data refresh completed successfully!');
    } catch (error: any) {
      this.handleApiError(error);
    } finally {
      this.updateLoadingState({ isMeterLoading: false });
    }
  }

  /**
   * Refresh plant data only
   */
  async refreshPlantData(): Promise<void> {
    if (!this.hasValidToken()) {
      await this.promptForToken();
    }

    if (!this.hasValidToken()) {
      this.updateAppState({ error: 'API token is required to fetch data.' });
      return;
    }

    this.updateLoadingState({ isPlantLoading: true });
    this.updateAppState({ error: '' });

    try {
      await this.fetchPlantData();
      this.updateAppState({ showRefreshReminder: false });
      this.updateMetricCards();
      console.log('✅ Plant data refresh completed successfully!');
    } catch (error: any) {
      this.handleApiError(error);
    } finally {
      this.updateLoadingState({ isPlantLoading: false });
    }
  }

  /**
   * Refresh detailed data
   */
  async refreshDetailedData(): Promise<void> {
    if (!this.hasValidToken()) {
      await this.promptForToken();
    }

    if (!this.hasValidToken()) {
      this.updateAppState({ error: 'API token is required to fetch data.' });
      return;
    }

    this.updateLoadingState({ 
      isDetailedInverterLoading: true,
      isDetailedMeterLoading: true 
    });
    this.updateAppState({ error: '' });

    try {
      await Promise.all([
        this.fetchDetailedInverterData(),
        this.fetchDetailedMeterData()
      ]);

      console.log('✅ Detailed data refresh completed successfully!');
    } catch (error: any) {
      this.handleApiError(error);
    } finally {
      this.updateLoadingState({ 
        isDetailedInverterLoading: false,
        isDetailedMeterLoading: false 
      });
    }
  }

  /**
   * Fetch inverter data from API
   */
  private async fetchInverterData(): Promise<void> {
    const currentState = this.appStateSubject.value;
    
    try {
      const response = await this.apiService.fetchDeviceData(
        'INVERTER',
        currentState.currentMonth,
        currentState.currentYear,
        currentState.authToken
      );

      const transformedData = this.dataTransformService.transformInverterData(
        response,
        currentState.currentMonth,
        currentState.currentYear
      );

      this.inverterDataSubject.next(transformedData);
      this.storageService.storeInverterData(transformedData);
    } catch (error) {
      console.error('Error fetching inverter data:', error);
      throw error;
    }
  }

  /**
   * Fetch meter data from API
   */
  private async fetchMeterData(): Promise<void> {
    const currentState = this.appStateSubject.value;
    
    try {
      const response = await this.apiService.fetchDeviceData(
        'METER',
        currentState.currentMonth,
        currentState.currentYear,
        currentState.authToken
      );

      const transformedData = this.dataTransformService.transformMeterData(
        response,
        currentState.currentMonth,
        currentState.currentYear
      );

      this.meterDataSubject.next(transformedData);
      this.storageService.storeMeterData(transformedData);
    } catch (error) {
      console.error('Error fetching meter data:', error);
      throw error;
    }
  }

  /**
   * Fetch plant data from API
   */
  private async fetchPlantData(): Promise<void> {
    const currentState = this.appStateSubject.value;
    
    try {
      const response = await this.apiService.fetchPlantData(
        currentState.currentMonth,
        currentState.currentYear,
        currentState.authToken
      );

      const transformedData = this.dataTransformService.transformPlantData(
        response,
        currentState.currentMonth,
        currentState.currentYear
      );

      this.plantDataSubject.next(transformedData);
      this.storageService.storePlantData(transformedData);
    } catch (error) {
      console.error('Error fetching plant data:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed inverter data from API
   */
  private async fetchDetailedInverterData(): Promise<void> {
    const currentState = this.appStateSubject.value;
    
    if (!currentState.detailedDateRange || currentState.detailedDateRange.length !== 2) {
      throw new Error('Invalid date range selected');
    }

    try {
      const startDate = this.apiService.formatDateForApi(currentState.detailedDateRange[0]);
      const endDate = this.apiService.formatDateForApi(currentState.detailedDateRange[1]);

      const response = await this.apiService.fetchDetailedDeviceData(
        'INVERTER',
        startDate,
        endDate,
        currentState.authToken
      );

      const transformedData = this.dataTransformService.transformDetailedInverterData(response);
      this.detailedInverterDataSubject.next(transformedData);
      this.storageService.storeDetailedInverterData(transformedData);
    } catch (error) {
      console.error('Error fetching detailed inverter data:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed meter data from API
   */
  private async fetchDetailedMeterData(): Promise<void> {
    const currentState = this.appStateSubject.value;
    
    if (!currentState.detailedDateRange || currentState.detailedDateRange.length !== 2) {
      throw new Error('Invalid date range selected');
    }

    try {
      const startDate = this.apiService.formatDateForApi(currentState.detailedDateRange[0]);
      const endDate = this.apiService.formatDateForApi(currentState.detailedDateRange[1]);

      const response = await this.apiService.fetchDetailedDeviceData(
        'METER',
        startDate,
        endDate,
        currentState.authToken
      );

      const transformedData = this.dataTransformService.transformDetailedMeterData(response);
      this.detailedMeterDataSubject.next(transformedData);
      this.storageService.storeDetailedMeterData(transformedData);
    } catch (error) {
      console.error('Error fetching detailed meter data:', error);
      throw error;
    }
  }

  /**
   * Update metric cards based on current data
   */
  updateMetricCards(): void {
    const inverterData = this.inverterDataSubject.value;
    const meterData = this.meterDataSubject.value;

    const inverterTotal = inverterData.reduce((sum, item) => sum + item.value, 0);
    const meterExportTotal = meterData.reduce((sum, item) => sum + item.exportMain, 0);
    const meterImportTotal = meterData.reduce((sum, item) => sum + item.importMain + item.importTariff2, 0);
    const homeUsage = meterData.reduce((sum, item) => sum + item.importTariff2, 0);

    const metricCards: MetricCard[] = [
      {
        title: 'Solar Production',
        value: `${inverterTotal.toFixed(2)} kWh`,
        icon: 'pi pi-sun',
        color: 'white',
        bgColor: 'linear-gradient(45deg,rgb(34, 99, 197),rgb(30, 103, 192))'
      },
      {
        title: 'Grid Export', 
        value: `${meterExportTotal.toFixed(2)} kWh`,
        icon: 'pi pi-upload',
        color: 'white',
        bgColor: 'linear-gradient(45deg, #059669, #047857)'
      },
      {
        title: 'Grid Import',
        value: `${meterImportTotal.toFixed(2)} kWh`, 
        icon: 'pi pi-download',
        color: 'white',
        bgColor: 'linear-gradient(45deg, #ef4444, #dc2626)'
      },
      {
        title: 'Home Usage',
        value: `${homeUsage.toFixed(2)} kWh`,
        icon: 'pi pi-home',
        color: 'white', 
        bgColor: 'linear-gradient(45deg, #8b5cf6, #7c3aed)'
      }
    ];

    this.metricCardsSubject.next(metricCards);
  }

  /**
   * Check if we have a valid token
   */
  hasValidToken(): boolean {
    const token = this.appStateSubject.value.authToken;
    return token.trim() !== '';
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: any): void {
    let errorMessage = '';

    if (this.apiService.isCorsError(error)) {
      errorMessage = 'CORS Error: Cannot connect to server. Check if CORS is properly configured on the server.';
    } else if (this.apiService.isAuthError(error)) {
      errorMessage = 'Authentication failed. Please check your API token.';
    } else {
      errorMessage = `Failed to fetch data. Server returned: ${error.status} - ${error.statusText}`;
    }

    this.updateAppState({ error: errorMessage });
    console.error('API Error:', error);
  }

  /**
   * Get current date display text
   */
  getCurrentDateDisplayText(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentState = this.appStateSubject.value;
    const monthIndex = parseInt(currentState.currentMonth, 10) - 1;
    return `${monthNames[monthIndex]} ${currentState.currentYear}`;
  }

  /**
   * Get detailed date range text
   */
  getDetailedDateRangeText(): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    const currentState = this.appStateSubject.value;
    if (currentState.detailedDateRange && currentState.detailedDateRange.length === 2) {
      return `${formatDate(currentState.detailedDateRange[0])} - ${formatDate(currentState.detailedDateRange[1])}`;
    }
    return 'No date range selected';
  }
}
