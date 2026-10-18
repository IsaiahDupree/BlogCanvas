# Changelog


## 2026-05-12 — bf4253c

feat: workflow tests (e2e, integration, accessibility, component); topic-clusters/scraper updates

Files changed:
   .../accessibility/workflow/a11y-testing.test.tsx   | 109 +++
   .../workflow/one-page-workflow-network.test.tsx    | 352 ++++++++
   .../component/workflow/one-page-workflow.test.tsx  | 131 +++
   __tests__/e2e/workflow/complete-flow.test.ts       |  62 ++
   __tests__/integration/one-page-workflow.test.ts    | 347 ++++++++
   .../workflow/blog-generation-api.test.ts           |  75 ++
   .../integration/workflow/gap-analysis-api.test.ts  |  57 ++
   .../integration/workflow/network-errors.test.ts    | 209 +++++
   .../integration/workflow/real-website.test.ts      |  94 +++
   .../performance/workflow/load-testing.test.ts      | 134 ++++
   .../regression/workflow/regression-suite.test.ts   |  97 +++
   .../workflow/vulnerability-testing.test.ts         | 135 ++++
   __tests__/setup/jest-setup.ts                      |  29 +
   __tests__/setup/server-manager.ts                  | 482 +++++++++++
   __tests__/setup/test-helpers.ts                    |  32 +
   __tests__/smoke/workflow/smoke-tests.test.ts       | 150 ++++
   __tests__/unit/workflow/blog-suggestions.test.ts   |  37 +
   __tests__/unit/workflow/gap-analyzer.test.ts       |  42 +
   __tests__/unit/workflow/openai-provider.test.ts    |  27 +
   docs/CLICKUP_INTEGRATION.md                        | 265 ++++++
   docs/DEPLOYMENT_FINAL_STATUS.md                    |  85 ++
   docs/MAKE_COM_V0_SETUP.md                          | 535 +++++++++++++
   docs/NETWORK_ERROR_TESTS.md                        | 133 ++++
   docs/ONE_PAGE_WORKFLOW.md                          | 196 +++++
   docs/PRD_AND_SCREENSHOTS.md                        | 141 ++++
   docs/SECURITY_FIX_APPLIED.md                       |  70 ++
   docs/SECURITY_WORKAROUND.md                        |  74 ++
   docs/TEST_COVERAGE.md                              | 139 ++++
   docs/TEST_SERVER_CONFIG.md                         | 168 ++++
   docs/TEST_STRUCTURE.md                             | 106 +++
   docs/TEST_SUMMARY.md                               |  78 ++
   docs/WORDBREW_IMPLEMENTATION.md                    |  75 ++
   jest.config.mjs                                    |   5 +-
   make-com-v0-automation.json                        | 671 ++++++++++++++++
   next-env.d.ts                                      |   2 +-
   package-lock.json                                  | 885 ++++++++++++++++++++-
   package.json                                       |   2 +
   scraped-data/wordbrew-analysis-detailed.md         |  24 +
   scraped-data/wordbrew-analysis.md                  |  20 +
   scraped-data/wordbrew-homepage.png                 | Bin 0 -> 547999 bytes
   scraped-data/wordbrew-structure-detailed.json      |  84 ++
   scraped-data/wordbrew-structure.json               |  19 +
   screenshots/analyze.png                            | Bin 0 -> 41783 bytes
   screenshots/app.png                                | Bin 0 -> 41783 bytes
   screenshots/app_analytics.png                      | Bin 0 -> 41783 bytes
   screenshots/app_batches.png                        | Bin 0 -> 41783 bytes
   screenshots/app_clients.png                        | Bin 0 -> 41783 bytes
   screenshots/app_publishing.png                     | Bin 0 -> 41783 bytes
   screenshots/app_review.png                         | Bin 0 -> 41783 bytes
   screenshots/app_settings.png                       | Bin 0 -> 41783 bytes
   screenshots/app_websites.png                       | Bin 0 -> 41783 bytes
   screenshots/auth_reset-password.png                | Bin 0 -> 41783 bytes
   screenshots/blog.png                               | Bin 0 -> 41783 bytes
   screenshots/brand-guide.png                        | Bin 0 -> 41783 bytes
   screenshots/home.png                               | Bin 0 -> 41783 bytes
   screenshots/index.html                             | 303 +++++++
   screenshots/portal_batches.png                     | Bin 0 -> 41783 bytes
   screenshots/portal_brand.png                       | Bin 0 -> 41783 bytes
   screenshots/portal_dashboard.png                   | Bin 0 -> 41783 bytes
   screenshots/portal_login.png                       | Bin 0 -> 41783 bytes
   screenshots/portal_posts.png                       | Bin 0 -> 41783 bytes
   screenshots/portal_settings_notifications.png      | Bin 0 -> 41783 bytes
   screenshots/posts.png                              | Bin 0 -> 41783 bytes
   screenshots/settings.png                           | Bin 0 -> 41783 bytes
   scripts/scrape-wordbrew.ts                         | 338 ++++++++
   scripts/screenshot-site.ts                         | 314 ++++++++
   src/app/api/health/route.ts                        |  15 +-
   src/app/api/webhooks/clickup/route.ts              | 101 +++
   src/app/api/workflow/export-google-docs/route.ts   |  88 ++
   src/app/api/workflow/export/route.ts               | 144 ++++
   src/app/api/workflow/gap-analysis/route.ts         | 251 ++++++
   src/app/api/workflow/generate-blogs/route.ts       | 165 ++++
   src/app/api/workflow/generate-suggestions/route.ts | 102 +++
   src/app/layout.tsx                                 |   2 +-
   src/app/one-page-workflow/page.tsx                 | 695 ++++++++++++++++
   src/app/portal/login/layout.tsx                    |  12 +
   src/components/ui/input.tsx                        |  26 +
   src/components/ui/progress.tsx                     |  29 +
   src/components/workflow/terminal-viewer.tsx        | 294 +++++++
   src/lib/ai/brand-generator.ts                      |  92 +++
   src/lib/ai/email-generator.ts                      |  80 ++
   src/lib/ai/openai-provider.ts                      | 105 +++
   src/lib/analysis/topic-clusters.ts                 |  31 +-
   src/lib/integrations/clickup/automation-trigger.ts | 150 ++++
   src/lib/integrations/clickup/clickup-client.ts     | 103 +++
   src/lib/integrations/clickup/webhook-processor.ts  |  93 +++
   .../clickup/workflows/blog-workflow.ts             | 133 ++++
   .../clickup/workflows/brand-guide-workflow.ts      |  83 ++
   .../clickup/workflows/email-campaign-workflow.ts   |  93 +++
   src/lib/integrations/google-drive/drive-client.ts  | 169 ++++
   src/lib/scraper/website-scraper.ts                 |  34 +-
   src/middleware.ts                                  |  10 +
   .../migrations/20241206_clickup_integration.sql    |  96 +++
   tsconfig.json                                      |  17 +-
   94 files changed, 10508 insertions(+), 38 deletions(-)
