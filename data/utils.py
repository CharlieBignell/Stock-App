import pandas as pd

# Get a valid pandas date
def getDateFormat(day, month, year):
    return pd.to_datetime(f"{year}-{month}-{day}")

# Get the shares held on a given day
def getDayPortfolio(df_basic, day = pd.to_datetime("today")):
    
    df_buys = df_basic.loc[df_basic["Type"] == "BUY"]
    df_sells = df_basic.loc[df_basic["Type"] == "SELL"]

    # Get the buys and sells for each day before the given date
    df_buysInRange = df_buys.loc[df_basic["Date"] <= day, ["Date", "Name", "ShareCount"]]
    df_sellsInRange = df_sells.loc[df_basic["Date"] <= day, ["Date", "Name", "ShareCount"]]

    # Any missing sells, i.e. any stock we've bought but not sold any of, need to still be in the resulting 'sell' df
    df_emptySells = df_buysInRange.copy()
    df_emptySells["ShareCount"] = 0
    df_sellsInRange = pd.concat([df_sellsInRange, df_emptySells])

    # Aggregate to get total shares in and out
    sharesIn = df_buysInRange.groupby('Name').agg({'ShareCount': 'sum'})['ShareCount'].reset_index()
    sharesOut = df_sellsInRange.groupby('Name').agg({'ShareCount': 'sum'})['ShareCount'].reset_index()

    # Format the aggregations
    sharesIn.rename(columns={"ShareCount": "SharesIn"}, inplace=True)
    sharesOut.rename(columns={"ShareCount": "SharesOut"}, inplace=True)
    sharesOut.drop(columns="Name", inplace=True)

    # Calculate net shares
    sharesTotal = pd.concat([sharesIn, sharesOut], axis=1)
    sharesTotal["ShareCount"] = (sharesTotal["SharesIn"] - sharesTotal["SharesOut"]).round(5)

    # Format the portfolio
    portfolio = sharesTotal.loc[sharesTotal["ShareCount"] != 0]
    portfolio = portfolio.drop(columns=["SharesIn", "SharesOut"])

    return portfolio