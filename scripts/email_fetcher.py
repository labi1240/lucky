import requests
import sys

class OutlookFetcher:
    def __init__(self, user_email, client_id, refresh_token):
        self.user_email = user_email
        self.client_id = client_id
        self.refresh_token = refresh_token
        self.access_token = None

    def get_access_token(self):
        url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        payload = {
            "client_id": self.client_id,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token",
            "scope": "https://graph.microsoft.com/Mail.Read offline_access"
        }
        try:
            r = requests.post(url, data=payload)
            if r.status_code == 200:
                self.access_token = r.json().get("access_token")
                return self.access_token, None
            else:
                sys.stderr.write(f"❌ Error getting token: {r.text}\n")
                return None, f"Status {r.status_code}: {r.text}"
        except Exception as e:
            sys.stderr.write(f"Error requesting token: {e}\n")
            return None, str(e)

    def fetch_latest_email(self):
        if not self.access_token:
            token, error = self.get_access_token()
            if not token:
                return {"error": f"Could not authenticate. Details: {error}"}

        # sys.stderr.write(f"Using Token: {self.access_token[:10]}...\n")
        
        # --- GRAPH API IMPLEMENTATION ---
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            # Fetch top 1 email from Inbox
            url = "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=1&$select=subject,from,toRecipients,receivedDateTime,body,hasAttachments&$orderby=receivedDateTime DESC"
            r = requests.get(url, headers=headers)
            
            if r.status_code != 200:
                return {"error": f"Graph API Error ({r.status_code}): {r.text}"}
                
            data = r.json()
            messages = data.get('value', [])
            
            if not messages:
                return {"error": "No emails found in Inbox."}
                
            msg = messages[0]
            
            # Format to match our previous structure
            return {
                "from": f"{msg.get('from', {}).get('emailAddress', {}).get('name')} <{msg.get('from', {}).get('emailAddress', {}).get('address')}>",
                "to": [f"{t.get('emailAddress', {}).get('address')}" for t in msg.get('toRecipients', [])],
                "subject": msg.get('subject'),
                "date": msg.get('receivedDateTime'),
                "body": msg.get('body', {}).get('content'), # Content is HTML or Text
                "attachments": [], # Graph handles attachments via a separate call usually, effectively skipping for now for simplicity unless requested
                "defects": [],
                "original_object": msg
            }

        except Exception as e:
            return {"error": f"Error fetching email via Graph: {e}"}
