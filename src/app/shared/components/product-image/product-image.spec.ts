import { TestBed } from '@angular/core/testing';
import { ProductImage } from './product-image';

describe('ProductImage', () => {
  it('uses a bundled fallback when no image is available', async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductImage);
    fixture.detectChanges();

    expect(fixture.componentInstance.displaySrc).toBe('/Category%20imgs/Luxury_rugs.jpg');
  });

  it('falls back when a database image fails and resets for a new source', async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImage],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductImage);
    fixture.componentRef.setInput('src', 'https://example.com/database-carpet.jpg');
    fixture.detectChanges();

    fixture.componentInstance.handleImageError();
    expect(fixture.componentInstance.displaySrc).toBe('/Category%20imgs/Luxury_rugs.jpg');
    expect(fixture.componentInstance.fallbackFailed).toBe(false);

    fixture.componentRef.setInput('src', 'https://example.com/another-carpet.jpg');
    fixture.detectChanges();

    expect(fixture.componentInstance.displaySrc).toBe('https://example.com/another-carpet.jpg');
    expect(fixture.componentInstance.fallbackFailed).toBe(false);
  });
});
