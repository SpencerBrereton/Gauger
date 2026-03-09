module Api
  module V1
    class ReceiptExtractionsController < ApplicationController
      before_action :authenticate_user! # Adjust depending on app auth requirements

      def create
        if params[:receipt].blank?
          return render json: { error: "No receipt image provided." }, status: :bad_request
        end

        file = params[:receipt]

        begin
          extracted_data = ReceiptExtractor.call(file)
          render json: extracted_data, status: :ok
        rescue StandardError => e
          Rails.logger.error "Receipt Extraction Error: #{e.message}"
          render json: { error: "Failed to extract data: #{e.message}" }, status: :unprocessable_entity
        end
      end
    end
  end
end
