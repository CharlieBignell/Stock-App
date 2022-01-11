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

print(df_basic.head)
print(df_other.head)
print(df_dividend.head)