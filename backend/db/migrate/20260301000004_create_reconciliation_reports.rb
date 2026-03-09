class CreateReconciliationReports < ActiveRecord::Migration[7.1]
  def change
    create_table :reconciliation_reports do |t|
      t.references :user, null: false, foreign_key: true

      t.date    :period_start,    null: false
      t.date    :period_end,      null: false
      t.decimal :total_expenses,  null: false, precision: 12, scale: 2, default: 0
      t.decimal :total_invoiced,  null: false, precision: 12, scale: 2, default: 0
      t.text    :notes

      t.timestamps
    end

    add_index :reconciliation_reports, [:period_start, :period_end]
  end
end
