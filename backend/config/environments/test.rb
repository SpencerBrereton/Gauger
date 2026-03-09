Rails.application.configure do
  config.cache_classes = true
  config.eager_load = false
  config.servr_timing = true if respond_to?(:server_timing)
  config.log_level = :warn
end
