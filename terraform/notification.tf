resource "newrelic_notification_destination" "email_destination" {
  count      = var.notification_email == "" ? 0 : 1
  account_id = var.newrelic_account_id
  name       = "${local.site} Email"
  type       = "EMAIL"

  property {
    key   = "email"
    value = var.notification_email
  }
}

resource "newrelic_notification_channel" "email" {
  count          = var.notification_email == "" ? 0 : 1
  account_id     = var.newrelic_account_id
  name           = "${local.site} Email Channel"
  type           = "EMAIL"
  destination_id = newrelic_notification_destination.email_destination[0].id
  product        = "IINT"

  property {
    key   = "subject"
    value = "{{issueTitle}}"
  }

  property {
    key   = "customDetailsEmail"
    value = <<-EOT
Monitor: {{entitiesData.names.[0]}}
Error Type: {{Portfolio Enrichment.ErrorType}}
Error Message: {{Portfolio Enrichment.ErrorMessage}}
Page Type: {{Portfolio Enrichment.PageType}}
Section: {{Portfolio Enrichment.Section}}
URL: {{Portfolio Enrichment.Url}}
EOT
  }
}
