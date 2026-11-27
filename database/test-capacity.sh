
#!/bin/bash

BASE_URL="http://localhost:3000"
PATIENT_ID=1
DOCTOR_ID=3
DATE="2026-12-15"

for HOUR in 09 09 10 10 11 11 12 12 13 13 14 14 15
do
  :
done

TIMES=(
  "09:00"
  "09:30"
  "10:00"
  "10:30"
  "11:00"
  "11:30"
  "12:00"
  "12:30"
  "13:00"
  "13:30"
  "14:00"
  "14:30"
  "15:00"
)

for TIME in "${TIMES[@]}"
do
  echo "Testing appointment at $TIME"

  curl -s -w "\nHTTP Status: %{http_code}\n" \
    -X POST "$BASE_URL/api/appointments" \
    -H "Content-Type: application/json" \
    -d "{
      \"patient_id\": $PATIENT_ID,
      \"doctor_id\": $DOCTOR_ID,
      \"appointment_datetime\": \"${DATE}T${TIME}:00+02:00\",
      \"amount_paid\": 200
    }"

  echo "---------------------------"
done
