class CreateExpenses < ActiveRecord::Migration[7.1]
  def change
    create_table :expenses do |t|
      t.references :user, null: false, foreign_key: true

      t.string  :title,    null: false
      t.decimal :amount,   null: false, precision: 10, scale: 2
      t.string  :category
      t.date    :date,     null: false
      t.text    :notes
      t.integer :status,   null: false, default: 0

      t.timestamps
    end

    add_index :expenses, :status
    add_index :expenses, :date
  end
end
