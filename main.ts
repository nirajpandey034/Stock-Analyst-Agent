import "dotenv/config";
import OpenAI from "openai";
import {
  StockAnalysisSchema,
} from "./schemas/StockAnalysisSchema.ts";
import { STOCK_ANALYSIS_SYSTEM_PROMPT } from "./prompts/stockAnalysis.ts";
import getTickerSymbol from "./tools/getTickerSymbol.ts";
import getCompanyFinancials from "./tools/getCompanyFinancials.ts";

const client = new OpenAI({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.GROQ_API_KEY,
});
const MODEL = process.env.GROQ_MODEL_1;
const userQuery =
  "Analyse TATA Motors stock for investment purpose for Indian Market whose currency is INR";

// defining tools
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getTickerSymbol",
      description:
        "Search matching ticker symbols for a company name. Returns symbol, exchange and currency.",
      parameters: {
        type: "object",
        properties: {
          companyName: {
            type: "string",
            description:
              "the company name for which we need to find stock price e.g., Google, TATA Motors",
          },
          currency: {
            type: "string",
            description:
              "the currency for which you have been asked to provide data e.g.,INR, USD, EUR",
          },
        },
        required: ["companyName", "currency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCompanyFinancials",
      description:
        "Get the financial details for a given ticker, such as revenue, marketcap etc",
      parameters: {
        type: "object",
        properties: {
          ticker: {
            type: "string",
            description:
              "the company name for which we need financial details for example: AAPL",
          },
        },
        required: ["ticker"],
      },
    },
  },
];

// Main message queue
const messages: OpenAI.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: STOCK_ANALYSIS_SYSTEM_PROMPT,
  },
  {
    role: "user",
    content: userQuery,
  },
];

async function main() {
  while (true) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
    });
    // extracting msg
    const message = response?.choices[0]?.message;
    // pushing it to main message queue
    messages.push({
      role: "assistant",
      content: message.content || "",
      tool_calls: message.tool_calls,
    });

    // if no tool call requested by LLM
    if (!message.tool_calls?.length) {
      try {
        const parsed = JSON.parse(message.content || "{}");

        const result = StockAnalysisSchema.safeParse(parsed);

        if (!result.success) {
          console.log("Error: ", result.error.format(), { depth: null });
        } else {
          console.log(result.data);
        }
        break;
      } catch (error) {
        console.error("Invalid JSON returned by model");
        console.log(message.content);
      }
    }

    // if LLM requests tool calls
    for (const toolCall of message.tool_calls) {
      // extracting the arguments for the tool
      const args = JSON.parse(toolCall.function.arguments);

      // loggers for how we get toolcall and args
      console.log("Tool:", toolCall.function.name);

      console.log("Args:", args);
      // loggers END

      let result;

      if (toolCall.function.name === "getTickerSymbol") {
        result = await getTickerSymbol(args.companyName, args.currency);
      }

      if (toolCall.function.name === "getCompanyFinancials") {
        result = await getCompanyFinancials(args.ticker);
      }
      if (!result) {
        throw new Error(`No handler found for ${toolCall.function.name}`);
      }

      // push result to main message queue
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}

main();
