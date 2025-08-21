import { Injectable } from '@angular/core';
 
import { HttpClient } from '@angular/common/http';
 
import { Observable, throwError } from 'rxjs';
 
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
 
interface Stock {
 
  symbol: string;
 
  shortName: string;
 
  regularMarketPrice: number;
 
  regularMarketChange: number;
 
  regularMarketChangePercent: number;
 
}
 interface StockSummary{
 
  Symbol: string;
 
  Summary: string;
  Details:{
    CurrentPrice: number;
    ChangePercent: number;
    High: number;
    Low: number;
    Open: number;
    PreviousClose: number;
  };
  Timestamp: string;
 }
interface NewsArticle {
 
  title: string;
 
  url: string;
 
  source: string;
 
  publishedAt: string;
 
}
 
interface StockDetail {
 
  symbol: string;
 
  name: string;
 
  currentPrice: number;
 
  change: number;
 
  changePercent: number;
 
  previousClose: number;
 
  high: number;
 
  low: number;
 
  open: number;
 
  timestamp: string;
 
  logo: string;
 
  exchange: string;
 
}
 
interface YahooFinanceResponse {
 
  finance?: {
 
    result?: Array<{
 
      quotes?: Stock[];
 
    }>;
 
    error?: any;
 
  };
 
}
interface MarketMoverGroup{
  title: string;
  quotes: Stock[];
}
 
@Injectable({
 
  providedIn: 'root',
 
})
 
export class StockService {
 
  private apiUrl = 'http://localhost:5172/api/Stock/trending'; // Endpoint for trending stocks
 
  private newsApiUrl = 'http://localhost:5172/api/Stock/latest'; // Endpoint for latest news
  private moversApiUrl = 'http://localhost:5172/api/Stock/movers';
 
 
 
  // private stockApiUrl = 'http://localhost:5172/api/stock'; // Endpoint for stock details
 
  constructor(private http: HttpClient) {}
 
  getTrendingStocks(): Observable<Stock[]> {
 
    return this.http.get<YahooFinanceResponse | Stock[]>(this.apiUrl).pipe(
 
      map((response) => {
 
        try {
 
          if (Array.isArray(response)) {
 
            return this.transformStocks(response);
 
          }
 
          // Handle Yahoo Finance response structure
 
          if (response?.finance?.result?.[0]?.quotes) {
 
            return this.transformStocks(response.finance.result[0].quotes);
 
          }
 
          throw new Error('Unexpected API response structure');
 
        } catch (error) {
 
          console.error('Data transformation error:', error);
 
          throw error;
 
        }
 
      }),
 
      catchError((error) => {
 
        console.error('API request failed:', error);
 
        return throwError(() => this.handleError(error));
 
      })
 
    );
 
  }
 
  // Updated method to fetch the latest news
 
  getLatestNews(): Observable<NewsArticle[]> {
 
    return this.http.get<NewsArticle[]>(this.newsApiUrl).pipe(
 
      map((response) => {
 
        console.log('Fetched latest news:', response); // Log the response for debugging
 
        return response || [];
 
      }),
 
      catchError((error) => {
 
        console.error('News API request failed:', error);
 
        return throwError(() => new Error('Failed to fetch latest news'));
 
      })
 
    );
 
  }
  getMarketMovers(): Observable<any[]> {
 
    return this.http.get<any[]>(this.moversApiUrl).pipe(
 
      map((response) => response || []),
 
        // const movers = response.finance?.result || [];
 
 
       
 
      catchError((error) => {
 
        console.error('Market Movers API request failed:', error);
 
        return throwError(() => new Error('Failed to fetch market movers'));
 
      })
 
    );
 
  }
   // Compare two stocks
 
   compareStocks(stock1: string, stock2: string): Observable<any> {
 
    const url = `http://localhost:5172/api/Stock/compare?stock1=${stock1}&stock2=${stock2}`;
 
    return this.http.get<any>(url).pipe(
 
      catchError((error) => {
 
        console.error('Failed to compare stocks:', error);
 
        return throwError(() => this.handleError(error));
 
      })
 
    );
 
  }
   
 
  private transformStocks(quotes: any[]): Stock[] {
 
    return quotes.map((quote) => ({
 
      symbol: quote.symbol || 'N/A',
 
      shortName: quote.shortName || 'Unknown',
 
      regularMarketPrice: this.parseNumber(quote.regularMarketPrice),
 
      regularMarketChange: this.parseNumber(quote.regularMarketChange),
 
      regularMarketChangePercent: this.parseNumber(quote.regularMarketChangePercent),
 
    }));
 
  }
 
  private parseNumber(value: any): number {
 
    const num = Number(value);
 
    return isNaN(num) ? 0 : num;
 
  }
 
  private handleError(error: any): Error {
 
    if (error.error instanceof ErrorEvent) {
 
      // Client-side or network error
 
      return new Error(`Network error: ${error.error.message}`);
 
    } else {
 
      // Backend returned unsuccessful response
 
      return new Error(
 
        `Backend returned code ${error.status}, ` + `body was: ${JSON.stringify(error.error)}`
 
      );
 
    }
 
  }
 
  getStockBySymbol(symbol: string): Observable<StockDetail> {
 
    const url = `http://localhost:5172/api/Stock/details/${symbol}`;
 
    return this.http.get<StockDetail>(url).pipe(
 
      map((response: any) => {
 
        return {
 
          symbol: response.symbol || 'N/A',
 
          name: response.name || 'Unknown',
 
          currentPrice: this.parseNumber(response.currentPrice),
 
          change: this.parseNumber(response.change),
 
          changePercent: this.parseNumber(response.changePercent),
 
          previousClose: this.parseNumber(response.previousClose),
 
          high: this.parseNumber(response.high),
 
          low: this.parseNumber(response.low),
 
          open: this.parseNumber(response.open),
 
          timestamp: response.timestamp || '',
 
          logo: response.logo || '',
 
          exchange: response.exchange || 'N/A',
 
        };
 
      }),
 
      catchError((error) => {
 
        console.error('Failed to fetch stock details:', error);
 
        return throwError(() => this.handleError(error));
 
      })
 
    );
 
  }
 
  getChartData(symbol: string) {
 
    return this.http.get<any>(`http://localhost:5172/api/Stock/chart/${symbol}`);
 
  }
  getStockSummary(symbol: string): Observable<StockSummary> {
    const url = `http://localhost:5172/api/Stock/${symbol}/summary`;
 
    return this.http.get<StockSummary>(url).pipe(
      map(response => ({
        Symbol: response.Symbol || symbol.toUpperCase(),
        Summary: response.Summary || 'No summary available',
        Details: {
          CurrentPrice: this.parseNumber(response.Details?.CurrentPrice),
          ChangePercent: this.parseNumber(response.Details?.ChangePercent),
          High: this.parseNumber(response.Details?.High),
          Low: this.parseNumber(response.Details?.Low),
          Open: this.parseNumber(response.Details?.Open),
          PreviousClose: this.parseNumber(response.Details?.PreviousClose)
        },
        Timestamp: response.Timestamp || new Date().toISOString()
      })),
      catchError(error => {
        console.error('Failed to fetch stock summary:', error);
        return of({
          Symbol: symbol.toUpperCase(),
          Summary: 'No summary available',
          Details: {
            CurrentPrice: 0,
            ChangePercent: 0,
            High: 0,
            Low: 0,
            Open: 0,
            PreviousClose: 0
          },
          Timestamp: new Date().toISOString()
        });
      })
    );
  }
 
  }