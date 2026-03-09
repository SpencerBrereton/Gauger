class AddMissingFieldsToClients < ActiveRecord::Migration[7.2]
  def change
    add_column :clients, :default_project_name, :string
    add_column :clients, :default_purchase_order, :string
    add_column :clients, :default_wbs_code, :string
  end
end
