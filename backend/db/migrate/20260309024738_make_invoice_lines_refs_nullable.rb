class MakeInvoiceLinesRefsNullable < ActiveRecord::Migration[7.2]
  def change
    change_column_null :invoice_lines, :expense_id, true
    change_column_null :invoice_lines, :mileage_log_id, true
  end
end
