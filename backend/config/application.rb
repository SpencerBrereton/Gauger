require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_mailbox/engine"
require "action_text/engine"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module GaugerApi
  class Application < Rails::Application
    config.load_defaults 7.1

    # API-only mode — no views, cookies, sessions
    config.api_only = true

    # Timezone
    config.time_zone = "UTC"

    # Active Storage: use Cloudflare R2 if configured, otherwise env-specific defaults
    config.active_storage.service = ENV.fetch("ACTIVE_STORAGE_SERVICE") { Rails.env.production? ? :cloudflare_r2 : :local }.to_sym

    # Logger
    config.log_level = :debug
    config.log_tags = [:request_id]
  end
end
