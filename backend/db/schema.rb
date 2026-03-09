# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_03_09_033228) do
  create_schema "auth"
  create_schema "extensions"
  create_schema "graphql"
  create_schema "graphql_public"
  create_schema "pgbouncer"
  create_schema "realtime"
  create_schema "storage"
  create_schema "vault"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_graphql"
  enable_extension "pg_stat_statements"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "supabase_vault"
  enable_extension "uuid-ossp"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_categories_on_user_id"
  end

  create_table "clients", force: :cascade do |t|
    t.string "name"
    t.string "address"
    t.string "default_project_manager"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "default_project_name"
    t.string "default_purchase_order"
    t.string "default_wbs_code"
    t.index ["user_id"], name: "index_clients_on_user_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "category"
    t.date "date", null: false
    t.text "notes"
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "category_id"
    t.decimal "subtotal"
    t.decimal "tax"
    t.decimal "tip"
    t.decimal "final_total"
    t.index ["category_id"], name: "index_expenses_on_category_id"
    t.index ["date"], name: "index_expenses_on_date"
    t.index ["status"], name: "index_expenses_on_status"
    t.index ["user_id"], name: "index_expenses_on_user_id"
  end

  create_table "invoice_lines", force: :cascade do |t|
    t.bigint "invoice_id", null: false
    t.date "date"
    t.decimal "day_rate"
    t.decimal "field_expenses"
    t.decimal "office_meeting"
    t.decimal "other_expenses"
    t.decimal "vehicle_mileage"
    t.decimal "rotation_mileage"
    t.decimal "daily_total"
    t.bigint "expense_id"
    t.bigint "mileage_log_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expense_id"], name: "index_invoice_lines_on_expense_id"
    t.index ["invoice_id"], name: "index_invoice_lines_on_invoice_id"
    t.index ["mileage_log_id"], name: "index_invoice_lines_on_mileage_log_id"
  end

  create_table "invoices", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "invoice_number", null: false
    t.string "client_name", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.date "due_date", null: false
    t.datetime "paid_at"
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date "billing_period_start"
    t.date "billing_period_end"
    t.date "invoice_date"
    t.string "project_name"
    t.string "purchase_order"
    t.string "wbs_code"
    t.string "project_manager"
    t.bigint "client_id"
    t.index ["client_id"], name: "index_invoices_on_client_id"
    t.index ["due_date"], name: "index_invoices_on_due_date"
    t.index ["invoice_number"], name: "index_invoices_on_invoice_number", unique: true
    t.index ["status"], name: "index_invoices_on_status"
    t.index ["user_id"], name: "index_invoices_on_user_id"
  end

  create_table "mileage_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "vehicle_id"
    t.date "date"
    t.integer "current_odometer"
    t.string "destination"
    t.string "purpose"
    t.decimal "gasoline_litres", precision: 10, scale: 2
    t.decimal "subtotal", precision: 10, scale: 2
    t.decimal "tax", precision: 10, scale: 2
    t.decimal "total_cost", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_mileage_logs_on_user_id"
    t.index ["vehicle_id"], name: "index_mileage_logs_on_vehicle_id"
  end

  create_table "reconciliation_reports", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "period_start", null: false
    t.date "period_end", null: false
    t.decimal "total_expenses", precision: 12, scale: 2, default: "0.0", null: false
    t.decimal "total_invoiced", precision: 12, scale: 2, default: "0.0", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["period_start", "period_end"], name: "index_reconciliation_reports_on_period_start_and_period_end"
    t.index ["user_id"], name: "index_reconciliation_reports_on_user_id"
  end

  create_table "user_profiles", force: :cascade do |t|
    t.string "company_name"
    t.string "company_address"
    t.string "phone"
    t.string "user_name"
    t.string "gst_number"
    t.string "wcb_number"
    t.decimal "default_day_rate"
    t.decimal "default_office_rate"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_user_profiles_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "role", default: 0, null: false
    t.string "jti", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "vehicles", force: :cascade do |t|
    t.string "name"
    t.integer "ruleset"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_vehicles_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "categories", "users"
  add_foreign_key "clients", "users"
  add_foreign_key "expenses", "categories"
  add_foreign_key "expenses", "users"
  add_foreign_key "invoice_lines", "expenses"
  add_foreign_key "invoice_lines", "invoices"
  add_foreign_key "invoice_lines", "mileage_logs"
  add_foreign_key "invoices", "clients"
  add_foreign_key "invoices", "users"
  add_foreign_key "mileage_logs", "users"
  add_foreign_key "mileage_logs", "vehicles"
  add_foreign_key "reconciliation_reports", "users"
  add_foreign_key "user_profiles", "users"
  add_foreign_key "vehicles", "users"
end
