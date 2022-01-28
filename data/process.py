import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt

from pandas_datareader import data as web 
from datetime import timedelta
from utils import getDateFormat, getDayPortfolio, getShares

pd.options.mode.chained_assignment = None 

# Get the data
df_basic = pd.read_csv('./inputs/basic.csv')
df_other = pd.read_csv('./inputs/other.csv')
df_dividend = pd.read_csv('./inputs/dividend.csv')

df_closing_all = pd.read_csv('./closingPrices.csv')
df_markets = pd.read_csv('./markets.csv')
df_tickerInfo = pd.read_csv('./tickerInfo.csv')

# Format date fields
df_basic['date'] = pd.to_datetime(df_basic['date'])
df_other['date'] = pd.to_datetime(df_other['date'])
df_dividend['date'] = pd.to_datetime(df_dividend['date'])
df_closing_all['date'] = pd.to_datetime(df_closing_all['date'])
df_markets['date'] = pd.to_datetime(df_markets['date'])

# Get the earliest transaction date
minDate = min(df_basic["date"].min(), df_other["date"].min())

today = pd.to_datetime("today").replace(hour=0, minute=0, second=0, microsecond=0)
yesterday = (pd.to_datetime("today") - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

# A list of all the tickers
tickers_all = df_basic['ticker'].unique()

# Split buys and sells into separate dataframes
df_buys = df_basic.loc[df_basic["type"] == "BUY"]
df_sells = df_basic.loc[df_basic["type"] == "SELL"]

# A list of all tickers with their currency
tickers_currency = df_buys[["ticker", "currency"]].drop_duplicates().reset_index(drop=True)

# A list of currently held tickers
tickers_current = getDayPortfolio(df_buys, df_sells)["ticker"].explode().unique()

############################
#  Calculate daily values  #
############################

daily_dates = []
daily_values = []

daily_stocks = []

currentDate = minDate

# Move day-by-day from the first date to now
while currentDate != today:
    
    # Get the portfolio of holdings for this date
    df_portfolio = getDayPortfolio(df_buys, df_sells, currentDate)

    # Get the closing prices for this day
    df_relevantClosing = df_closing_all.loc[df_closing_all["date"] == currentDate]

    # Get all tickers for this day
    tickers = df_portfolio["ticker"].values.tolist()

    # Merge these together, and calculate the value of each stock    
    df_portfolio = pd.merge(df_portfolio, df_relevantClosing, on="ticker")
    df_portfolio["value"] = df_portfolio["shareCount"] * df_portfolio["close"]
    
    daily_dates.append(currentDate)
    daily_values.append(df_portfolio["value"].sum())

    # Get daily by ticker i.e. a list of ticker/day combos so dates appear multiple times as opposed to the above, 
    # which is daily portfolio where each line is a unique date
    daily_stocks.append(df_portfolio[["date", "ticker", "close", "value"]])

    currentDate = currentDate + timedelta(days=1)
        
# Create daily and daily_tickers
df_daily = pd.DataFrame(list(zip(daily_dates, daily_values)),columns =['date', 'value'])
df_daily_stocks = pd.concat(daily_stocks)

###########################
#  Get Cumulative Return  #
###########################

# Get the necessary buy and sell columns
df_cumBuys = df_buys[["date", "value"]]
df_cumSells = df_sells[["date", "value"]]

# Group by day
df_cumBuys = df_cumBuys.groupby(["date"]).sum()
df_cumSells = df_cumSells.groupby(["date"]).sum()

# Merge into a single df
df_cumAll = pd.merge(df_cumBuys, df_cumSells, on="date", how="outer")
df_cumAll.reset_index(inplace=True)
df_cumAll = df_cumAll.rename(columns={"value_x": "amount_bought", "value_y": "amount_sold"})

# Merge with daily
df_daily = pd.merge(df_daily, df_cumAll, on="date", how="left", sort=True)
df_daily[["amount_bought", "amount_sold"]] = df_daily[["amount_bought", "amount_sold"]]*-1
df_daily[["amount_bought", "amount_sold"]] = df_daily[["amount_bought", "amount_sold"]].fillna(0)

# Calculate cumulative buys and sells
df_daily["cumBuys"] = df_daily["amount_bought"].cumsum()
df_daily["cumSells"] = df_daily["amount_sold"].cumsum()
df_daily["amount_ITM"] = df_daily["cumBuys"] + df_daily["cumSells"]

# Calculate return
df_daily["amount_return_cum"] = df_daily["value"] - df_daily["amount_ITM"]
df_daily["percent_return_cum"] = (df_daily["amount_return_cum"]*100)/df_daily["amount_ITM"]

df_daily.drop(columns=["cumBuys", "cumSells"], inplace=True)

##################
#  Get deposits  #
##################

# Get the deposit rows
df_deposits = df_other.loc[df_other["type"] == "Deposit"][["value", "date"]]

# Merge with daily
df_daily = pd.merge(df_daily, df_deposits, on="date", how="outer", sort=True)
df_daily = df_daily.rename(columns={"value_x": "value", "value_y": "amount_deposited"})

######################
#  Get Daily Return  #
######################

df_daily["amount_return_day"] = df_daily["amount_return_cum"] - df_daily["amount_return_cum"].shift(1)
df_daily["percent_return_day"] = df_daily["percent_return_cum"] - df_daily["percent_return_cum"].shift(1)

####################################
#  Get Other Income and Outgoings  #
####################################

df_income = df_other.loc[(df_other["value"] > 0) & (df_other["type"] != "Deposit")][["value", "date"]]
df_outgoings = df_other.loc[(df_other["value"] < 0) & (df_other["type"] != "Deposit")][["value", "date"]]

df_daily = pd.merge(df_daily, df_outgoings, on="date", how="outer", sort=True)
df_daily = pd.merge(df_daily, df_income, on="date", how="outer", sort=True)

df_daily = df_daily.rename(columns={"value_x": "value", "value_y": "ind_out", "value": "ind_in"})

# Add market returns
df_daily = pd.merge(df_daily, df_markets, on="date", how="outer", sort=True)

# Format df
df_daily = df_daily.fillna(0).round(2)

# Add ID column
df_daily["dayID"] = df_daily['date'].dt.strftime("%Y%m%d").astype(str).str.replace("-","")
df_daily = df_daily[ ['dayID'] + [ col for col in df_daily.columns if col != 'dayID' ] ]

########################
#  Get Ticker Summary  #
########################

sum_trades = []
amount_bought = []
quant_bought = []
amount_sold = []
quant_sold = []
quant_current = []
value_current = []

for t in tickers_all:

    # Sum the buys and sells (not subtract, as buys are negative)
    sum_trades.append(len(df_buys.loc[df_buys["ticker"] == t]) + len(df_sells.loc[df_sells["ticker"] == t]))

    # Sum the # bought and sold
    quant_bought.append(df_buys.loc[df_buys["ticker"] == t, "shareCount"].sum().round(3))
    quant_sold.append(df_sells.loc[df_sells["ticker"] == t, "shareCount"].sum().round(3))

    # Sum the £ bought and sold
    amount_bought.append(df_buys.loc[df_buys["ticker"] == t, "value"].sum()*-1)
    amount_sold.append(df_sells.loc[df_sells["ticker"] == t, "value"].sum())
    
    # Work out how many shares we're currently holding
    holding = getShares(df_basic, t, today)

    # Work out the value of what we're currently holding
    close = df_closing_all.loc[df_closing_all["ticker"] == t]
    quant_current.append(holding)
    value_current.append(close.loc[close['date'].idxmax()]["close"]*holding)

# Combine all these lists into a single dataframe
df_stocks = pd.DataFrame({
    'ticker': tickers_all, 
    'quantity_bought': quant_bought, 
    'quantity_sold': quant_sold, 
    "amount_bought": amount_bought,
    "amount_sold": amount_sold,
    "shareCount": quant_current,
    "value": value_current
})

# Append dividends
df_tickerDiv = df_dividend.groupby(by="ticker").sum()
df_stocks = pd.merge(df_stocks, df_tickerDiv, on="ticker", how="outer", sort=True)
df_stocks.rename(columns={"value_x": "value", "value_y": "dividend"}, inplace=True)

# Add return
df_stocks = df_stocks.fillna(0)
df_stocks["amount_return"] = df_stocks["value"] + df_stocks["amount_sold"] + df_stocks["dividend"] - df_stocks["amount_bought"]
df_stocks["percent_return"] = ((((df_stocks["amount_return"] + df_stocks["amount_bought"]))/df_stocks["amount_bought"])-1)*100

# Add 'share of portfolio'
totalValue = df_stocks["value"].sum()
df_stocks["share"] = (df_stocks["value"]/totalValue)*100

# Append stock fundamentals
df_stocks = pd.merge(df_stocks, df_tickerInfo, on="ticker", how="outer", sort=True)

# Add ID columns
df_stocks = df_stocks.sort_values(by="ticker", ignore_index=True)
df_stocks = df_stocks.reset_index()
df_stocks.rename(columns={"index": "stockID"}, inplace=True)

# Format df
df_stocks = df_stocks.fillna(0).round(2)

##############################
#  Complete Daily Stocks df  #
##############################

# Add share column and format daily_tickers
df_daily_stocks = pd.merge(df_daily_stocks, df_daily[["date", "value"]], on="date")
df_daily_stocks["share"] = df_daily_stocks["value_x"]/df_daily_stocks["value_y"]*100
df_daily_stocks.drop(columns=["value_y"], inplace=True)
df_daily_stocks.rename(columns={"value_x": "value"}, inplace=True)

# Add ID column
df_daily_stocks["dayID"] = df_daily['date'].dt.strftime("%Y%m%d").astype(str).str.replace("-","")
df_daily_stocks = pd.merge(df_daily_stocks, df_stocks[["stockID", "ticker"]], on="ticker")
df_daily_stocks["day_stockID"] = df_daily_stocks["dayID"].astype(str) + df_daily_stocks["stockID"].astype(str)
df_daily_stocks.drop(columns=["stockID", "dayID"], inplace=True)

# Format df
df_daily_stocks = df_daily_stocks.sort_values(by="date", ignore_index=True)
df_daily_stocks = df_daily_stocks[ ['day_stockID'] + [ col for col in df_daily_stocks.columns if col != 'day_stockID' ] ]
df_daily_stocks = df_daily_stocks.reset_index().fillna(0).round(2)


# Export 
df_daily.to_csv('./outputs/daily.csv', index=False)
df_stocks.to_csv('./outputs/stocks.csv', index=False)
df_daily_stocks.to_csv('./outputs/daily_stocks.csv', index=False)