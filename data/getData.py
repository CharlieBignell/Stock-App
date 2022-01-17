import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt

from pandas_datareader import data as web 
from datetime import timedelta
from utils import getDateFormat, getDayPortfolio

pd.options.mode.chained_assignment = None 

# Get the data
print("Reading local data...")
df_basic = pd.read_csv('./inputs/basic.csv')
df_other = pd.read_csv('./inputs/other.csv')

# Format date fields
df_basic['Date'] = pd.to_datetime(df_basic['Date'])
df_other['Date'] = pd.to_datetime(df_other['Date'])

# Split buys and sells into separate dataframes
df_buys = df_basic.loc[df_basic["Type"] == "BUY"]
df_sells = df_basic.loc[df_basic["Type"] == "SELL"]

# Get the earliest transaction date
minDate = min(df_basic["Date"].min(), df_other["Date"].min())

# A list of all the tickers
tickers_all = df_basic['Name'].unique()

# A list of all tickers with their currency
tickers_currency = df_buys[["Name", "Currency"]].drop_duplicates().reset_index(drop=True)

# A list of currently held tickers
tickers_current = getDayPortfolio(df_buys, df_sells)["Name"].explode().unique() 

########################
#  Get Overall Market  #
########################
df_spy = web.DataReader("SPY", 'yahoo', minDate, pd.to_datetime("today")).reset_index()
df_spy = df_spy[["Date", "Adj Close"]]

df_ftse = web.DataReader("VUKE.L", 'yahoo', minDate, pd.to_datetime("today")).reset_index()
df_ftse = df_ftse[["Date", "Adj Close"]]

df_markets = pd.merge(df_spy, df_ftse, on="Date", how="outer", sort=True)
df_markets = df_markets.rename(columns={"Adj Close_x": "spy", "Adj Close_y": "ftse"})
df_markets = df_markets.fillna(0)

########################
#  Get exchange rates  #
########################
print("Getting exchange rates...")

# Get any necessary exchange rates
df_exchange_USDGBP = web.DataReader("GBPUSD=X", 'yahoo', minDate, pd.to_datetime("today"))
df_exchange_USDGBP.drop(columns=["High", "Low", "Open", "Volume", "Adj Close"], inplace=True)
df_exchange_USDGBP = df_exchange_USDGBP.reset_index()

# Get the first and last date
currentDate_fx = minDate
lastDate_fx = pd.to_datetime("today")
lastDate_fx = lastDate_fx.replace(hour=0, minute=0, second=0, microsecond=0)

# Iterate through each day
while currentDate_fx != lastDate_fx:
    dayCounter_fx = 1

    # If the current day doesn't have an exchnage rate entry
    while len(df_exchange_USDGBP.loc[df_exchange_USDGBP["Date"] == currentDate_fx]) == 0:

        # Get the previous days entry
        prevDate_fx = currentDate_fx - timedelta(days=dayCounter_fx)
        df_previousFx = df_exchange_USDGBP.loc[df_exchange_USDGBP["Date"] == prevDate_fx]
        df_previousFx["Date"] = currentDate_fx

        # Add this entry to the exchange rate df
        df_exchange_USDGBP = df_exchange_USDGBP.append(df_previousFx, ignore_index=True)
        dayCounter_fx = dayCounter_fx + 1

    currentDate_fx = currentDate_fx + timedelta(days=1)

# Rename the Close column to avoid confusion in the next cell...
df_exchange_USDGBP = df_exchange_USDGBP.rename(columns={"Close": "Rate"})

######################
#  Get closing data  #
######################
print("Getting closing data...")

df_closing_all = []

for ticker in tickers_all:

    df_closing_ticker = []

    # Get the first transaction date for the ticker
    date_first = pd.to_datetime("today")
    date_first = df_buys.loc[df_buys["Name"] == ticker]["Date"].min()

    # Get the last transaction date for the ticker, or the current date if it's still being held
    date_last = pd.to_datetime("today")
    if ticker not in tickers_current:
        date_last = df_sells.loc[df_sells["Name"] == ticker]["Date"].max()

    # Get the close prices for each day
    df_closing_ticker = web.DataReader(ticker, 'yahoo', date_first, date_last)    

    # If there are gaps in the dates, this will be dealt with later. However, we need to make sure we have a value on or before
    #  the 'first' date in order to do this. Keep trying the previous days until we get a value
    while date_first != df_closing_ticker.index.min():
        date_first = date_first - timedelta(days=1)
        df_closing_ticker = web.DataReader(ticker, 'yahoo', date_first, date_last)    

    # Format the df
    df_closing_ticker.drop(columns=["High", "Low", "Open", "Volume", "Adj Close"], errors="ignore", inplace=True)
    df_closing_ticker["Name"] = ticker

    # Get the currency for the current ticker
    tickerCurrency = tickers_currency.loc[tickers_currency["Name"] == ticker, "Currency"].values[0]

    # If it's USD, divide by the exchange rate for the relevant day
    if tickerCurrency == "USD":
        df_closing_ticker = pd.merge(df_closing_ticker, df_exchange_USDGBP, how="left", on="Date")
        df_closing_ticker["Close"] = df_closing_ticker["Close"]/df_closing_ticker["Rate"]
        df_closing_ticker.drop(columns=["Rate"], inplace=True)

    # If it's GBp, divide by 100 to convert to £
    elif tickerCurrency == "GBP":
        df_closing_ticker["Close"] = df_closing_ticker["Close"]/100
    else:
        print("ERROR: Unidentified Currency - ", ticker)
    
    df_closing_all.append(df_closing_ticker.reset_index())

# Concatenate all data
df_closing_all = pd.concat(df_closing_all)
df_closing_all.drop(columns=["index"], inplace=True)


df_closing_all.to_csv('./closingPrices.csv', index=False)
df_exchange_USDGBP.to_csv('./USDGBP_exchange.csv', index=False)
df_markets.to_csv('./markets.csv', index=False)
