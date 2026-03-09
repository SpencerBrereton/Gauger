class AddFieldsToInvoices < ActiveRecord::Migration[7.2]
  def change
    add_column :invoices, :billing_period_start, :date
    add_column :invoices, :billing_period_end, :date
    add_column :invoices, :invoice_date, :date
    add_column :invoices, :project_name, :string
    add_column :invoices, :purchase_order, :string
    add_column :invoices, :wbs_code, :string
    add_column :invoices, :project_manager, :string
    add_reference :invoices, :client, null: true, foreign_key: true
  end
end
