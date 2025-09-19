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
  exportMain: number;
  exportTariff2: number;
  importMain: number;
  importTariff2: number;
}
