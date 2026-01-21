import sys
import json
import argparse
from email_fetcher import OutlookFetcher

def main():
    parser = argparse.ArgumentParser(description='Fetch latest email from Outlook')
    parser.add_argument('--client-id', required=True, help='OAuth Client ID')
    parser.add_argument('--refresh-token', required=True, help='OAuth Refresh Token')
    parser.add_argument('--email', required=True, help='User Email')

    try:
        args = parser.parse_args()
    except SystemExit:
        # Catch argument parsing errors and return JSON error
        print(json.dumps({"error": "Invalid arguments provided"}))
        return

    fetcher = OutlookFetcher(args.email, args.client_id, args.refresh_token)
    result = fetcher.fetch_latest_email()
    
    # Ensure result is valid JSON serializable
    print(json.dumps(result))

if __name__ == "__main__":
    main()
