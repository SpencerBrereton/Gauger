# Puma configuration for Render
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
threads max_threads_count, max_threads_count

# Use the port Render tells us to use
port ENV.fetch("PORT") { 3000 }

# Use production environment
environment ENV.fetch("RAILS_ENV") { "production" }

# Explicitly disable workers for now to avoid cluster-mode port collision issues
workers 0

# Allow puma to be restarted by `bin/rails restart` command.
plugin :tmp_restart
