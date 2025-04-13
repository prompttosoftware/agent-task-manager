#!/bin/bash

# Script to perform manual API endpoint testing for Issue Controller API endpoints using curl

# Read environment variables
ATM_BASE_URL="${ATM_BASE_URL:?Error: ATM_BASE_URL is not set}"
ATM_EMAIL="${ATM_EMAIL:?Error: ATM_EMAIL is not set}"
ATM_API_TOKEN="${ATM_API_TOKEN:?Error: ATM_API_TOKEN is not set}"
ATM_ISSUE_KEY="${ATM_ISSUE_KEY:?Error: ATM_ISSUE_KEY is not set}"
ATM_FROM_ISSUE_KEY="${ATM_FROM_ISSUE_KEY:?Error: ATM_FROM_ISSUE_KEY is not set}"
ATM_ASSIGNEE_KEY="${ATM_ASSIGNEE_KEY:?Error: ATM_ASSIGNEE_KEY is not set}"

# Authentication header
AUTH_HEADER="Authorization: Bearer $ATM_API_TOKEN"

# Function to make API requests and check the status code
test_api_endpoint() {
  local method="$1"
  local endpoint="$2"
  local data="$3"
  local expected_status="$4"
  local description="$5"

  echo "--------------------------------------------------"
  echo "Testing: $description"
  echo "$method $ATM_BASE_URL$endpoint"
  if [ -n "$data" ]; then
    echo "Data: $data"
  fi

  local curl_command="curl -s -X $method -H \"$AUTH_HEADER\" -H \"Content-Type: application/json\""
  if [ -n "$data" ]; then
    curl_command="$curl_command -d '$data'"
  fi
  curl_command="$curl_command \"$ATM_BASE_URL$endpoint\""

  response=$($curl_command)
  status_code=$(echo "$response" | jq -r '.status // empty' | grep -oP '^[0-9]{3}' || echo "N/A") # Extract HTTP status code

  echo "Response: $response"
  echo "Status Code: $status_code"

  if [ "$status_code" == "$expected_status" ]; then
    echo "Result: \e[32mPASSED\e[0m"  # Green
  else
    echo "Result: \e[31mFAILED\e[0m (Expected: $expected_status)\e[0m" # Red
  fi
  echo "--------------------------------------------------"
  echo ""
}

# 1. GET /api/issues/{issueKey}
test_api_endpoint "GET" "/api/issues/$ATM_ISSUE_KEY" "" "200" "Get Issue by Key"

# 2. POST /api/issues (create issue)
new_issue_data='{
  "title": "Test Issue",
  "description": "This is a test issue created via API.",
  "boardId": "1",
  "type": "Task",
  "priority": "Medium"
}'
test_api_endpoint "POST" "/api/issues" "$new_issue_data" "201" "Create Issue"

# 3. PUT /api/issues/{issueKey}/assignee (assign issue)
assign_data='{
  "assigneeKey": "$ATM_ASSIGNEE_KEY"
}'
test_api_endpoint "PUT" "/api/issues/$ATM_ISSUE_KEY/assignee" "$assign_data" "200" "Assign Issue"

# 4. POST /api/issues/{issueKey}/transitions (transition issue)
transition_data='{
  "transitionId": "1"
}'
test_api_endpoint "POST" "/api/issues/$ATM_ISSUE_KEY/transitions" "$transition_data" "200" "Transition Issue"

echo "API testing completed."
