# Portfolio Observability Demo

Production-style New Relic Synthetic + Terraform observability demo for monitoring a personal portfolio website.

## Goal
Monitor `https://tushar0678.github.io/` using patterns adapted specifically for the portfolio domain.

## Monitored signals
- Homepage availability
- Title and H1/H2 validation
- Visible image health
- Internal navigation/link health
- Error-page pattern detection
- Crawl without revisiting the same page
- New Relic custom insights: `ErrorMessage`, `ErrorType`, `PageType`, `Section`, `Url`
- NRQL alerting and workflow enrichment
- Optional email notification

## Portfolio targets
- `/`
- `/index.html`

The crawler discovers additional internal links on the portfolio domain at runtime.

## Stack
Terraform, New Relic Synthetics, NRQL, JavaScript/Selenium, GitHub Actions.

## Important
This repository is a demo/reference implementation. Replace New Relic account variables and notification integrations with your own environment values before applying Terraform.
