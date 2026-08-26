resource "newrelic_synthetics_script_monitor" "portfolio_homepage_browser" {
  name                 = local.homepage_monitor
  status               = "ENABLED"
  type                 = "SCRIPT_BROWSER"
  locations_public     = local.locations_public
  period               = "EVERY_30_MINUTES"
  script_language      = "JAVASCRIPT"
  runtime_type         = "CHROME_BROWSER"
  runtime_type_version = "latest"

  script = file("${path.module}/scripts/portfolio_observability.js")
}

resource "newrelic_synthetics_monitor" "portfolio_website_availability" {
  name             = local.availability_monitor
  type             = "SIMPLE"
  uri              = local.homepage_url
  locations_public = local.locations_public
  period           = "EVERY_5_MINUTES"
  status           = "ENABLED"
  verify_ssl       = true
}
