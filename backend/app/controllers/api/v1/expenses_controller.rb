module Api
  module V1
    class ExpensesController < BaseController
      before_action :set_expense, only: [:show, :update, :destroy]

      # GET /api/v1/expenses
      def index
        expenses = current_user.expenses.order(date: :desc)
        render json: expenses.map { |e| serialize_expense(e) }
      end

      # GET /api/v1/expenses/:id
      def show
        render json: serialize_expense(@expense)
      end

      # POST /api/v1/expenses
      def create
        expense = current_user.expenses.create!(expense_params)
        attach_receipt(expense) if params[:receipt_image].present?
        render json: serialize_expense(expense), status: :created
      end

      # PATCH/PUT /api/v1/expenses/:id
      def update
        @expense.update!(expense_params) if params[:expense].present?
        attach_receipt(@expense) if params[:receipt_image].present?
        render json: serialize_expense(@expense)
      end

      # DELETE /api/v1/expenses/:id
      def destroy
        @expense.destroy!
        head :no_content
      end

      private

      def set_expense
        @expense = current_user.expenses.find(params[:id])
      end

      def expense_params
        params.require(:expense).permit(:title, :amount, :category_id, :category, :date, :notes, :status)
      end

      def attach_receipt(expense)
        image = params[:receipt_image]
        if image.blank? || image == "[object Object]"
          Rails.logger.warn "Skipping receipt attachment for expense #{expense.id}: image is blank or invalid string"
          return
        end

        Rails.logger.debug "Attaching receipt to expense #{expense.id}: #{image.inspect}"
        expense.receipt_image.attach(image)
        
        if expense.receipt_image.attached?
          Rails.logger.info "Receipt successfully attached to expense #{expense.id}. Key: #{expense.receipt_image.key}"
        else
          Rails.logger.error "Receipt attachment failed for expense #{expense.id} (attached? returned false)"
        end
      rescue => e
        Rails.logger.error "Exception during receipt attachment for expense #{expense.id}: #{e.message}"
        Rails.logger.error e.backtrace.first(10).join("\n")
      end

      def serialize_expense(expense)
        data = expense.as_json(only: [:id, :title, :amount, :category_id, :category, :date, :notes, :status, :created_at, :updated_at])
        data[:category_name] = expense.category&.name || expense.category
        if expense.receipt_image.attached?
          data[:receipt_url] = Rails.application.routes.url_helpers.rails_storage_proxy_path(expense.receipt_image, only_path: true)
        end
        data
      end
    end
  end
end
