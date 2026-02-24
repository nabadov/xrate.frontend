export interface Currency {
  code: string;
  name: string;
}

export interface ConvertResponse {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  date: string;
}

export interface LatestRatesResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface HistoryRateItem {
  date: string;
  rates: Record<string, number>;
}

export interface HistoryRatesResponse {
  base: string;
  startDate: string;
  endDate: string;
  data: {
    totalCount: number;
    page: number;
    pageSize: number;
    items: HistoryRateItem[];
  };
}
