#!/bin/bash

host="$1"
shift
cmd="$@"

until (echo > /dev/tcp/$host/5432) &> /dev/null; do
  echo "Postgres is unavailable"
  sleep 1
done

echo "Postgres is up"
exec $cmd 