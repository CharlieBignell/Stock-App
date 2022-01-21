import yahoo_fin.stock_info as si
import yahoo_fin.news as ne

# for ticker in tickers_all:
#     print()
#     print(ticker)
#     try:
#         quote = si.get_analysts_info(ticker)
#         print(quote)
#     except KeyError:
#         "Error"

print(si.get_analysts_info("AAPL"))