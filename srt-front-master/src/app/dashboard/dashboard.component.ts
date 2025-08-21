// DashboardComponent.ts
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';

import { StockService } from '../services/stock.service';

import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs/operators';

import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { debounceTime, filter, switchMap } from 'rxjs/operators';

import { SuggestionService } from '../services/suggestion.service';
import { ChatbotComponent } from '../chatbot/chatbot.component';

import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChatbotComponent,
    NgChartsModule,
  ],

  templateUrl: './dashboard.component.html',

  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  searchQuery: string = '';

  trendingStocks: any[] = [];

  latestNews: any[] = []; // New array to hold the latest news

  isLoadingStocks: boolean = false;

  isLoadingNews: boolean = false;

  errorMessageStocks: string | null = null;
  isSearchDisabled: boolean = false;

  isListening = false; //change
  recognition: any; //change
  voiceSearchText = ''; //change
  isVoiceSupported = false; //change
  loggedInEmail: string | null = null;

  errorMessageNews: string | null = null;
  searchErrorMessage: string | null = null;

  isComparePopupOpen: boolean = false;

  stock1: string = '';

  stock2: string = '';

  comparisonResult: any = null;

  symbol!: string;

  stockData: any;

  comparisonChartData: any = null;

  @ViewChild('searchBoxWrapper') searchBoxWrapper!: ElementRef;
  private globalClickListener!: () => void;
  errorMessage: any;

  constructor(
    private renderer: Renderer2,

    private suggestionService: SuggestionService,

    private stockService: StockService,

    private router: Router
  ) {
    this.initVoiceRecognition();
  }
  ngOnDestroy(): void {
    if (this.globalClickListener) {
      this.globalClickListener(); // Remove the global click listener
    }
  }

  ngOnInit(): void {
    this.loggedInEmail = localStorage.getItem('userEmail');
    this.getTrendingStocks();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),

        filter(
          (value: string | null): value is string =>
            !!value && value.length >= 2
        ),

        switchMap((value) => this.suggestionService.getSuggestions(value))
      )
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.suggestions = data;
            this.errorMessageStocks = null; // Clear any previous error message
          } else {
            this.suggestions = [];
          }
        },
        error: (err) => {
          console.error('Error fetching suggestions:', err);
          this.suggestions = [];
          this.errorMessageStocks =
            'Failed to fetch suggestions. Please try again later.';
        },
      });

    this.getLatestNews(); // Fetch the latest news when the component is initialized
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

  get userInitial(): string {
    // Use loggedInEmail here
    return this.loggedInEmail ? this.loggedInEmail.charAt(0).toUpperCase() : '';
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
          CISCO: 'CSCO',
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

  //till above
  getTrendingStocks(): void {
    this.isLoadingStocks = true;

    this.errorMessageStocks = null;

    this.stockService
      .getTrendingStocks()

      .pipe(finalize(() => (this.isLoadingStocks = false)))

      .subscribe({
        next: (data) => {
          this.trendingStocks = data;

          console.log('Stocks loaded:', data);
        },

        error: (err) => {
          console.error('Error loading stocks:', err);

          this.errorMessageStocks =
            'Failed to load trending stocks. Please try again later.';

          this.trendingStocks = []; // Clear previous data if any
        },
      });
  }

  // New method to fetch the latest news

  getLatestNews(): void {
    this.isLoadingNews = true;

    this.errorMessageNews = null;

    this.stockService
      .getLatestNews() // Assuming a method to get news from the stock service

      .pipe(finalize(() => (this.isLoadingNews = false)))

      .subscribe({
        next: (news) => {
          this.latestNews = news.slice(0, 5); // Limit to the first 5 news articles

          console.log('Latest news loaded:', news);
        },

        error: (err) => {
          console.error('Error loading latest news:', err);

          this.errorMessageNews =
            'Failed to load latest news. Please try again later.';

          this.latestNews = []; // Clear previous news if any
        },
      });
  }

  searchStock(): void {
    const query =
      this.searchQuery && typeof this.searchQuery === 'string'
        ? this.searchQuery.trim().toUpperCase()
        : '';

    console.log('Searching for:', query);
    if (!query) {
      this.searchErrorMessage =
        'Please enter a valid stock symbol (letters & numbers only).';
      return;
    }

    this.isLoadingStocks = true;
    this.searchErrorMessage = null;
    this.stockService.getStockBySymbol(query).subscribe({
      next: (response) => {
        this.isLoadingStocks = false;
        if (response) {
          this.suggestions = [response];
          this.searchErrorMessage = null;

          this.router.navigate(['/stock', query]);
        } else {
          this.suggestions = [];
          this.searchErrorMessage = `No results found for the symbol "${query}".`;
        }
      },
      error: (error) => {
        this.isLoadingStocks = false;
        this.suggestions = [];

        this.searchErrorMessage = 'No results found';
      },
    });
  }

  logout(): void {
    localStorage.clear();

    this.router.navigate(['/login']);
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

  gotoWatchlist(): void {
    this.router.navigate(['/watchlist']);
  }
  gotoPrediction(): void {
    this.router.navigate(['/stock-predictor']);
  }
  refreshData(): void {
    this.getTrendingStocks();

    this.getLatestNews(); // Refresh the news as well
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

  searchControl = new FormControl('');

  suggestions: any[] = [];

  selectSuggestion(suggestion: any): void {
    this.searchQuery = suggestion.symbol; // Set the search query to the selected suggestion

    this.suggestions = [];
    this.searchStock(); // Trigger the search

    // Trigger the search
  }
  onSearchInput() {
    if (this.searchQuery.length < 1) return;
    this.suggestionService
      .getSuggestions(this.searchQuery)
      .subscribe((data) => {
        this.suggestions = data;
      });
  }

  goToStockDetail(symbol: string): void {
    this.router.navigate(['/stock', symbol]);
  }
}
