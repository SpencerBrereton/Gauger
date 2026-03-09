Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.force_ssl = true
  config.log_level = :info
  config.log_tags = [:request_id]
  config.active_record.dump_schema_after_migration = false
end
