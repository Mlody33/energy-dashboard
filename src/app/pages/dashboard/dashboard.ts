import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MetricCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

// Removed Order interface - no longer needed

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  metricCards: MetricCard[] = [
    {
      title: 'Revenue',
      value: '$1548.26',
      icon: 'pi pi-dollar',
      color: 'white',
      bgColor: 'linear-gradient(45deg, #10b981, #059669)'
    },
    {
      title: 'Buyer Messages', 
      value: '2',
      icon: 'pi pi-envelope',
      color: 'white',
      bgColor: 'linear-gradient(45deg, #6b7280, #4b5563)'
    },
    {
      title: 'CTR',
      value: '12%', 
      icon: 'pi pi-chart-line',
      color: 'white',
      bgColor: 'linear-gradient(45deg, #374151, #1f2937)'
    },
    {
      title: 'Out of Stock Products',
      value: '4',
      icon: 'pi pi-box',
      color: 'white', 
      bgColor: 'linear-gradient(45deg, #f59e0b, #d97706)'
    }
  ];

// Removed orders array - no longer needed

  chartData = [
    { month: '01', orders: 6, units: 4 },
    { month: '02', orders: 5, units: 3 },
    { month: '03', orders: 6, units: 4 },
    { month: '04', orders: 7, units: 5 },
    { month: '05', orders: 8, units: 6 },
    { month: '06', orders: 9, units: 7 },
    { month: '07', orders: 8, units: 6 },
    { month: '08', orders: 9, units: 7 },
    { month: '09', orders: 12, units: 10 },
    { month: '10', orders: 11, units: 9 },
    { month: '11', orders: 10, units: 8 },
    { month: '12', orders: 13, units: 11 },
    { month: '13', orders: 12, units: 10 },
    { month: '14', orders: 14, units: 12 },
    { month: '15', orders: 16, units: 14 },
    { month: '16', orders: 15, units: 13 },
    { month: '17', orders: 14, units: 12 },
    { month: '18', orders: 13, units: 11 },
    { month: '19', orders: 12, units: 10 },
    { month: '20', orders: 11, units: 9 }
  ];

// Removed salesData array - no longer needed
}
