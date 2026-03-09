class CreateInvoiceLines < ActiveRecord::Migration[7.2]
  def change
    create_table :invoice_lines do |t|
      t.references :invoice, null: false, foreign_key: true
      t.date :date
      t.decimal :day_rate
      t.decimal :field_expenses
      t.decimal :office_meeting
      t.decimal :other_expenses
      t.decimal :vehicle_mileage
      t.decimal :rotation_mileage
      t.decimal :daily_total
      t.references :expense, null: false, foreign_key: true
      t.references :mileage_log, null: false, foreign_key: true

      t.timestamps
    end
  end
end
