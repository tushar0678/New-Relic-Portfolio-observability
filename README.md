# Tushar Shukla Portfolio Observability

This is a small New Relic + Terraform project I use to monitor my personal portfolio: [https://tushar0678.github.io/](https://tushar0678.github.io/).

The main idea is simple: check that the site is up, make sure the important page elements are present, catch broken images and obvious error pages, and send enough information to New Relic to understand what actually failed.

## What this project checks

The browser synthetic monitor currently checks:

- Portfolio homepage availability
- Page title
- H1/H2 headings
- A small number of visible images
- Internal links on the portfolio domain
- Common error-page/error-message text
- Duplicate URLs while crawling
- The exact URL where a validation error occurred

The script also sends these custom attributes to New Relic when the run fails:

```text
ErrorMessage
ErrorType
PageType
Section
Url
```

That makes the alert more useful than a generic "synthetic failed" message.

## Repository layout

```text
.
├── azurePipeline.yml
├── .github/
│   └── workflows/
│       └── terraform.yml
├── terraform/
│   ├── providers.tf
│   ├── variables.tf
│   ├── locals.tf
│   ├── monitors.tf
│   ├── alerts.tf
│   ├── workflow.tf
│   ├── notification.tf
│   └── scripts/
│       └── portfolio_observability.js
└── README.md
```

## What you need

Before deploying, make sure you have:

- A New Relic account
- A New Relic API key with access to create/manage the required resources
- Terraform installed locally, if you want to run it from your machine
- Git
- An Azure DevOps project if you want to use the deployment pipeline
- An Azure DevOps service connection if your Terraform backend needs Azure authentication

## 1. Clone the repository

```bash
git clone https://github.com/tushar0678/New-Relic-Portfolio-observability.git
cd New-Relic-Portfolio-observability
```

## 2. Check the portfolio URL

The target URL is defined in:

```text
terraform/locals.tf
```

Current value:

```text
https://tushar0678.github.io/
```

The monitor names are also defined there. They are intentionally explicit so that they are easy to identify in New Relic:

```text
Tushar Shukla Portfolio - Homepage Browser
Tushar Shukla Portfolio - Website Availability
```

If the portfolio URL changes, update `homepage_url` and keep the crawler restricted to the same host.

## 3. Configure New Relic credentials

Do not put the API key in Git.

For a local deployment, set the Terraform variables in your shell. For example:

```bash
export TF_VAR_newrelic_account_id="YOUR_NEW_RELIC_ACCOUNT_ID"
export TF_VAR_newrelic_api_key="YOUR_NEW_RELIC_API_KEY"
export TF_VAR_notification_email="YOUR_EMAIL"
```

Check `terraform/variables.tf` to see the variable names used by the project.

## 4. Test Terraform locally

```bash
cd terraform
terraform fmt -recursive
terraform init
terraform validate
terraform plan
```

I recommend reviewing the plan before applying anything.

For a manual deployment:

```bash
terraform apply
```

Confirm the resources shown by Terraform and approve the apply when you are happy with the plan.

## 5. Azure DevOps pipeline

The deployment pipeline is in:

```text
azurePipeline.yml
```

It follows the same basic pattern as the reference project used for this demo:

```text
Validate -> Plan -> publish plan artifact -> Apply
```

### Validate

Runs:

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

### Plan

Runs Terraform plan and creates:

```text
portfolio-observability.tfplan
```

That plan is published as the `tfplan` pipeline artifact.

### Apply

The Apply stage:

- runs only for `main`
- downloads the exact plan artifact produced by the Plan stage
- deploys through the `portfolio-observability-prod` Azure DevOps environment
- runs `terraform apply` against that saved plan

This keeps the plan that was reviewed separate from a new plan being generated during Apply.

For a production-like setup, add an approval/check to the `portfolio-observability-prod` environment.

## 6. Azure DevOps variables

The pipeline expects these values:

| Variable | Used for |
|---|---|
| `NEWRELIC-API-KEY` | New Relic API key (secret) |
| `NEWRELIC-ACCOUNT-ID` | New Relic account ID |
| `NOTIFICATION-EMAIL` | Optional notification address |
| `AZURE-SERVICE-CONNECTION` | Azure DevOps service connection |

Keep the New Relic API key secret.

If you add an AzureRM remote backend later, create a separate state location/key for this project. Do not point it at the old GroupSite state.

## 7. Create the Azure DevOps pipeline

In Azure DevOps:

1. Open **Pipelines**.
2. Select **New pipeline**.
3. Select the repository.
4. Choose **Existing Azure Pipelines YAML file**.
5. Select `/azurePipeline.yml`.
6. Save the pipeline.
7. Add the variables listed above.
8. Create/configure the `portfolio-observability-prod` environment.
9. Add an approval/check when required.
10. Run the pipeline.

You should see:

```text
Validate
  -> Plan
      -> tfplan artifact
          -> Apply
```

## 8. GitHub Actions

There is also a lightweight GitHub Actions workflow at:

```text
.github/workflows/terraform.yml
```

It is only for repository validation. It runs on pushes and pull requests and checks:

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

Azure DevOps is the deployment pipeline in this demo.

## 9. How the browser monitor works

The actual synthetic script is here:

```text
terraform/scripts/portfolio_observability.js
```

The script starts from the portfolio homepage, discovers internal links, and visits a limited number of pages so the synthetic does not run forever.

It keeps a set of visited URLs so the same page is not checked twice.

For each page it roughly does this:

```text
Load page
  -> Check for an obvious error page
  -> Check title
  -> Check H1/H2
  -> Check a few visible images
  -> Collect internal links
  -> Continue to next unique page
```

When something fails, the script keeps the error tied to the actual page URL.

## 10. Changing the monitor

If you want to add another validation, edit:

```text
terraform/scripts/portfolio_observability.js
```

A normal change should look like this:

```text
Edit script
   ↓
Run terraform fmt
   ↓
Run terraform validate
   ↓
Commit + push
   ↓
Open PR
   ↓
GitHub Actions validation
   ↓
Merge to main
   ↓
Azure DevOps Validate
   ↓
Azure DevOps Plan
   ↓
Production approval (if configured)
   ↓
Azure DevOps Apply
```

## 11. Changing monitor names or URL

Update:

```text
terraform/locals.tf
```

This is the central place for the site name, monitor names and portfolio URL.

After changing it:

```bash
cd terraform
terraform fmt -recursive
terraform validate
terraform plan
```

Review the planned resource changes carefully. Renaming a New Relic resource can result in Terraform replacing the resource depending on the provider behavior.

## 12. Changing alerts

Alert conditions are in:

```text
terraform/alerts.tf
```

The current alerts cover browser failures and website availability failures.

The conditions are based on the actual New Relic synthetic monitor names from `locals.tf`, so keep the names consistent when making changes.

## 13. Changing the workflow and enrichment

Workflow configuration is in:

```text
terraform/workflow.tf
```

The enrichment query adds:

```text
ErrorMessage
ErrorType
PageType
Section
Url
```

from recent failed `SyntheticCheck` events for the portfolio browser monitor.

If you rename the browser monitor, make sure the workflow filter and NRQL query are still using the new name.

## 14. Notifications

Notification configuration is in:

```text
terraform/notification.tf
```

Email notification is optional. You can leave it disabled for a demo environment and enable it later through the Terraform variables.

## 15. Typical deployment from a code change

For example, suppose you want to check another portfolio page:

1. Update the browser script or Terraform configuration.
2. Run `terraform fmt -recursive`.
3. Run `terraform validate`.
4. Push the change and open a PR.
5. GitHub Actions checks the Terraform.
6. Merge the PR into `main`.
7. Azure DevOps runs the Validate stage.
8. The Plan stage creates `portfolio-observability.tfplan`.
9. The plan is published as an artifact.
10. The production environment approval/check runs, if configured.
11. Apply downloads that same plan artifact and applies it.
12. New Relic receives the updated monitor/alert configuration.

## 16. Troubleshooting

### Terraform init/plan fails

Check the New Relic account ID, API key and provider configuration first.

### Pipeline cannot find a variable

Check the Azure DevOps pipeline variables/variable group and make sure the variable names match the YAML exactly.

### Synthetic monitor fails on the homepage

Open the monitor in New Relic and check the failure details. The script writes the failing URL into the custom `Url` attribute when an error is collected.

### Alert is firing but enrichment is empty

Check that:

- the browser monitor actually failed
- the custom attributes were set by the script
- the workflow is filtering the current browser monitor name
- the NRQL `SINCE` window still includes the failure

### Terraform wants to destroy an existing monitor unexpectedly

Stop and review the plan before applying. A name/address change in Terraform can make the provider see a different resource.

## 17. Security

- Never commit New Relic API keys.
- Keep Azure service connection credentials in Azure DevOps.
- Use secret variables/variable groups for sensitive values.
- Keep a separate Terraform state for this project.
- Keep the synthetic crawler restricted to `tushar0678.github.io`.

## Tech used

Terraform, New Relic Synthetics, NRQL, JavaScript/Selenium, Azure DevOps, GitHub Actions and Azure.
