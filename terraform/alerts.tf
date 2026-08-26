resource "newrelic_alert_policy" "portfolio_policy" {
  name                = "${local.site} - Observability"
  incident_preference = "PER_CONDITION"
}

resource "newrelic_nrql_alert_condition" "homepage_browser_failed" {
  policy_id = newrelic_alert_policy.portfolio_policy.id
  name      = local.browser_alert_name
  type      = "static"
  enabled   = true

  nrql {
    query = "SELECT count(*) FROM SyntheticCheck WHERE monitorName = '${local.homepage_monitor}' AND result = 'FAILED'"
  }

  warning {
    operator              = "above_or_equals"
    threshold             = 1
    threshold_duration    = 60
    threshold_occurrences = "ALL"
  }

  aggregation_window             = 60
  aggregation_method             = "event_flow"
  aggregation_delay              = 30
  expiration_duration            = 3600
  close_violations_on_expiration = true
}

resource "newrelic_nrql_alert_condition" "website_availability_failed" {
  policy_id = newrelic_alert_policy.portfolio_policy.id
  name      = local.availability_alert
  type      = "static"
  enabled   = true

  nrql {
    query = "SELECT count(*) FROM SyntheticCheck WHERE monitorName = '${local.availability_monitor}' AND result != 'SUCCESS'"
  }

  warning {
    operator              = "above_or_equals"
    threshold             = 1
    threshold_duration    = 300
    threshold_occurrences = "AT_LEAST_ONCE"
  }

  aggregation_window = 300
  aggregation_method = "event_flow"
  aggregation_delay  = 60
}
