include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../../modules/ecr"
}

inputs = {
  # Phase 0: hello-world only.
  # Phase 1+: add "gg-catalog", "gg-storefront", "gg-orders", "gg-inventory"
  repository_names = [
    "gg-hello-world",
  ]
}
