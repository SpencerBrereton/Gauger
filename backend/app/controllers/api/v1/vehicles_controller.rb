module Api
  module V1
    class VehiclesController < BaseController
      before_action :set_vehicle, only: [:show, :update, :destroy]

      # GET /api/v1/vehicles
      def index
        vehicles = current_user.vehicles.order(:name)
        render json: vehicles.map { |v| serialize_vehicle(v) }
      end

      # GET /api/v1/vehicles/:id
      def show
        render json: serialize_vehicle(@vehicle)
      end

      # POST /api/v1/vehicles
      def create
        vehicle = current_user.vehicles.create!(vehicle_params)
        attach_photo(vehicle) if params[:photo].present?
        render json: serialize_vehicle(vehicle), status: :created
      end

      # PATCH/PUT /api/v1/vehicles/:id
      def update
        @vehicle.update!(vehicle_params) if params[:vehicle].present?
        attach_photo(@vehicle) if params[:photo].present?
        render json: serialize_vehicle(@vehicle)
      end

      # DELETE /api/v1/vehicles/:id
      def destroy
        @vehicle.destroy!
        head :no_content
      end

      private

      def set_vehicle
        @vehicle = current_user.vehicles.find(params[:id])
      end

      def vehicle_params
        params.require(:vehicle).permit(:name, :ruleset)
      end

      def attach_photo(vehicle)
        photo = params[:photo]
        if photo.blank? || photo == "[object Object]"
          Rails.logger.warn "Skipping photo attachment for vehicle #{vehicle.id}: photo is blank or invalid string"
          return
        end

        Rails.logger.debug "Attaching photo to vehicle #{vehicle.id}: #{photo.inspect}"
        vehicle.photo.attach(photo)
        
        if vehicle.photo.attached?
          Rails.logger.info "Photo successfully attached to vehicle #{vehicle.id}. Key: #{vehicle.photo.key}"
        else
          Rails.logger.error "Photo attachment failed for vehicle #{vehicle.id} (attached? returned false)"
        end
      rescue => e
        Rails.logger.error "Exception during photo attachment for vehicle #{vehicle.id}: #{e.message}"
        Rails.logger.error e.backtrace.first(10).join("\n")
      end

      def serialize_vehicle(vehicle)
        data = vehicle.as_json(only: [:id, :name, :ruleset, :user_id, :created_at, :updated_at])
        if vehicle.photo.attached?
          data[:photo_url] = Rails.application.routes.url_helpers.rails_storage_proxy_path(vehicle.photo, only_path: true)
        end
        data
      end
    end
  end
end
