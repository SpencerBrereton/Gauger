module Api
  module V1
    class MileageLogsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_mileage_log, only: [:show, :update, :destroy]

      def index
        @mileage_logs = current_user.mileage_logs.order(date: :desc, created_at: :desc)
        # Note: In a real scenario we'd use serializers, but sticking to existing patterns (jbuilder usually, but let's return JSON directly or render if views exist)
        # Let's check how expenses are rendered... Assuming directly or via jbuilder. Let's return JSON directly for now relying on ActiveModelSerializer if present or as_json.
        render json: @mileage_logs
      end

      def show
        render json: @mileage_log
      end

      def create
        @mileage_log = current_user.mileage_logs.build(mileage_log_params)

        if @mileage_log.save
          render json: @mileage_log, status: :created
        else
          render json: { errors: @mileage_log.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @mileage_log.update(mileage_log_params)
          render json: @mileage_log
        else
          render json: { errors: @mileage_log.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @mileage_log.destroy
        head :no_content
      end

      private

      def set_mileage_log
        @mileage_log = current_user.mileage_logs.find(params[:id])
      end

      def mileage_log_params
        params.require(:mileage_log).permit(
          :vehicle_id, :date, :current_odometer, :destination, :purpose,
          :gasoline_litres, :subtotal, :tax, :total_cost
        )
      end
    end
  end
end
