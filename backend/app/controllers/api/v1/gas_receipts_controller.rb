module Api
  module V1
    class GasReceiptsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_mileage_log

      # GET /api/v1/mileage_logs/:mileage_log_id/receipts/:id
      def show
        if @mileage_log.receipt.attached?
          redirect_to Rails.application.routes.url_helpers.rails_blob_url(@mileage_log.receipt)
        else
          render json: { error: "No receipt attached." }, status: :not_found
        end
      end

      # POST /api/v1/mileage_logs/:mileage_log_id/receipts
      def create
        unless params[:receipt].present?
          return render json: { error: "No image provided." }, status: :unprocessable_entity
        end

        if params[:receipt] == "[object Object]"
          return render json: { error: "Invalid image data received." }, status: :unprocessable_entity
        end

        @mileage_log.receipt.purge if @mileage_log.receipt.attached?
        @mileage_log.receipt.attach(params[:receipt])

        render json: {
          message: "Receipt uploaded successfully.",
          receipt_url: Rails.application.routes.url_helpers.rails_blob_url(@mileage_log.receipt, only_path: true)
        }, status: :created
      end

      # DELETE /api/v1/mileage_logs/:mileage_log_id/receipts/:id
      def destroy
        if @mileage_log.receipt.attached?
          @mileage_log.receipt.purge
          head :no_content
        else
          render json: { error: "No receipt to delete." }, status: :not_found
        end
      end

      private

      def set_mileage_log
        @mileage_log = current_user.mileage_logs.find(params[:mileage_log_id])
      end
    end
  end
end
