import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app'; // 1. Import the correct class name
import { ActivatedRoute } from '@angular/router'; // Needed for routing testing
import { provideHttpClient } from '@angular/common/http'; // Needed for ApiService
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent], // 2. Use AppComponent here
      providers: [
          // 3. Provide dependencies required by AppComponent (ApiService -> HttpClient)
          provideHttpClient(),
          provideHttpClientTesting(), 
          { 
            provide: ActivatedRoute, 
            useValue: { snapshot: { paramMap: { get: () => null } } } 
          }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent); // 4. Use AppComponent here
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // 5. Updated this test to look for something that actually exists in your new HTML
  it('should render the dashboard tab', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // We look for the "Control Tower" text instead of "Hello..."
    expect(compiled.textContent).toContain('Control Tower');
  });
});