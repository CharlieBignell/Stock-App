import pandas as pd
from datetime import timedelta

# Get a valid pandas date
def getDateFormat(day, month, year):
    return pd.to_datetime(f"{year}-{month}-{day}")

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