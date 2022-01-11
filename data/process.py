import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt

from pandas_datareader import data as web 
from datetime import timedelta

pd.options.mode.chained_assignment = None 

# Get the data
df_basic = pd.read_csv('./basic.csv')
df_other = pd.read_csv('./other.csv')
df_dividend = pd.read_csv('./dividend.csv')

# Populate the stocks table


# Populate the daily table


# Populate the stocks-daily table


# Export all data
# df_stocks.to_csv('./stocks.csv', index=False)
# df_daily.to_csv('./daily.csv', index=False)
# df_daily-stocks.to_csv('./stocks-daily.csv', index=False)
