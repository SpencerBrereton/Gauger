ActiveSupport.on_load(:active_storage_base_controller) do
  rescue_from ActiveStorage::FileNotFoundError do |exception|
    Rails.logger.warn "ActiveStorage::FileNotFoundError: #{exception.message}"
    head :not_found
  end
end
