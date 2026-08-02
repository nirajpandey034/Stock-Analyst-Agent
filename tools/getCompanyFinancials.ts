import "dotenv/config";
const FINANCIAL_MODEL_API_KEY = process.env.FINANCIAL_MODEL_API_KEY;
const getRealFinancialData = async (ticker: string) => {
  const response = await fetch(
    `${process.env.FINANCIAL_MODEL_URL}profile?symbol=${ticker}&apikey=${FINANCIAL_MODEL_API_KEY}`,
  );
  const result = await response.json();
  return result;
};
async function getCompanyFinancials(ticker: string) {
  const data = await getRealFinancialData(ticker);
  if (!data?.length) {
    return JSON.stringify({
      error: "Financial data not available",
      ticker,
    });
  }
  return (
    JSON.stringify(data[0]) ||
    JSON.stringify({
      ticker,
      error: "Financial data not available",
    })
  );
}
export default getCompanyFinancials;