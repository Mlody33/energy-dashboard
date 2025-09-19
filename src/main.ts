import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Chart.js registration - Must happen before app initialization
import {
  Chart,
  CategoryScale,
  LinearScale,
  RadialLinearScale,  // For polar area charts
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  BarElement,
  ArcElement,        // For pie and polar area charts
  PieController,     // For pie charts
  PolarAreaController // For polar area charts
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,  // Register RadialLinearScale for polar area charts
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  ArcElement,        // Register ArcElement for pie and polar area charts
  PieController,     // Register PieController for pie charts
  PolarAreaController // Register PolarAreaController for polar area charts
);

console.log('🔧 Chart.js components registered successfully (including pie and polar area chart with radial scale support)');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
