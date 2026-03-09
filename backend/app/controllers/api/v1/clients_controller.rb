module Api
  module V1
    class ClientsController < BaseController
      before_action :set_client, only: [:show, :update, :destroy]

      # GET /api/v1/clients
      def index
        clients = current_user.clients.order(name: :asc)
        render json: clients
      end

      # GET /api/v1/clients/:id
      def show
        render json: @client
      end

      # POST /api/v1/clients
      def create
        client = current_user.clients.build(client_params)
        if client.save
          render json: client, status: :created
        else
          render json: { errors: client.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/clients/:id
      def update
        if @client.update(client_params)
          render json: @client
        else
          render json: { errors: @client.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/clients/:id
      def destroy
        @client.destroy!
        head :no_content
      end

      private

      def set_client
        @client = current_user.clients.find(params[:id])
      end

      def client_params
        params.require(:client).permit(:name, :address, :default_project_manager, :default_project_name, :default_purchase_order, :default_wbs_code)
      end
    end
  end
end
