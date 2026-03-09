module Api
  module V1
    class ReceiptsController < BaseController
      before_action :set_expense

      # GET /api/v1/expenses/:expense_id/receipts/:id
      # :id is unused here since there's only one receipt per expense (has_one_attached)
      def show
        if @expense.receipt_image.attached?
          redirect_to Rails.application.routes.url_helpers.rails_blob_url(@expense.receipt_image)
        else
          render json: { error: "No receipt attached." }, status: :not_found
        end
      end

      # POST /api/v1/expenses/:expense_id/receipts
      def create
        unless params[:receipt_image].present?
          return render json: { error: "No image provided." }, status: :unprocessable_entity
        end

        if params[:receipt_image] == "[object Object]"
          return render json: { error: "Invalid image data received." }, status: :unprocessable_entity
        end

        @expense.receipt_image.purge if @expense.receipt_image.attached?
        @expense.receipt_image.attach(params[:receipt_image])

        render json: {
          message: "Receipt uploaded successfully.",
          receipt_url: Rails.application.routes.url_helpers.rails_blob_url(@expense.receipt_image, only_path: true)
        }, status: :created
      end

      # DELETE /api/v1/expenses/:expense_id/receipts/:id
      def destroy
        if @expense.receipt_image.attached?
          @expense.receipt_image.purge
          head :no_content
        else
          render json: { error: "No receipt to delete." }, status: :not_found
        end
      end

      private

      def set_expense
        @expense = current_user.expenses.find(params[:expense_id])
      end
    end
  end
end
