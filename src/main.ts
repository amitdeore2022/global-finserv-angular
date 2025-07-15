// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // ✅ Correct root component
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig); // ✅ Correct
