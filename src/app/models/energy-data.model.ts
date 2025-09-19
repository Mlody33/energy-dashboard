export interface MetricCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface EnergyData {
  date: string;
  value: number;
  day: string;
}

export interface MeterEnergyData {
  date: string;
  day: string;
  exportMain: number;      // total_negative_energy_kwh_ - Export energy for whole home (all phases)
  exportTariff2: number;   // total_negative_energy_2_kwh_ - Export energy for single-phase devices
  importMain: number;      // total_positive_energy_kwh_ - Import energy for whole home (all phases)
  importTariff2: number;   // total_positive_energy_2_kwh_ - Import energy for single-phase devices
}

export interface PlantData {
  date: string;
  day: string;
  totalProduction: number;  // Total plant production
  totalConsumption: number; // Total plant consumption  
  gridFeed: number;        // Grid feed-in
  gridConsumption: number; // Grid consumption
  selfConsumption: number; // Self consumption
  selfSufficiency: number; // Self sufficiency percentage
}

export interface DetailedDeviceData {
  date: string;
  day: string;
  value: number;
}

export interface DetailedMeterData {
  date: string;
  day: string;
  // Main totals (aggregated)
  exportMain: number;       // daily_negative_energy_kwh_
  exportTariff2: number;    // daily_negative_energy_2_kwh_
  importMain: number;       // daily_positive_energy_kwh_
  importTariff2: number;    // daily_positive_energy_2_kwh_
  // Individual CT (Current Transformer) readings by floor location
  exportCT1: number;        // daily_negative_energy_ct1_kwh_ - Grid export 1st Floor
  exportCT2: number;        // daily_negative_energy_ct2_kwh_ - Grid export 2nd Floor  
  exportCT3: number;        // daily_negative_energy_ct3_kwh_ - Grid export Basement
  exportCT4: number;        // daily_negative_energy_ct4_kwh_ - Home export 1st Floor
  exportCT5: number;        // daily_negative_energy_ct5_kwh_ - Home export 2nd Floor
  exportCT6: number;        // daily_negative_energy_ct6_kwh_ - Home export Basement
  importCT1: number;        // daily_positive_energy_ct1_kwh_ - Grid import 1st Floor
  importCT2: number;        // daily_positive_energy_ct2_kwh_ - Grid import 2nd Floor
  importCT3: number;        // daily_positive_energy_ct3_kwh_ - Grid import Basement
  importCT4: number;        // daily_positive_energy_ct4_kwh_ - Home consumption 1st Floor
  importCT5: number;        // daily_positive_energy_ct5_kwh_ - Home consumption 2nd Floor
  importCT6: number;        // daily_positive_energy_ct6_kwh_ - Home consumption Basement
}

export interface DetailedPlantData {
  date: string;
  day: string;
  totalProduction: number;  // Total plant production
  totalConsumption: number; // Total plant consumption  
  gridFeed: number;        // Grid feed-in
  gridConsumption: number; // Grid consumption
  selfConsumption: number; // Self consumption
  selfSufficiency: number; // Self sufficiency percentage
}
