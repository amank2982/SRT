/* Stockdetail.ts */
import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StockService } from '../services/stock.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { finalize } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, filter, switchMap } from 'rxjs/operators';
import { SuggestionService } from '../services/suggestion.service';
import { Router } from '@angular/router';
import { ChatbotComponent } from '../chatbot/chatbot.component';

interface StockSummaryResponse {
  Symbol: string;
  Summary: string;
  Details: {
    CurrentPrice: number;
    ChangePercent: number;
    High: number;
    Low: number;
    Open: number;
    PreviousClose: number;
  };
  Timestamp: string;
}
@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule,
    ReactiveFormsModule,
    RouterModule,
    ChatbotComponent, // Import the ChatbotComponent here
  ],
  templateUrl: './stock-detail.component.html',
  styleUrls: ['./stock-detail.component.css'],
})
export class StockDetailComponent implements OnInit, OnDestroy {
  trendingStocks: any[] = [];
  isLoadingStocks: boolean = false;
  isAccordionOpen: boolean = false;
  errorMessageStocks: string | null = null;

  isComparePopupOpen: boolean = false;

  stock1: string = '';

  stock2: string = '';

  comparisonResult: any = null;

  symbol!: string;

  stockData: any;

  stockSummary: StockSummaryResponse | null = null;
  isLoadingSummary: boolean = false;
  errorMessageSummary: string = '';

  isListening = false; //change
  recognition: any; //change
  voiceSearchText = ''; //change
  isVoiceSupported = false; //change

  isLoading = true;

  errorMessage = '';

  // searchQuery: any;
  searchQuery: string = '';

  searchControl = new FormControl('');

  suggestions: any[] = [];

  // Separate chart data for clarity

  stockChartData: any = null;

  comparisonChartData: any = null;
  @ViewChild('searchBoxWrapper') searchBoxWrapper!: ElementRef;
  private globalClickListener!: () => void;
  searchErrorMessage: string | null | undefined;
  constructor(
    private route: ActivatedRoute,

    private suggestionService: SuggestionService,

    private stockService: StockService,

    private router: Router,
    private renderer: Renderer2 // private http: HttpClient
  ) {
    this.initVoiceRecognition();
  }
  ngOnDestroy(): void {
    if (this.globalClickListener) {
      this.globalClickListener(); // Remove the global click listener
    }
  }
  stockPerformanceClass: string = '';
  ngOnInit(): void {
    this.symbol = this.route.snapshot.paramMap.get('symbol') || '';

    this.getTrendingStocks();

    if (this.symbol) {
      this.fetchStockDetails(this.symbol);

      this.stockService.getChartData(this.symbol).subscribe((data) => {
        const timestamps = data.chart.result[0].timestamp;

        const prices = data.chart.result[0].indicators.quote[0].close;

        this.stockChartData = {
          labels: timestamps.map((t: number) =>
            new Date(t * 1000).toLocaleTimeString()
          ),

          datasets: [
            {
              label: 'Price',

              data: prices,

              borderColor: 'blue',

              fill: false,

              tension: 0.1,
            },
          ],
        };
      });
    }

    this.searchControl.valueChanges

      .pipe(
        debounceTime(300),

        filter(
          (value: string | null): value is string =>
            !!value && value.length >= 2
        ),

        switchMap((value) => this.suggestionService.getSuggestions(value))
      )

      .subscribe((data) => {
        this.suggestions = data as any[];
      });

    this.globalClickListener = this.renderer.listen(
      'document',
      'click',
      (event: Event) => {
        if (
          this.searchBoxWrapper &&
          !this.searchBoxWrapper.nativeElement.contains(event.target)
        ) {
          this.suggestions = [];
        }
      }
    );
  }
  getTrendingStocks(): void {
    this.isLoadingStocks = true;

    this.errorMessageStocks = null;

    this.stockService
      .getTrendingStocks()

      .pipe(finalize(() => (this.isLoadingStocks = false)))

      .subscribe({
        next: (data) => {
          if (Array.isArray(data) && data.length > 0) {
            this.trendingStocks = data;
            console.log('Stocks loaded:', data);
          } else {
            console.warn('No trending stocks found.');
            this.trendingStocks = [];
            this.errorMessageStocks =
              'No trending stocks available at the moment.';
          }
        },

        error: (err) => {
          console.error('Error loading stocks:', err);

          this.errorMessageStocks =
            err?.message ||
            'Failed to load trending stocks. Please try again later.';

          this.trendingStocks = []; // Clear previous data if any
        },
      });
  }
  private initVoiceRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isVoiceSupported = true;

      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;

      this.recognition.interimResults = false;

      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toUpperCase();

        // Map common company names to stock symbols

        const wordToSymbolMap: { [key: string]: string } = {
          APPLE: 'AAPL',

          MICROSOFT: 'MSFT',

          GOOGLE: 'GOOGL',

          AMAZON: 'AMZN',

          TESLA: 'TSLA',

          NVIDIA: 'NVDA',

          META: 'META',

          NETFLIX: 'NFLX',
          'MPHASIS LTD': 'MPHASIS.NS',
        };

        // Check if transcript matches any company name

        let processedQuery = transcript;

        Object.keys(wordToSymbolMap).forEach((word) => {
          if (transcript.includes(word)) {
            processedQuery = wordToSymbolMap[word];
          }
        });

        // Clean the query (remove spaces and special characters)

        processedQuery = processedQuery.replace(/[^A-Z0-9]/g, '');

        this.voiceSearchText = `Heard: ${transcript}`;

        this.searchQuery = processedQuery;

        // Only search if we got a valid symbol

        if (processedQuery.length >= 2 && processedQuery.length <= 5) {
          this.searchStock();
        } else {
          this.voiceSearchText = 'Could not recognize stock symbol';

          setTimeout(() => (this.voiceSearchText = ''), 3000);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Voice recognition error', event.error);

        this.isListening = false;

        this.voiceSearchText = 'Error: ' + event.error;

        setTimeout(() => (this.voiceSearchText = ''), 3000);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      this.isVoiceSupported = false;

      console.warn('Speech Recognition not supported in this browser');

      this.voiceSearchText = 'Voice search not supported in your browser';

      setTimeout(() => (this.voiceSearchText = ''), 3000);
    }
  }

  toggleVoiceSearch(): void {
    if (!this.isVoiceSupported) {
      this.voiceSearchText = 'Voice search not supported';

      setTimeout(() => (this.voiceSearchText = ''), 3000);

      return;
    }

    if (this.isListening) {
      this.recognition.stop();

      this.isListening = false;

      this.voiceSearchText = '';
    } else {
      this.searchQuery = '';

      this.voiceSearchText =
        'Listening... Speak clearly (e.g., "A A P L" or "Apple")';

      this.suggestions = [];

      try {
        this.recognition.start();

        this.isListening = true;
      } catch (err) {
        console.error('Voice recognition error:', err);

        this.isListening = false;

        this.voiceSearchText = 'Error: Microphone access may be blocked';

        setTimeout(() => (this.voiceSearchText = ''), 3000);

        // Guide user to enable microphone permissions

        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setTimeout(() => {
            this.voiceSearchText =
              'Please allow microphone access in browser settings';
          }, 1000);
        }
      }
    }
  }
  compareStocks(): void {
    const symbol1 = this.stock1.trim().toUpperCase();
    const symbol2 = this.stock2.trim().toUpperCase();

    if (!symbol1 || !symbol2 || symbol1 === symbol2) {
      this.searchErrorMessage =
        'Please enter two different valid stock symbols.';
      return;
    }

    this.isLoadingStocks = true;
    this.comparisonResult = null;
    this.comparisonChartData = null;
    this.searchErrorMessage = null;

    this.stockService
      .compareStocks(symbol1, symbol2)
      .pipe(finalize(() => (this.isLoadingStocks = false)))
      .subscribe({
        next: (data) => {
          if (data && data.stock1 && data.stock2) {
            this.comparisonResult = data;

            // Prepare chart data
            this.comparisonChartData = {
              labels: ['Current Price', 'Change %'],
              datasets: [
                {
                  label: symbol1,
                  data: [data.stock1.currentPrice, data.stock1.changePercent],
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                },
                {
                  label: symbol2,
                  data: [data.stock2.currentPrice, data.stock2.changePercent],
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
              ],
            };
          } else {
            this.searchErrorMessage = 'Comparison data unavailable.';
          }
        },
        error: (err) => {
          console.error('Error comparing stocks:', err);
          this.searchErrorMessage = 'Failed to compare stocks.';
        },
      });
  }
  openComparePopup(): void {
    this.isComparePopupOpen = true;
  }

  closeComparePopup(): void {
    this.isComparePopupOpen = false;
    this.stock1 = '';
    this.stock2 = '';
    this.comparisonResult = null;
    this.comparisonChartData = null;
  }

  fetchStockDetails(symbol: string): void {
    if (!symbol || typeof symbol !== 'string') {
      console.error('Invalid stock symbol provided.');
      this.errorMessage = 'Invalid stock symbol.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.isLoadingSummary = true; //change
    this.errorMessageSummary = ''; //change

    this.stockService.getStockBySymbol(symbol).subscribe({
      next: (data) => {
        const change = data.changePercent || data.change;
        if (change > 0) {
          this.stockPerformanceClass = 'stock-up';
        } else if (change < 0) {
          this.stockPerformanceClass = 'stock-down';
        }
        setTimeout(() => {
          this.stockPerformanceClass = '';
        }, 1000);
        this.stockData = data;
        if (data && typeof data === 'object') {
          this.stockData = data;
        } else {
          console.warn('Unexpected data format received:', data);
          this.errorMessage = 'Unexpected data format received.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching stock details:', err);
        this.errorMessage = err?.message || 'Error fetching stock details.';
        this.isLoading = false;
      },
      complete: () => {
        console.log('Stock details fetch completed.');
      },
    });

    // Fetch stock summary
    this.stockService.getStockSummary(symbol).subscribe({
      next: (summaryResponse: StockSummaryResponse) => {
        this.stockSummary = {
          Symbol: summaryResponse.Symbol || symbol.toUpperCase(),
          Summary: summaryResponse.Summary || 'No summary available',
          Details: {
            CurrentPrice: summaryResponse.Details?.CurrentPrice || 0,
            ChangePercent: summaryResponse.Details?.ChangePercent || 0,
            High: summaryResponse.Details?.High || 0,
            Low: summaryResponse.Details?.Low || 0,
            Open: summaryResponse.Details?.Open || 0,
            PreviousClose: summaryResponse.Details?.PreviousClose || 0,
          },
          Timestamp: summaryResponse.Timestamp || new Date().toISOString(),
        };
        this.isLoadingSummary = false;
      },
      error: (err) => {
        console.error('Error fetching stock summary:', err);
        this.stockSummary = {
          Symbol: symbol.toUpperCase(),
          Summary: 'No summary available',
          Details: {
            CurrentPrice: 0,
            ChangePercent: 0,
            High: 0,
            Low: 0,
            Open: 0,
            PreviousClose: 0,
          },
          Timestamp: new Date().toISOString(),
        };
        this.errorMessageSummary =
          err?.message || 'Error fetching stock summary.';
        this.isLoadingSummary = false;
      },
    });
  }
  toggleAccordion(event: Event): void {
    event.preventDefault();

    this.isAccordionOpen = !this.isAccordionOpen;
  }

  selectSuggestion(suggestion: any): void {
    this.router.navigate(['/stock', suggestion.symbol.toUpperCase()]);
    this.searchQuery = suggestion.symbol;
    this.suggestions = [];
    this.fetchStockDetails(this.searchQuery); // Fetch stock details for the selected suggestion
  }
  onSearchInput() {
    if (this.searchQuery.length < 1) return;
    this.suggestionService
      .getSuggestions(this.searchQuery)
      .subscribe((data) => {
        this.suggestions = data;
      });
  }

  searchStock(): void {
    const symbol = this.searchQuery.trim();
    if (symbol) {
      this.router.navigate(['/stock', symbol.toUpperCase()]);
      this.searchQuery = ''; // Navigate to the stock detail page
      this.suggestions = [];
      this.fetchStockDetails(symbol.toUpperCase()); // Fetch stock details for the entered symbol
      this.isListening = false; // Stop listening after search
      // Clear suggestions after selection
    } else {
      console.error('Please enter a valid stock symbol.');
    }
  }
  logout(): void {
    localStorage.clear(); // Clear local storage
    this.router.navigate(['/login']);
  }

  ngAfterViewInit(): void {
    const containers = document.querySelectorAll('.chart-container');

    containers.forEach((container) => {
      const observer = new ResizeObserver(() => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement;

        if (canvas) {
          canvas.width = container.clientWidth;

          canvas.height = container.clientHeight;
        }
      });

      observer.observe(container);
    });
  }

  gotoAbout(): void {
    this.router.navigate(['/about']);
  }
  gotoVideos(): void {
    this.router.navigate(['/videos']);
  }
  gotoGlossary(): void {
    this.router.navigate(['/glossary']);
  }

  gotoPrediction(): void {
    this.router.navigate(['/stock-predictor']);
  }
}
