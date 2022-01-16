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

df_exchange_USDGBP = pd.read_csv('./USDGBP_exchange.csv')
df_closing_all = pd.read_csv('./closingPrices.csv')

# Format date fields
df_basic['Date'] = pd.to_datetime(df_basic['Date'])
df_other['Date'] = pd.to_datetime(df_other['Date'])
df_dividend['Date'] = pd.to_datetime(df_dividend['Date'])
df_closing_all['Date'] = pd.to_datetime(df_closing_all['Date'])
df_exchange_USDGBP['Date'] = pd.to_datetime(df_exchange_USDGBP['Date'])

# Get the earliest transaction date
minDate = min(df_basic["Date"].min(), df_other["Date"].min())

# A list of all the tickers
tickers_all = df_basic['Name'].unique()



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

# Split buys and sells into separate dataframes
df_buys = df_basic.loc[df_basic["Type"] == "BUY"]
df_sells = df_basic.loc[df_basic["Type"] == "SELL"]

# A list of all tickers with their currency
tickers_currency = df_buys[["Name", "Currency"]].drop_duplicates().reset_index(drop=True)

# A list of currently held tickers
tickers_current = getDayPortfolio(df_buys, df_sells)["Name"].explode().unique() 

###########################
#  Calculate daily value  #
###########################
print("Getting daily value...")

# Get daily portfolio value
dates = []
values = []

currentDate = minDate

endDate = pd.to_datetime("today")
endDate = endDate.replace(hour=0, minute=0, second=0, microsecond=0)

# Move day-by-day from the first date to now
while currentDate != endDate:
    # Get the portfolio of holdings for this date
    df_portfolio = getDayPortfolio(df_buys, df_sells, currentDate)

    # Get the closing prices for this day
    df_relevantClosing = df_closing_all.loc[df_closing_all["Date"] == currentDate]

    # Get all tickers for this day
    tickers = df_portfolio["Name"].values.tolist()

    # Loop through the tickers that we haven't managed to extract closing data from, and keep checking the previous day 
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
        
df_daily = pd.DataFrame(list(zip(dates, values)),columns =['Date', 'Value'])
df_daily = df_daily[df_daily["Value"] != 0]


##################
#  Get deposits  #
##################
print("Adding deposit column...")

# Get the deposit rows
df_deposits = df_other.loc[df_other["Type"] == "Deposit"][["Value", "Date"]]

# Merge with daily
df_daily = pd.merge(df_daily, df_deposits, on="Date", how="outer", sort=True)
df_daily = df_daily.rename(columns={"Date": "date", "Value_x": "value", "Value_y": "amount_deposited"})
df_daily = df_daily.fillna(0)


################
#  Get return  #
#################
print("Adding return column...")

# Get the necessary buy and sell columns
df_cumBuys = df_buys[["Date", "Value"]]
df_cumSells = df_sells[["Date", "Value"]]

# Group by day
df_cumBuys = df_cumBuys.groupby(["Date"]).sum()
df_cumSells = df_cumSells.groupby(["Date"]).sum()

# Merge into a single df
df_cumAll = pd.merge(df_cumBuys, df_cumSells, on="Date", how="outer")
df_cumAll.reset_index(inplace=True)
df_cumAll = df_cumAll.rename(columns={"Date": "date", "Value_x": "amount_bought", "Value_y": "amount_sold"})

# Merge with daily
df_daily = pd.merge(df_daily, df_cumAll, on="date", how="left", sort=True)
df_daily[["amount_bought", "amount_sold"]] = df_daily[["amount_bought", "amount_sold"]]*-1
df_daily[["amount_bought", "amount_sold"]] = df_daily[["amount_bought", "amount_sold"]].fillna(0)

# Calculate cumulative buys and sells
df_daily["cumBuys"] = df_daily["amount_bought"].cumsum()
df_daily["cumSells"] = df_daily["amount_sold"].cumsum()
df_daily["cumNet"] = df_daily["cumBuys"] + df_daily["cumSells"]

# Calculate return
df_daily["amount_return_cum"] = df_daily["value"] - df_daily["cumNet"]
df_daily["percent_return_cum"] = (df_daily["amount_return_cum"]*100)/df_daily["cumNet"]

df_daily.drop(columns=["cumBuys", "cumSells"], inplace=True)

# Export all data
df_daily = df_daily.round(2)

# Day ID, amount_sold, volatility, return_spy, return_ftse, , , ind_income, ind_outgoings
# Day ID, date, value, amount_deposited, amount_sold, volatility, return_spy, return_ftse, return_total, return_cum, ind_income, ind_outgoings
df_daily.to_csv('./daily_summary.csv', index=False)

# df_stocks.to_csv('./stocks_summary.csv', index=False)
# df_daily_stocks.to_csv('./daily_stocks.csv', index=False)


# Generate company summary

sum_trades = []
amount_bought = []
quant_bought = []
amount_sold = []
quant_sold = []
quant_current = []
value_current = []

for t in tickers_all:

    # Sum the buys and sells (not subtract, as buys are negative)
    sum_trades.append(len(df_buys.loc[df_buys["Name"] == t]) + len(df_sells.loc[df_sells["Name"] == t]))

    # Sum the # bought and sold
    quant_bought.append(df_buys.loc[df_buys["Name"] == t, "ShareCount"].sum().round(3))
    quant_sold.append(df_sells.loc[df_sells["Name"] == t, "ShareCount"].sum().round(3))

    # Sum the £ bought and sold
    amount_bought.append(df_buys.loc[df_buys["Name"] == t, "Value"].sum()*-1)
    amount_sold.append(df_sells.loc[df_sells["Name"] == t, "Value"].sum())
    
    # Work out how many shares we're currently holding
    holding = df_buys.loc[df_buys["Name"] == t, "ShareCount"].sum().round(3) - df_sells.loc[df_sells["Name"] == t, "ShareCount"].sum().round(3)

    # Work out the value of what we're currently holding
    close = df_closing_all.loc[df_closing_all["Name"] == t]
    quant_current.append(holding)
    value_current.append(close.loc[close['Date'].idxmax()]["Close"]*holding)

# Combine all these lists into a single dataframe
df_tickerSum = pd.DataFrame({
    'Ticker': tickers_all, 
    'Vol': sum_trades, 
    '# Bought': quant_bought, 
    '# Sold': quant_sold, 
    "£ Spent": amount_bought,
    "£ Sold": amount_sold,
    "# Holding": quant_current,
    "Value": value_current
})

print("\n-- Overall Summary --")

# Generate monthly summary

# Get, format, and summarise the 'total' columns
df_monthSum_Totals = df_daily[["date", "amount_bought", "amount_sold"]]
df_monthSum_Totals["amount_sold"] = df_daily["amount_sold"]*-1
df_monthSum_Totals.set_index('date', inplace=True)
df_monthSum_Totals = df_monthSum_Totals.resample('MS').sum()

# Get and summarise the 'value' columns
df_monthSum_Values = df_daily[["date", "value"]]
df_monthSum_Values.set_index('date', inplace=True)
df_monthSum_Values = df_monthSum_Values.resample('MS').mean()

# Merge both summaries
df_monthSum = pd.merge(df_monthSum_Totals,df_monthSum_Values, on="date")

# Format the resulting dataframe
df_monthSum.rename(columns={"value": "Avg. Value"}, inplace=True)
df_monthSum.reset_index(inplace=True)
df_monthSum = df_monthSum.round(2)


firstDate = df_daily["date"].min().strftime('%d/%m/%Y')
lastDate =  df_daily["date"].max().strftime('%d/%m/%Y')
length_years = int(len(df_monthSum)/12)
length_months = len(df_monthSum)%12
print("You've been investing for {0} year(s) and {1} month(s), between {2} and {3}".format(length_years, length_months, firstDate, lastDate))

sum_trades = len(df_buys) + len(df_sells)
sum_buys = len(df_buys)
sum_sells = len(df_sells)
print("You made a total of {0} trades ({1} buys/{2} sells)".format(sum_trades, sum_buys, sum_sells))

sum_deposit = df_daily["amount_deposited"].astype(int).sum()
print("You invested a total of £{0}".format(sum_deposit))

mean_buy = (df_buys["Value"].mean()*-1).round(2)
print("Your mean investment was £{}".format(mean_buy))

current_value = df_daily.loc[df_daily['date'].idxmax()]["value"].round(2)
increase = (current_value - sum_deposit).round(2)
increase_per = ((increase/sum_deposit)*100).round(1)
print("Your current portfolio is worth £{0}, this is an increase of £{1} ({2}%)".format(current_value, increase, increase_per))

print("\n-- Monthly Summary --")

maxBuy_month = df_monthSum.loc[df_monthSum['amount_bought'].idxmax()]["date"]
maxBuy_amount = df_monthSum["amount_bought"].max().round(2)
print("You spent the most in {0} (£{1})".format(maxBuy_month, maxBuy_amount))

maxSell_month = df_monthSum.loc[df_monthSum['amount_sold'].idxmax()]["date"]
maxSell_amount = df_monthSum["amount_sold"].max().round(2)
print("You sold the most in {0} (£{1})".format(maxSell_month, maxSell_amount))

maxValue_month = df_monthSum.loc[df_monthSum['Avg. Value'].idxmax()]["date"]
maxValue_amount = df_monthSum["Avg. Value"].max().round(2)
print("Your highest-value month was {0} (£{1})\n".format(maxValue_month, maxValue_amount))

print(df_monthSum)

print("\n-- Ticker Summary --")
print(df_tickerSum)