import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
const StockAnalysisSchema = z.object({
  company: z.string(),
  recommendation: z.enum(["BUY", "SELL", "HOLD"]),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

const StockAnalysisJSONSchema =
  zodToJsonSchema(StockAnalysisSchema);

export {StockAnalysisSchema, StockAnalysisJSONSchema};