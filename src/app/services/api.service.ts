import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DeviceResponse, ApiError } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_BASE = 'http://192.168.1.180:7070/metrics';
  private readonly PLANT_BASE = 'http://192.168.1.180:7070/metrics/plant';

  constructor(private http: HttpClient) {}

  /**
   * Creates HTTP headers with authentication token
   */
  private createHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'X-Global-Home-Token': token,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Generic error handler for HTTP requests
   */
  private handleError(error: any): Observable<never> {
    const apiError: ApiError = {
      status: error.status || 0,
      statusText: error.statusText || 'Unknown Error',
      message: error.message || 'An unexpected error occurred'
    };

    console.error('API Error:', apiError);
    return throwError(() => apiError);
  }

  /**
   * Fetch device data (inverter or meter) for a specific month/year
   */
  async fetchDeviceData(
    deviceType: 'INVERTER' | 'METER',
    month: string,
    year: string,
    token: string
  ): Promise<DeviceResponse> {
    const url = `${this.API_BASE}/device/${deviceType}/daily?month=${month}&year=${year}`;
    
    console.log(`🌐 API Call: ${deviceType}`, {
      url,
      method: 'GET',
      headers: {
        'X-Global-Home-Token': token.substring(0, 20) + '...'
      }
    });
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': token
        },
        mode: 'cors'
      });

      console.log(`📡 ${deviceType} Response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 ${deviceType} Response Data:`, data);
      return data as DeviceResponse;
    } catch (error) {
      console.error(`❌ Error fetching ${deviceType} data:`, error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🚨 Network error - Check if the API server is running and accessible');
        console.error('🔗 Trying to reach:', url);
      }
      throw error;
    }
  }

  /**
   * Fetch plant data for a specific month/year
   */
  async fetchPlantData(
    month: string,
    year: string,
    token: string
  ): Promise<DeviceResponse> {
    const url = `${this.PLANT_BASE}/daily?month=${month}&year=${year}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': token
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DeviceResponse;
    } catch (error) {
      console.error('Error fetching plant data:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed device data for a specific date range
   */
  async fetchDetailedDeviceData(
    deviceType: 'INVERTER' | 'METER',
    startDate: string,
    endDate: string,
    token: string
  ): Promise<DeviceResponse> {
    const url = `${this.API_BASE}/device/${deviceType}/detailed?start=${startDate}&end=${endDate}`;
    
    console.log(`🌐 DETAILED API Call: ${deviceType}`, {
      url,
      startDate,
      endDate,
      method: 'GET',
      headers: {
        'X-Global-Home-Token': token.substring(0, 20) + '...'
      }
    });
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': token
        },
        mode: 'cors'
      });

      console.log(`📡 DETAILED ${deviceType} Response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 DETAILED ${deviceType} Response Data:`, data);
      return data as DeviceResponse;
    } catch (error) {
      console.error(`❌ Error fetching detailed ${deviceType} data:`, error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('🚨 Network error - Check if the detailed API endpoints exist');
        console.error('🔗 Trying to reach:', url);
      }
      throw error;
    }
  }

  /**
   * Fetch detailed plant data for a specific date (uses different format: year/month/day)
   */
  async fetchDetailedPlantData(
    year: string,
    month: string,
    day: string,
    token: string
  ): Promise<DeviceResponse> {
    const url = `${this.PLANT_BASE}/detailed?year=${year}&month=${month}&day=${day}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Global-Home-Token': token
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DeviceResponse;
    } catch (error) {
      console.error('Error fetching detailed plant data:', error);
      throw error;
    }
  }

  /**
   * Format date for API calls (DD-MM-YYYY format)
   */
  formatDateForApi(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Check if error is a CORS error
   */
  isCorsError(error: any): boolean {
    return error.status === 0;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(error: any): boolean {
    return error.status === 401 || error.status === 403;
  }
}
