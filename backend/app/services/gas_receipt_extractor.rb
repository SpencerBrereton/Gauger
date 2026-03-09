require "httparty"
require "base64"

class GasReceiptExtractor
  include HTTParty
  base_uri "https://api.openai.com/v1"

  def self.call(file)
    new.extract(file)
  end

  def extract(file)
    api_key = ENV["OPENAI_API_KEY"]
    if api_key.blank?
      raise StandardError, "OPENAI_API_KEY environment variable is not set."
    end

    base64_image = encode_image(file)

    body = {
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that extracts data from gas and mileage receipts. " \
                   "You must ALWAYS return a JSON object with the following keys: " \
                   "destination (string, the name of the gas station or merchant), " \
                   "date (string, format YYYY-MM-DD), " \
                   "gasoline_litres (number, amount of gas in litres or gallons pumped), " \
                   "subtotal (number or null), " \
                   "tax (number or null), " \
                   "total_cost (number, final total paid). " \
                   "Do not attempt to extract odometer and purpose. " \
                   "If any value cannot be determined, set it to null."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the data from this gas station receipt." },
            { type: "image_url", image_url: { url: "data:image/jpeg;base64,#{base64_image}" } }
          ]
        }
      ]
    }

    response = self.class.post(
      "/chat/completions",
      headers: {
        "Authorization" => "Bearer #{api_key}",
        "Content-Type" => "application/json"
      },
      body: body.to_json
    )

    if response.success?
      JSON.parse(response.dig("choices", 0, "message", "content") || "{}")
    else
      raise StandardError, "OpenAI API Error: #{response.body}"
    end
  end

  private

  def encode_image(file)
    if file.is_a?(String)
      return file if file.start_with?("data:image")
      Base64.strict_encode64(File.read(file))
    elsif file.respond_to?(:read)
      Base64.strict_encode64(file.read)
    else
      raise ArgumentError, "Unsupported file format for extraction."
    end
  end
end
