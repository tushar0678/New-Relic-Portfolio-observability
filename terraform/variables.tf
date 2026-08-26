variable "newrelic_account_id" {
  type      = string
  sensitive = true
}

variable "newrelic_api_key" {
  type      = string
  sensitive = true
}

variable "newrelic_region" {
  type    = string
  default = "US"
}

variable "notification_email" {
  type    = string
  default = ""
}

variable "notification_triggers" {
  type    = list(string)
  default = ["ACTIVATED", "CLOSED"]
}
