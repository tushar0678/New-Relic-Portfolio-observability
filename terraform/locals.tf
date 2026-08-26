locals {
  site                  = "Tushar Shukla Portfolio"
  homepage_monitor      = "${local.site} - Homepage Browser"
  availability_monitor  = "${local.site} - Website Availability"
  locations_public      = ["AP_EAST_1"]
  homepage_url          = "https://tushar0678.github.io/"
  browser_alert_name    = "${local.site} - Homepage Browser Failure"
  availability_alert    = "${local.site} - Website Availability Failure"
  workflow_name         = "${local.site} - Observability Workflow"
  enrichment_name       = "${local.site} - Homepage Error Enrichment"
}