class CreateInvoices < ActiveRecord::Migration[7.1]
  def change
    create_table :invoices do |t|
      t.references :user, null: false, foreign_key: true

      t.string   :invoice_number, null: false
      t.string   :client_name,    null: false
      t.decimal  :amount,         null: false, precision: 10, scale: 2
      t.date     :due_date,       null: false
      t.datetime :paid_at
      t.integer  :status,         null: false, default: 0

      t.timestamps
    end

    add_index :invoices, :invoice_number, unique: true
    add_index :invoices, :status
    add_index :invoices, :due_date
  end
end
