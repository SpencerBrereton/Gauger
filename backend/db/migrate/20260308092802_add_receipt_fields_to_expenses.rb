class AddReceiptFieldsToExpenses < ActiveRecord::Migration[7.2]
  def change
    add_column :expenses, :subtotal, :decimal
    add_column :expenses, :tax, :decimal
    add_column :expenses, :tip, :decimal
    add_column :expenses, :final_total, :decimal
  end
end
