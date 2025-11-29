# Minimalist Shopify Theme

A high-end minimalist Shopify theme with Times New Roman typography and clean design.

## Features

- Minimalist design with Times New Roman 10px lowercase typography
- Responsive product grid (4 columns desktop, 2 columns mobile)
- Product detail pages with scroll-snap image galleries
- AJAX add to cart with live cart count updates
- Direct checkout link (skips cart page)

## Structure

```
├── assets/
│   ├── app.js
│   └── base.css
├── config/
│   └── settings_schema.json
├── layout/
│   └── theme.liquid
├── sections/
│   └── header.liquid
└── templates/
    ├── index.liquid
    └── product.liquid
```

## Deployment

This theme can be connected to Shopify via:
- GitHub integration (Shopify Partners)
- Shopify CLI: `shopify theme dev`
- Manual upload via admin

