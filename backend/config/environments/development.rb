Rails.application.configure do
  config.cache_classes = false
  config.eager_load = false
  config.consider_all_requests_local = true
  config.server_timing = true
  config.cache_store = :memory_store
  config.assets_debug = true if defined?(Sprockets)
  config.log_level = :debug

  config.action_controller.default_url_options = { host: "localhost", port: 3000 }
end
