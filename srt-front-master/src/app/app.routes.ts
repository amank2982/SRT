import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StockDetailComponent } from './stock-detail/stock-detail.component';
import { AuthGuard } from './services/auth.guard';
import { AboutComponent } from './about/about.component';
import { VideosComponent } from './videos/videos.component';
import { GlossaryComponent } from './glossary/glossary.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { StockPredictorComponent } from './stock-predictor/stock-predictor.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { 
        path: 'dashboard', 
        component: DashboardComponent, 
        canActivate: [AuthGuard] 
    },
    { 
        path: 'stock/:symbol', 
        component: StockDetailComponent, 
        canActivate: [AuthGuard] 
    },
    { path: 'about', component: AboutComponent },
    { path: 'videos', component: VideosComponent },
    { path: 'glossary', component: GlossaryComponent },
    { path: 'watchlist', component: WatchlistComponent },
    { path: 'stock-predictor', component: StockPredictorComponent },
    { path: '**', redirectTo: 'login' } 
];