import requests, json, os


def getHealthStat(stat, apiURL, curDate, scope, tokens):
    retries = 3
    for i in range(retries):
        # check if stat is in scope
        if stat not in scope:
            print(f"ERROR: {stat} not in scope.")
            break

        # get the url based on stat
        if stat == "heartrate":
            url = f"{apiURL}-/activities/heart/date/{curDate}/1d/1sec.json"

        # get the response
        response = getRequest(url, tokens["Access Token"])
        if response == 401:
            print("Access Token Expired. Refreshing...")
            # refresh the token
            refreshURL = "https://api.fitbit.com/oauth2/token"
            refreshData = {
                "grant_type": "refresh_token",
                "refresh_token": tokens["Refresh Token"],
            }
            refreshResponse = postRequest(
                refreshURL, refreshData, tokens["Authorization Token"]
            )
            if refreshResponse.status_code == 200:
                print("Access Token Refreshed")
                # create dictionary for access, refresh token and expiry time
                tokens = {
                    "Access Token": refreshResponse.json()["access_token"],
                    "Refresh Token": refreshResponse.json()["refresh_token"],
                    "Expiry Time": refreshResponse.json()["expires_in"],
                }
                print("Retrying... | Retry: " + str(i + 1))
        else:
            print(f"Fetching {stat} for {curDate}")
            return response.json(), tokens


def getRequest(url, accessToken):
    try:
        response = requests.get(url, headers={"Authorization": "Bearer " + accessToken})
        if response.status_code == 200:
            return response
        elif response.status_code == 401:
            return 401
        else:
            print("Error GET Request: " + str(response.status_code))
            response.raise_for_status()
    except requests.exceptions.HTTPError as error:
        print(error.response.status_code, error.response.text)


def saveToken(token, name, filepathJSON):
    # read exsiting json
    if os.path.exists(filepathJSON):
        with open(filepathJSON, "r") as f:
            # get the jsoin dictionary
            jsonDict = json.load(f)
    else:
        jsonDict = {}
    # loop through token dicitonary and check if it exsits in json already
    # if not then save it else update it
    for key, value in token.items():
        if key in jsonDict:
            jsonDict[key] = value
            print(f"{name} token updated.")
        else:
            jsonDict[key] = value
            print(f"New {name} token saved.")
    with open(filepathJSON, "w") as f:
        # save the json
        json.dump(jsonDict, f)


def postRequest(url, data, auth):
    try:
        response = requests.post(url, data=data, auth=auth)
        if response.status_code == 200:
            return response
        else:
            print("Error POST request: " + str(response.status_code))
            response.raise_for_status()
    except requests.exceptions.HTTPError as error:
        print(error.response.status_code, error.response.text)


# clientID = "23QVKD"
# clientSecret = "265b382908a525e51112f52b0acb485d"
# authorizationCode = "b59dfc4d509fa319b76748f465b86a03748fa6fd"
# accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyM1FWS0QiLCJzdWIiOiJCSFFNNFgiLCJpc3MiOiJGaXRiaXQiLCJ0eXAiOiJhY2Nlc3NfdG9rZW4iLCJzY29wZXMiOiJ3aHIgd251dCB3cHJvIHdzbGUgd2VjZyB3c29jIHdhY3Qgd294eSB3dGVtIHd3ZWkgd2NmIHdzZXQgd3JlcyB3bG9jIiwiZXhwIjoxNjgwMDkyNzc5LCJpYXQiOjE2ODAwNjM5Nzl9.HuTeszD6OrIr1mz3gFbAAjVc8kPPLUsmT3bSe4oxof0"
# refreshToken = "1bf760295f272c2fe45ed2d1ac5c6794c02fe748c96ea237cc2bd952ec58a70a"
# scopes = "location social weight oxygen_saturation sleep settings activity heartrate profile cardio_fitness respiratory_rate nutrition electrocardiogram temperature"

# # create ditionary of toeksnm
# tokens = {
#     "Client ID": clientID,
#     "Client Secret": clientSecret,
#     "Authorization Token": authorizationCode,
#     "Access Token": accessToken,
#     "Refresh Token": refreshToken,
#     "Scopes": scopes,
# }

# # save the tokens
# saveToken(tokens, "OG", "tokens.json")
