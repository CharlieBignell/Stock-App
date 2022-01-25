import pandas as pd
import yfinance as yf

from datetime import timedelta

# Get a valid pandas date
def getDateFormat(day, month, year):
    return pd.to_datetime(f"{year}-{month}-{day}")


# Get the number of shares held on a given day, taking splits into account
def getShares(df, ticker, date):
    
    # Get splits
    splits = yf.Ticker(ticker).splits
    df_split = pd.DataFrame({'date':splits.index, 'split':splits.values})

    # Merge with raw sharecounts
    df_combined =  pd.merge(df.loc[df["ticker"] == ticker, ["date", "shareCount"]], df_split, on="date", how="outer")

    # Limit to relevant 
    minDate_ticker = df.loc[df["ticker"] == ticker, "date"].min()
    df_combined.drop(df_combined.loc[(df_combined["date"] < minDate_ticker) & (df_combined["date"] > date)].index, inplace=True)

    # Format the split column
    df_combined.sort_values(by="date", ascending=False, inplace=True)
    df_combined["split"] = df_combined["split"].fillna(0).cumsum()
    df_combined.loc[df_combined["split"] == 0, "split"] = 1
    df_combined.sort_values(by="date", inplace=True)

    # Drop the split rows i.e. rows that aren't a buy/sell
    df_combined.dropna(inplace=True)

    # Recalculate sharecount
    df_combined["shareCount"] = df_combined["shareCount"]*df_combined["split"]

    return df_combined["shareCount"].sum()


# Get the shares held on a given day
def getDayPortfolio(df_buys, df_sells, day = pd.to_datetime("today") - timedelta(days=1)):

    # Get the buys and sells for each day before the given date
    df_buysInRange = df_buys.loc[df_buys["date"] <= day, ["date", "ticker", "shareCount"]]
    df_sellsInRange = df_sells.loc[df_sells["date"] <= day, ["date", "ticker", "shareCount"]]

    # Any missing sells, i.e. any stock we've bought but not sold any of, need to still be in the resulting 'sell' df
    df_emptySells = df_buysInRange.copy()
    df_emptySells["shareCount"] = 0
    df_sellsInRange = pd.concat([df_sellsInRange, df_emptySells])

    # Aggregate to get total shares in and out
    sharesIn = df_buysInRange.groupby('ticker').agg({'shareCount': 'sum'})['shareCount'].reset_index()
    sharesOut = df_sellsInRange.groupby('ticker').agg({'shareCount': 'sum'})['shareCount'].reset_index()

    # Format the aggregations
    sharesIn.rename(columns={"shareCount": "sharesIn"}, inplace=True)
    sharesOut.rename(columns={"shareCount": "sharesOut"}, inplace=True)
    sharesOut.drop(columns="ticker", inplace=True)

    # Calculate net shares
    sharesTotal = pd.concat([sharesIn, sharesOut], axis=1)
    sharesTotal["shareCount"] = (sharesTotal["sharesIn"] - sharesTotal["sharesOut"]).round(5)

    # Format the portfolio
    portfolio = sharesTotal.loc[sharesTotal["shareCount"] != 0]
    portfolio = portfolio.drop(columns=["sharesIn", "sharesOut"])

    return portfolio