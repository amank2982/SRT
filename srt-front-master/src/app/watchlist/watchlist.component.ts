import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../services/stock.service'; // Your service import
import { finalize } from 'rxjs/operators';
 
@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css'],
  providers: [DecimalPipe]
})
export class WatchlistComponent {
  watchlist: any[] = [];
  newStockSymbol: string = '';
  isLoading: boolean = false;
 
  constructor(private stockService: StockService) {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      this.watchlist = JSON.parse(savedWatchlist);
    }
  }
 
  addToWatchlist(): void {
    const symbol = this.newStockSymbol.trim().toUpperCase();
    if (!symbol) {
      alert('Please enter a valid stock symbol.');
      return;
    }
 
    if (this.watchlist.some(stock => stock.symbol === symbol)) {
      alert('This stock is already in your watchlist.');
      return;
    }
 
    this.isLoading = true;
    this.stockService.getStockBySymbol(symbol).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (stockData) => {
        if (stockData && stockData.symbol && stockData.symbol !== 'N/A') {
          // Map StockDetail to your watchlist item
          const newStock = {
            symbol: stockData.symbol,
            shortName: stockData.symbol || stockData.name || stockData.symbol,
            regularMarketPrice: stockData.currentPrice || 0,
            regularMarketChange: stockData.change || 0,
            regularMarketChangePercent: stockData.changePercent || 0
          };
          this.watchlist.push(newStock);
          localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
          this.newStockSymbol = '';
        } else {
          alert(`No stock found with symbol "${symbol}".`);
        }
      },
      error: (err) => {
        alert('Error fetching stock data. Please try again later.');
        console.error('Stock fetch error:', err);
      }
    });
  }
 
  removeFromWatchlist(stock: any): void {
    const index = this.watchlist.findIndex(item => item.symbol === stock.symbol);
    if (index !== -1) {
      this.watchlist.splice(index, 1);
      localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
    }
  }
}
 
 
