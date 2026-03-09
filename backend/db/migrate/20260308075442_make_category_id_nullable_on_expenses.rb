class MakeCategoryIdNullableOnExpenses < ActiveRecord::Migration[7.2]
  def change
    change_column_null :expenses, :category_id, true
  end
end
