resource "newrelic_workflow" "portfolio_workflow" {
  account_id            = var.newrelic_account_id
  name                  = "${local.site} - Observability Workflow"
  muting_rules_handling = "DONT_NOTIFY_FULLY_MUTED_ISSUES"

  issues_filter {
    name = "portfolio-browser-filter"
    type = "FILTER"

    predicate {
      attribute = "accumulations.conditionName"
      operator  = "EXACTLY_MATCHES"
      values    = [newrelic_nrql_alert_condition.browser_failed.name]
    }
  }

  enrichments {
    nrql {
      name = "Portfolio Enrichment"

      configuration {
        query = <<-EOF
          SELECT latest(custom.ErrorMessage) AS 'ErrorMessage',
                 latest(custom.ErrorType) AS 'ErrorType',
                 latest(custom.PageType) AS 'PageType',
                 latest(custom.Section) AS 'Section',
                 latest(custom.Url) AS 'Url'
          FROM SyntheticCheck
          WHERE monitorName = '${local.homepage_monitor}'
          AND result = 'FAILED'
          SINCE 30 minutes ago
        EOF
      }
    }
  }

  dynamic "destination" {
    for_each = var.notification_email == "" ? [] : [1]
    content {
      channel_id            = newrelic_notification_channel.email[0].id
      notification_triggers = var.notification_triggers
    }
  }
}
