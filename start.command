#!/usr/bin/env bash
cd "$(dirname "$0")/web" || exit 1

npm install

npm run dev
