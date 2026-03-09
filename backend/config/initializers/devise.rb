Devise.setup do |config|
  config.mailer_sender = "noreply@gauger.app"

  # Use database authenticatable
  require "devise/orm/active_record"

  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
  config.skip_session_storage = [:http_auth]
  config.stretches = Rails.env.test? ? 1 : 12

  config.reset_password_within = 6.hours
  config.expire_all_remember_me_on_sign_out = true
  config.password_length = 8..128
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/
  config.sign_out_via = :delete

  # JWT config (devise-jwt)
  config.jwt do |jwt|
    jwt.secret = ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.credentials.secret_key_base || "temporary_secret_for_development_only" }
    jwt.dispatch_requests = [
      ["POST", %r{^/api/v1/users/sign_in$}]
    ]
    jwt.revocation_requests = [
      ["DELETE", %r{^/api/v1/users/sign_out$}]
    ]
    jwt.expiration_time = 1.day.to_i
  end
end
