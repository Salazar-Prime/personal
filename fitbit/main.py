"""
This file shows the data from fitbit in a 
console created by plotly.
"""

# USER PARAMETERS
import pandas as pd
import requests, json
from datetime import date, datetime, timedelta
import os, requests

# USER IMPORTS
from utils import saveToken, getHealthStat, getCurrentHealthStatLog

# USER PARAMETERS
tokenJSONPath = "tokens.json"
saveHealthLogs = "logs"
apiURL = "https://api.fitbit.com/"
stats = ["heartrate","sleep"]
stats = ["heartrate"]

# read the tokens
with open(tokenJSONPath, "r") as f:
    tokens = json.load(f)

endDate = datetime.today()

for stat in stats:
    # Default start date is 10 days ago (0)
    df, startDate, interval = getCurrentHealthStatLog(stat, saveHealthLogs)

    # get date range length
    print(f"Fetching data for {interval} days. Starting from {startDate}.")

    # loop through the interval
    for i in range(interval):
        # get the date for which data is to be fetched
        curDate = startDate + timedelta(days=i)
        curDate = curDate.strftime("%Y-%m-%d")

        # get health stats
        responseJSON, tokens = getHealthStat(stat, apiURL, curDate, tokens)
        saveToken(tokens, tokenJSONPath)

        # get the json data
        dfTemp = pd.DataFrame(responseJSON["activities-heart-intraday"]["dataset"])
        if not dfTemp.empty:
            dfTemp["time"] = pd.to_datetime(curDate + " " + dfTemp["time"])
            # append the data concatenated
            df = pd.concat([df, dfTemp], axis=0)

    # save the data
    df.to_csv(os.path.join(saveHealthLogs,f"{stat}.csv"), index=False)
