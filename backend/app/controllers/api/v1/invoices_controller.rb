module Api
  module V1
    class InvoicesController < BaseController
      before_action :set_invoice, only: [:show, :update, :destroy]

      # GET /api/v1/invoices
      def index
        invoices = current_user.invoices.order(invoice_date: :desc, due_date: :desc)
        render json: invoices, include: :invoice_lines
      end

      # GET /api/v1/invoices/:id
      def show
        render json: @invoice, include: :invoice_lines
      end

      # POST /api/v1/invoices
      def create
        invoice = current_user.invoices.create!(invoice_params)
        # TODO: Send Resend email notification if status == 'sent'
        render json: invoice, status: :created, include: :invoice_lines
      end

      # PATCH/PUT /api/v1/invoices/:id
      def update
        @invoice.update!(invoice_params)
        render json: @invoice, include: :invoice_lines
      end

      # DELETE /api/v1/invoices/:id
      def destroy
        @invoice.destroy!
        head :no_content
      end

      private

      def set_invoice
        @invoice = current_user.invoices.find(params[:id])
      end

      def invoice_params
        params.require(:invoice).permit(
          :invoice_number, :client_name, :amount, :due_date, :paid_at, :status,
          :billing_period_start, :billing_period_end, :invoice_date,
          :project_name, :purchase_order, :wbs_code, :project_manager, :client_id,
          invoice_lines_attributes: [
            :id, :date, :day_rate, :field_expenses, :office_meeting, 
            :other_expenses, :vehicle_mileage, :rotation_mileage, :daily_total,
            :expense_id, :mileage_log_id, :_destroy
          ]
        )
      end
    end
  end
end
