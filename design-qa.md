# Design QA — Product Details, Location Selection, and Barcode

## Comparison target

- Source visual truth:
  - `C:\Users\User\AppData\Local\Temp\codex-clipboard-d77ab59d-0b15-4767-a321-0b9f480e026d.png` — stock-action bottom spacing, 624 × 617 px.
  - `C:\Users\User\AppData\Local\Temp\codex-clipboard-667378c2-63a6-4adf-9824-67833269a7cf.png` — latest confirmation that the buttons still touched the modal edge.
  - `C:\Users\User\AppData\Local\Temp\codex-clipboard-fed84b75-9969-462b-aa5b-1fe004a8263f.png` — product detail information, 878 × 630 px.
  - `C:\Users\User\AppData\Local\Temp\codex-clipboard-de12842b-5292-48c1-a0ce-19666fb25674.png` — product-list category/SKU cell, 113 × 71 px.
  - `C:\Users\User\AppData\Local\Temp\codex-clipboard-df00d01b-3935-4afb-8b1e-2a09b2aa63e2.png` — warehouse location field, 399 × 119 px.
  - `C:\Users\User\AppData\Local\Temp\codex-clipboard-7af17c1c-0420-4983-9696-fe4dc0230002.png` — product QR output to replace, 586 × 499 px.
- Browser-rendered implementation:
  - `audit/36-products-sku-only.png` — 900 × 650 px.
  - `audit/37-product-details-40-60-barcode.png` — 900 × 650 px.
  - `audit/40-product-details-narrow-fixed.png` — 501 × 642 px.
  - `audit/46-product-details-safe-bottom.png` — 501 × 642 px, final explicit safe-area implementation.
  - `audit/44-label-designer-barcode-final.png` — 920 × 594 px.
  - `audit/45-registration-location-paired.png` — 900 × 650 px.
- Combined full-view comparison: `audit/qa-feedback-round2-comparison.png`.
- Focused bottom-edge comparison: `audit/qa-stock-buttons-safe-area-comparison.png`.
- Density normalization: browser screenshots were captured at device scale factor 1. Source images were aspect-fit into equal 760 × 440 px comparison cells without cropping.
- States: products list, product-detail modal, narrow product-detail modal scrolled to actions, registration Stock Setup step, and label designer.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Product detail uses measured 39.999% / 59.999% columns at 900 px viewport.
- Narrow product detail now reserves a real 20 px spacer row below the buttons plus 28.81 px to the modal edge; the white safe area remains visible after scrolling to the bottom.
- Product list shows the product code only (`DAIR-0001`); the category name is not repeated in that cell.
- Warehouse location is a fixed two-stage choice: 8 warehouse sections plus `Not assigned`, followed by positions `01`–`20`. The final evidence shows `Rack B` and `03` in equal-width adjacent controls.
- Product detail, registration copy/actions, scan entry points, and warehouse labels no longer expose QR UI. The label designer contains one 224 × 56 px one-dimensional barcode image and zero QR images.

## Required fidelity surfaces

- Fonts and typography: existing product font family, heavy headings, compact uppercase eyebrow, tabular SKU styling, and status hierarchy are preserved.
- Spacing and layout rhythm: modal frame, 40/60 split, card gaps, action spacing, and narrow-screen bottom padding are visibly consistent.
- Colors and visual tokens: existing teal, pale teal, red, amber, border, and surface tokens are reused with no new off-brand colors.
- Image quality and asset fidelity: barcodes are generated as real PNG assets with Code 128 through JsBarcode; no CSS-drawn or placeholder barcode remains.
- Copy and content: visible QR references are replaced with Barcode; product-code-only and fixed-location copy match the requested behavior.

## Interaction and accessibility checks

- Product row opens the correct detail modal.
- Barcode images generate with readable alt text and data URLs.
- Warehouse Position Number stays disabled until a section is selected, then accepts one of the fixed values.
- Registration, label designer, and product detail controls remain keyboard-addressable native controls.
- Browser console errors/warnings checked: none.
- Production build and inventory logic checks passed.

## Comparison history

1. First pass found two P2 issues:
   - the narrow action row still appeared flush against the modal edge;
   - the label barcode inherited the old QR-sized image dimensions.
2. Fixes:
   - mobile product-detail content now contributes its full height to the scroll area and preserves bottom padding;
   - barcode selectors were strengthened and the label code row was changed to one centered column.
3. Post-fix evidence:
   - `audit/40-product-details-narrow-fixed.png` shows the action-row gap;
   - `audit/44-label-designer-barcode-final.png` shows the full-width horizontal barcode;
   - `audit/45-registration-location-paired.png` shows the two fixed location choices side by side.
4. The user's latest screenshot showed that padding alone was not visibly reliable in the deployed narrow layout. A dedicated grid spacer row was added below the buttons. `audit/qa-stock-buttons-safe-area-comparison.png` and `audit/46-product-details-safe-bottom.png` show the final, visibly separated state.

## Follow-up polish

- No P3 visual follow-up is required for this request.

final result: passed
