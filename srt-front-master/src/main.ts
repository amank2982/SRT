import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TokenInterceptor } from './app/interceptors/token.interceptor';
import { provideRouter } from '@angular/router'; // ✅ Required for routing

import { AboutComponent } from './app/about/about.component';
import { StockDetailComponent } from './app/stock-detail/stock-detail.component';
import { RegisterComponent } from './app/register/register.component';
import { LoginComponent } from './app/login/login.component';
import { DashboardComponent } from './app/dashboard/dashboard.component';
import { VideosComponent } from './app/videos/videos.component';

const routes = [
  { path: '', component: DashboardComponent },
  { path: 'about-us', component: AboutComponent },
  {path:'videos',component:VideosComponent},
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'stock/:symbol', component: StockDetailComponent },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([TokenInterceptor])),
    provideRouter(routes), // ✅ Add this to enable router
    ...appConfig.providers,
  ],
}).catch((err: any) => console.error(err));
