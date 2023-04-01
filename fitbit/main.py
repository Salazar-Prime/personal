"""
This file shows the data from fitbit in a 
console created by plotly.
"""

# USER PARAMETERS
import pandas as pd
import requests, json
from datetime import date, datetime, timedelta
import os

# USER IMPORTS
from utils import saveToken, getHealthStat

tokenJSON = "tokens.json"
saveHealthLogs = "data.csv"
apiURL = "https://api.fitbit.com/1/user/"

# read the tokens
with open(tokenJSON, "r") as f:
    tokens = json.load(f)

# get the tokens
clientID = tokens["Client ID"]
clientSecret = tokens["Client Secret"]
authorizationCode = tokens["Authorization Token"]
accessToken = tokens["Access Token"]
refreshToken = tokens["Refresh Token"]
scope = tokens["Scopes"]
scope = scope.split(" ")

# create a GET request
import requests

# default interval is 10 days
interval = 10
# Default start date is 10 days ago
endDate = datetime.today()
startDate = endDate - timedelta(days=interval)

# read the saved data if it exists
if os.path.exists(saveHealthLogs):
    df = pd.read_csv(saveHealthLogs)
    # set the time column as datetime
    df["time"] = pd.to_datetime(df["time"])
    # get last log date and remove it
    lastDate = df["time"].iloc[-1]
    lastDate = lastDate.date()
    df = df[df["time"].dt.date != lastDate]
    # set the new start date and interval
    startDate = lastDate
    interval = (endDate.date() - startDate).days
    print("LOGGING: Last Log Date - ", lastDate)
else:
    df = pd.DataFrame()
    # subtract date only
    interval = (endDate.date() - startDate.date()).days


# get date range length
print("LOGGING: Start Date - ", startDate)
print("LOGGING: End Date - ", endDate.date())
print("LOGGING: Interval Length - ", interval)

# loop through the interval
for i in range(interval + 1):
    # get the date for which data is to be fetched
    curDate = startDate + timedelta(days=i)
    curDate = curDate.strftime("%Y-%m-%d")

    # get health stats
    responseJSON, tokens = getHealthStat("heartrate", apiURL, curDate, scope, tokens)
    saveToken(tokens, "new", "tokens.json")

    # get the json data
    dfTemp = pd.DataFrame(responseJSON["activities-heart-intraday"]["dataset"])
    if not dfTemp.empty:
        dfTemp["time"] = pd.to_datetime(curDate + " " + dfTemp["time"])
        # append the data concatenated
        df = pd.concat([df, dfTemp], axis=0)

# save the data
df.to_csv(saveHealthLogs, index=False)
