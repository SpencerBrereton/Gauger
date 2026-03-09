module Api
  module V1
    class GasReceiptExtractionsController < ApplicationController
      before_action :authenticate_user!

      def create
        if params[:receipt].blank?
          return render json: { error: "No receipt image provided." }, status: :bad_request
        end

        file = params[:receipt]

        begin
          extracted_data = GasReceiptExtractor.call(file)
          render json: extracted_data, status: :ok
        rescue StandardError => e
          Rails.logger.error "Gas Receipt Extraction Error: #{e.message}"
          render json: { error: "Failed to extract data: #{e.message}" }, status: :unprocessable_entity
        end
      end
    end
  end
end
