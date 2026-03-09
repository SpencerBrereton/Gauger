Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*" # In development, allow all origins for easier mobile testing

    resource "*",
      headers: :any,
      expose: ["Authorization"],
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
