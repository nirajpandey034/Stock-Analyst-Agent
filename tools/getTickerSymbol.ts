import "dotenv/config";
const FINANCIAL_MODEL_API_KEY = process.env.FINANCIAL_MODEL_API_KEY;
const getRealTickerSymbol = async (companyName: string, currency?: string) => {
  const response = await fetch(
    `${process.env.FINANCIAL_MODEL_URL}search-name?query=${companyName}&apikey=${FINANCIAL_MODEL_API_KEY}`,
  );
  if (!response.ok) {
    throw new Error(`FMP API Error: ${response.status}`);
  }
  const result = await response.json();
  const finalResult = result?.filter((item: any) => item.currency == currency);
  return finalResult.map((item: any) => ({
    symbol: item.symbol,
  }));
};

async function getTickerSymbol(companyName: string, currency?: string) {
  const data = await getRealTickerSymbol(companyName, currency);
  return JSON.stringify({ data });
}

export default getTickerSymbol;