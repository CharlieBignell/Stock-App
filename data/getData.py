import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt

from pandas_datareader import data as web 
from datetime import timedelta
from utils import getDateFormat, getDayPortfolio

pd.options.mode.chained_assignment = None 

# Get the data
df_basic = pd.read_csv('./inputs/basic.csv')
df_other = pd.read_csv('./inputs/other.csv')

# Format date fields
df_basic['date'] = pd.to_datetime(df_basic['date'])
df_other['date'] = pd.to_datetime(df_other['date'])

# Split buys and sells into separate dataframes
df_buys = df_basic.loc[df_basic["type"] == "BUY"]
df_sells = df_basic.loc[df_basic["type"] == "SELL"]

# Get the earliest transaction date
minDate = min(df_basic["date"].min(), df_other["date"].min())
yesterday = pd.to_datetime("today") - timedelta(days=1)

# A list of all the tickers
tickers_all = df_basic['ticker'].unique()

# A list of all tickers with their currency
tickers_currency = df_buys[["ticker", "currency"]].drop_duplicates().reset_index(drop=True)

# A list of currently held tickers
tickers_current = getDayPortfolio(df_buys, df_sells)["ticker"].explode().unique() 

# Fill the df with all days from first investment to yeasterday, and linearly interpolate missing values in the given columns
def fillDays(df, columns, start = minDate, end = yesterday):
    # Fill df with all days
    dates = pd.date_range(start, end).to_series(name="date")
    df = pd.merge(dates, df, on="date", how="left", sort=True)

    # Interpolate missing values
    df[columns] = df[columns].interpolate(limit_area = "inside")

    return df.fillna(0)

########################
#  Get Overall Market  #
########################

# Get the data
df_spy = web.DataReader("SPY", 'yahoo', minDate, yesterday).reset_index()
df_ftse = web.DataReader("VUKE.L", 'yahoo', minDate, yesterday).reset_index()
df_spy = df_spy[["Date", "Adj Close"]]
df_ftse = df_ftse[["Date", "Adj Close"]]

# Merge them together
df_markets = pd.merge(df_spy, df_ftse, on="Date", how="outer", sort=True)
df_markets = df_markets.rename(columns={"Date": "date", "Adj Close_x": "spy", "Adj Close_y": "ftse"})

df_markets = fillDays(df_markets, ["spy", "ftse"])

########################
#  Get exchange rates  #
########################

# Get any necessary exchange rates
df_exchange_USDGBP = web.DataReader("GBPUSD=X", 'yahoo', minDate, yesterday).reset_index()
df_exchange_USDGBP = df_exchange_USDGBP[["Date", "Close"]]
df_exchange_USDGBP = df_exchange_USDGBP.rename(columns={"Date": "date", "Close": "close_currency"})
df_exchange_USDGBP = fillDays(df_exchange_USDGBP, ["close_currency"])

######################
#  Get closing data  #
######################
df_closing_all = []

for ticker in tickers_all:

    df_closing_ticker = []

    # Get the first transaction date for the ticker
    date_first = df_buys.loc[df_buys["ticker"] == ticker]["date"].min()

    # Get the last transaction date for the ticker, or the current date if it's still being held
    date_last = yesterday
    if ticker not in tickers_current:
        date_last = df_sells.loc[df_sells["ticker"] == ticker]["date"].max()

    # Get the close prices for each day
    df_closing_ticker = web.DataReader(ticker, 'yahoo', date_first, date_last).reset_index()

    # Make sure we have a 'first' date
    while date_first != df_closing_ticker["Date"].min():
        date_first = date_first - timedelta(days=1)
        df_closing_ticker = web.DataReader(ticker, 'yahoo', date_first, date_last).reset_index()

    # Format the df
    df_closing_ticker = df_closing_ticker.rename(columns={"Date": "date", "Close": "close_native"})
    df_closing_ticker = df_closing_ticker[["date", "close_native"]]
    df_closing_ticker = fillDays(df_closing_ticker, "close_native", date_first, date_last)   
    df_closing_ticker["ticker"] = ticker

    # Get the currency for the current ticker
    tickerCurrency = tickers_currency.loc[tickers_currency["ticker"] == ticker, "currency"].values[0]

    # If it's USD, divide by the exchange rate for the relevant day
    if tickerCurrency == "USD":
        df_closing_ticker = pd.merge(df_closing_ticker, df_exchange_USDGBP, how="left", on="date")
        df_closing_ticker["close_native"] = df_closing_ticker["close_native"]/df_closing_ticker["close_currency"]
        df_closing_ticker.drop(columns=["close_currency"], inplace=True)

    # If it's GBp, divide by 100 to convert to £
    elif tickerCurrency == "GBP":
        df_closing_ticker["close_native"] = df_closing_ticker["close_native"]/100
    else:
        print("ERROR: Unidentified Currency - ", ticker)

    df_closing_ticker = df_closing_ticker.rename(columns={"close_native": "close"})

    df_closing_all.append(df_closing_ticker)

# Concatenate all data
df_closing_all = pd.concat(df_closing_all)


df_closing_all.to_csv('./closingPrices.csv', index=False)
df_markets.to_csv('./markets.csv', index=False)
