#!/bin/bash

# Script to perform manual API endpoint testing for Jira Issue API endpoints using curl

# --- Configuration ---
BASE_URL="YOUR_JIRA_BASE_URL"  # Replace with your Jira base URL (e.g., "https://your-jira-instance.atlassian.net")
EMAIL="YOUR_JIRA_EMAIL"         # Replace with your Jira email address
API_TOKEN="YOUR_JIRA_API_TOKEN"   # Replace with your Jira API token
ISSUE_KEY="YOUR_JIRA_ISSUE_KEY"   # Replace with the issue key you want to test (e.g., "PROJECT-123")

# --- Authentication ---
AUTH_HEADER="Authorization: Basic $(echo -n \"$EMAIL:$API_TOKEN\" | base64)"


# --- Helper function to execute curl and print results ---
execute_curl() {
  local description="$1"
  local curl_command="$2"
  local expected_status="$3"  # Expected HTTP status code (e.g., 200, 204)

  echo "------------------------------------------------------------------"
  echo "Testing: $description"
  echo "Command: $curl_command"
  echo "------------------------------------------------------------------"

  local response=$(eval "$curl_command")
  local status_code=$(echo "$response" | head -n 1 | awk '{print $2}') # Extract the status code

  echo "Response:"
  echo "$response"
  echo "------------------------------------------------------------------"

  if [ "$status_code" == "$expected_status" ]; then
    echo "Status: \033[32mSUCCESS\033[0m (Status Code: $status_code)"  # Green for success
  else
    echo "Status: \033[31mFAILURE\033[0m (Status Code: $status_code, Expected: $expected_status)" # Red for failure
  fi
  echo ""
}


# --- 1. Test GET /rest/api/2/issue/{issueKey} ---
DESCRIPTION="Get Issue Details"
CURL_COMMAND="curl -s -H 'Content-Type: application/json' -H '$AUTH_HEADER' '$BASE_URL/rest/api/2/issue/$ISSUE_KEY'"
EXPECTED_STATUS="200"
execute_curl "$DESCRIPTION" "$CURL_COMMAND" "$EXPECTED_STATUS"


# --- 2. Test POST /rest/api/2/issue/{issueKey}/transitions (Transition Issue) ---
DESCRIPTION="Transition Issue (e.g., Start Progress)"
TRANSITION_ID="2" # Replace with a valid transition ID for your workflow
REQUEST_BODY='{"transition": {"id": "'"$TRANSITION_ID"'"}}'
CURL_COMMAND="curl -s -X POST -H 'Content-Type: application/json' -H '$AUTH_HEADER' -d '$REQUEST_BODY' '$BASE_URL/rest/api/2/issue/$ISSUE_KEY/transitions'"
EXPECTED_STATUS="204" # Transition often returns 204 No Content on success
execute_curl "$DESCRIPTION" "$CURL_COMMAND" "$EXPECTED_STATUS"


# --- 3. Test PUT /rest/api/2/issue/{issueKey} (Update Issue) ---
DESCRIPTION="Update Issue (e.g., Change Description)"
NEW_DESCRIPTION="Updated description via API test script."
REQUEST_BODY='{"fields": {"description": "'"$NEW_DESCRIPTION"'"}}'
CURL_COMMAND="curl -s -X PUT -H 'Content-Type: application/json' -H '$AUTH_HEADER' -d '$REQUEST_BODY' '$BASE_URL/rest/api/2/issue/$ISSUE_KEY'"
EXPECTED_STATUS="204"
execute_curl "$DESCRIPTION" "$CURL_COMMAND" "$EXPECTED_STATUS"


# --- 4. Test DELETE /rest/api/2/issue/{issueKey} (Delete Issue) ---
#  WARNING: This will DELETE the issue.  Only enable if you are certain it's safe to do so.
#  Uncomment the following section to test DELETE.
#
#  IMPORTANT: Ensure your Jira instance allows issue deletion, and you are testing against
#  a disposable issue in a test environment.

#DESCRIPTION="Delete Issue (WARNING: Deletes the issue!)"
#CURL_COMMAND="curl -s -X DELETE -H '$AUTH_HEADER' '$BASE_URL/rest/api/2/issue/$ISSUE_KEY'"
#EXPECTED_STATUS="204"
#execute_curl "$DESCRIPTION" "$CURL_COMMAND" "$EXPECTED_STATUS"

echo "Testing complete."