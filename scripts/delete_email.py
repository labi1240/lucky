import sys
import json
import argparse
import requests

def move_to_trash(message_id, client_id, refresh_token, user_email):
    """Move email to Deleted Items folder (works with Mail.Read permission)"""
    # Get access token
    token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    payload = {
        "client_id": client_id,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "scope": "https://graph.microsoft.com/Mail.Read offline_access"
    }
    
    try:
        r = requests.post(token_url, data=payload)
        if r.status_code != 200:
            return {"success": False, "error": f"Token error: {r.text}"}
        
        access_token = r.json().get("access_token")
        
        # Move the message to Deleted Items
        # Using the MOVE operation which works with Mail.Read
        move_url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/move"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Get the Deleted Items folder ID first
        folders_url = "https://graph.microsoft.com/v1.0/me/mailFolders"
        folders_response = requests.get(folders_url, headers=headers)
        
        if folders_response.status_code != 200:
            return {"success": False, "error": f"Could not get folders: {folders_response.text}"}
        
        deleted_items_id = None
        folders = folders_response.json().get('value', [])
        for folder in folders:
            if folder.get('displayName') == 'Deleted Items' or folder.get('displayName') == 'Trash':
                deleted_items_id = folder.get('id')
                break
        
        if not deleted_items_id:
            return {"success": False, "error": "Could not find Deleted Items folder"}
        
        # Move the message
        move_body = {
            "destinationId": deleted_items_id
        }
        
        move_response = requests.post(move_url, headers=headers, json=move_body)
        
        if move_response.status_code in [200, 201]:
            return {"success": True, "message": "Email moved to trash successfully"}
        else:
            return {"success": False, "error": f"Move failed ({move_response.status_code}): {move_response.text}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    parser = argparse.ArgumentParser(description='Move an email to trash from Outlook')
    parser.add_argument('--message-id', required=True, help='Message ID to delete')
    parser.add_argument('--client-id', required=True, help='OAuth Client ID')
    parser.add_argument('--refresh-token', required=True, help='OAuth Refresh Token')
    parser.add_argument('--email', required=True, help='User Email')

    try:
        args = parser.parse_args()
    except SystemExit:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        return

    result = move_to_trash(args.message_id, args.client_id, args.refresh_token, args.email)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
