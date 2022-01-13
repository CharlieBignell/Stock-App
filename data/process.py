import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt

from pandas_datareader import data as web 
from datetime import timedelta
from utils import getDateFormat, getDayPortfolio

pd.options.mode.chained_assignment = None 

# Get the data
print("Reading data...")
df_basic = pd.read_csv('./basic.csv')
df_other = pd.read_csv('./other.csv')
df_dividend = pd.read_csv('./dividend.csv')

# Format date fields
df_basic['Date'] = pd.to_datetime(df_basic['Date'])
df_other['Date'] = pd.to_datetime(df_other['Date'])
df_dividend['Date'] = pd.to_datetime(df_dividend['Date'])

# Split buys and sells into separate dataframes
df_buys = df_basic.loc[df_basic["Type"] == "BUY"]
df_sells = df_basic.loc[df_basic["Type"] == "SELL"]

# Get the earliest transaction date
minDate = df_basic["Date"].min()

# A list of all the tickers
tickers_all = df_basic['Name'].unique()

# A list of all tickers with their currency
tickers_currency = df_buys[["Name", "Currency"]].drop_duplicates().reset_index(drop=True)

# A list of currently held tickers
tickers_current = getDayPortfolio(df_buys, df_sells)["Name"].explode().unique() 

##############################
#  Account for stock splits  #
##############################
print("Accounting for stock splits...")

allSplits = []

for ticker in tickers_all:

    # Get the split and convert to a df
    splits = yf.Ticker(ticker).splits

    df_split = []

    # If there was a split, append the df to allSplits
    if len(splits) > 0:
        df_split = pd.DataFrame({'Date':splits.index, 'Split':splits.values})
        df_split["Name"] = ticker
        allSplits.append(df_split[df_split["Date"] >= minDate])

allSplits = pd.concat(allSplits)

# Iterate through splits and alter share counts as necessary
for index, row in allSplits.iterrows():
    df_basic.loc[(df_basic["Name"] == row["Name"]) & (df_basic["Date"] < row["Date"]), ["ShareCount"]] = (df_basic['ShareCount'] * row["Split"]).round(6)

########################
#  Get exchange rates  #
########################
print("Getting exchange rates...")

# Get any necessary exchange rates
df_exchange_USDGBP = web.DataReader("GBPUSD=X", 'yahoo', df_buys["Date"].min(), pd.to_datetime("today"))
df_exchange_USDGBP.drop(columns=["High", "Low", "Open", "Volume", "Adj Close"], inplace=True)
df_exchange_USDGBP = df_exchange_USDGBP.reset_index()

# Get the first and last date
currentDate_fx = df_exchange_USDGBP["Date"].min()
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
print("Getting closing data data...")

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

##############################
#  Populate the daily table  #
##############################
print("Getting daily value...")

# Get daily portfolio value
dates = []
values = []

currentDate = df_buys["Date"].min()

endDate = pd.to_datetime("today")
endDate = endDate.replace(hour=0, minute=0, second=0, microsecond=0)

# Move day-by-day from the first date to now
while currentDate != endDate:

    # Get the portoflio of holdings for this date
    df_portfolio = getDayPortfolio(df_buys, df_sells, currentDate)

    # Get the closing prices for this day
    df_relevantClosing = df_closing_all.loc[df_closing_all["Date"] == currentDate]

    # Get all tickers for this day
    tickers = df_portfolio["Name"].values.tolist()

    # Loop through the tickers that we havent managed to extract closing data from, and keep checking the previous day 
    # until we get a value so we remove any gaps in the closing data
    for t in tickers:        
        dayCounter = 1
        while t not in df_relevantClosing.values:
            prevDay = currentDate - timedelta(days=dayCounter)
            df_previousClosing = df_closing_all.loc[(df_closing_all["Date"] == prevDay) & (df_closing_all["Name"] == t)]
            df_relevantClosing = df_relevantClosing.append(df_previousClosing, ignore_index=True)
            dayCounter = dayCounter + 1

    # Merge these together, and calculate the value of each stock    
    df_portfolio = pd.merge(df_portfolio, df_relevantClosing, on="Name")
    df_portfolio["Value"] = df_portfolio["ShareCount"] * df_portfolio["Close"]
    
    dates.append(currentDate)
    values.append(df_portfolio["Value"].sum())

    currentDate = currentDate + timedelta(days=1)
        
df_dailyValue = pd.DataFrame(list(zip(dates, values)),columns =['Date', 'Value'])
df_dailyValue = df_dailyValue[df_dailyValue["Value"] != 0]


# Export all data
# df_stocks.to_csv('./stocks_summary.csv', index=False)
# df_daily.to_csv('./daily_summary.csv', index=False)
# df_daily_stocks.to_csv('./daily_stocks.csv', index=False)
