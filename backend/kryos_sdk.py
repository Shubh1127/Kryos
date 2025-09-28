"""
Kryos Python SDK

A Python SDK for integrating with the Kryos Data Ingestion API.
This SDK allows client companies to easily submit user data, events,
and files to the Kryos backend system.

Usage:
    from kryos_sdk import KryosClient
    
    client = KryosClient(
        api_key="your_api_key_here",
        base_url="https://api.kryos.com/api"
    )
    
    # Submit user data
    user_data = {
        "externalId": "user_123",
        "name": "Jane Smith",
        "email": "jane@example.com"
    }
    response = client.submit_user_data(user_data)
"""

import requests
import os
from typing import Dict, List, Optional, Union, Any
import mimetypes
from urllib.parse import urljoin


class KryosError(Exception):
    """Base exception for Kryos SDK errors."""
    pass


class KryosAPIError(KryosError):
    """Exception raised when API returns an error response."""
    
    def __init__(self, message: str, status_code: int, response_data: Dict):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class KryosClient:
    """
    Kryos API Client for data ingestion.
    
    This client provides methods to submit user data, events, and files
    to the Kryos backend system using API key authentication.
    """
    
    def __init__(self, api_key: str, base_url: str = "http://localhost:5000/api", timeout: int = 30):
        """
        Initialize the Kryos client.
        
        Args:
            api_key: The API key provided by Kryos
            base_url: Base URL of the Kryos API (default: http://localhost:5000/api)
            timeout: Request timeout in seconds (default: 30)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'User-Agent': 'Kryos-Python-SDK/1.0.0'
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """
        Make HTTP request to the API.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            **kwargs: Additional arguments for requests
            
        Returns:
            Dictionary containing the JSON response
            
        Raises:
            KryosAPIError: If the API returns an error response
        """
        url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                timeout=self.timeout,
                **kwargs
            )
            
            # Parse JSON response
            try:
                data = response.json()
            except ValueError:
                raise KryosAPIError(
                    f"Invalid JSON response from API",
                    response.status_code,
                    {"raw_response": response.text}
                )
            
            # Handle error responses
            if not response.ok:
                error_message = data.get('error', f'HTTP {response.status_code} error')
                raise KryosAPIError(error_message, response.status_code, data)
            
            return data
            
        except requests.exceptions.RequestException as e:
            raise KryosError(f"Request failed: {str(e)}")
    
    def validate_api_key(self) -> Dict:
        """
        Validate the API key and check permissions.
        
        Returns:
            Dictionary containing API key validation information
        """
        return self._make_request('GET', '/data/health')
    
    def submit_user_data(self, user_data: Dict, files: Optional[List[str]] = None) -> Dict:
        """
        Submit user data to Kryos.
        
        Args:
            user_data: Dictionary containing user information
                Required fields: externalId, name, email
                Optional fields: phone, metadata
            files: List of file paths to upload (optional)
            
        Returns:
            Dictionary containing the API response
            
        Example:
            user_data = {
                "externalId": "user_123",
                "name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+1-555-0124",
                "metadata": {"source": "mobile_app"}
            }
            response = client.submit_user_data(user_data)
        """
        if files:
            return self._submit_with_files('/data/users', user_data, files)
        else:
            # For JSON-only requests, set Content-Type header
            headers = {'Content-Type': 'application/json'}
            return self._make_request('POST', '/data/users', json=user_data, headers=headers)
    
    def submit_data_entry(self, entry_data: Dict, files: Optional[List[str]] = None) -> Dict:
        """
        Submit a data entry to Kryos.
        
        Args:
            entry_data: Dictionary containing entry information
                Required fields: externalId, dataType, data
                Optional fields: user, tags
            files: List of file paths to upload (optional)
            
        Returns:
            Dictionary containing the API response
            
        Example:
            entry_data = {
                "externalId": "event_456",
                "dataType": "event_data",
                "data": {"action": "login", "timestamp": "2024-01-15T10:30:00Z"},
                "user": {
                    "externalId": "user_123",
                    "name": "Jane Smith",
                    "email": "jane@example.com"
                },
                "tags": ["login", "authentication"]
            }
            response = client.submit_data_entry(entry_data)
        """
        if files:
            return self._submit_with_files('/data/entries', entry_data, files)
        else:
            headers = {'Content-Type': 'application/json'}
            return self._make_request('POST', '/data/entries', json=entry_data, headers=headers)
    
    def _submit_with_files(self, endpoint: str, data: Dict, file_paths: List[str]) -> Dict:
        """
        Submit data with file uploads using multipart/form-data.
        
        Args:
            endpoint: API endpoint
            data: Form data dictionary
            file_paths: List of file paths to upload
            
        Returns:
            Dictionary containing the API response
        """
        files = []
        form_data = {}
        
        try:
            # Prepare files for upload
            for file_path in file_paths:
                if not os.path.exists(file_path):
                    raise KryosError(f"File not found: {file_path}")
                
                mime_type, _ = mimetypes.guess_type(file_path)
                file_obj = open(file_path, 'rb')
                files.append(('files', (os.path.basename(file_path), file_obj, mime_type)))
            
            # Prepare form data (flatten nested dictionaries)
            form_data = self._flatten_dict(data)
            
            # Make request without Content-Type header (let requests handle it)
            return self._make_request('POST', endpoint, data=form_data, files=files)
            
        finally:
            # Close all opened files
            for _, (_, file_obj, _) in files:
                if hasattr(file_obj, 'close'):
                    file_obj.close()
    
    def _flatten_dict(self, data: Dict, parent_key: str = '', separator: str = '.') -> Dict:
        """
        Flatten nested dictionary for form data submission.
        
        Args:
            data: Dictionary to flatten
            parent_key: Parent key for nested items
            separator: Separator for nested keys
            
        Returns:
            Flattened dictionary
        """
        items = []
        for key, value in data.items():
            new_key = f"{parent_key}{separator}{key}" if parent_key else key
            
            if isinstance(value, dict):
                items.extend(self._flatten_dict(value, new_key, separator).items())
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        items.extend(self._flatten_dict(item, f"{new_key}[{i}]", separator).items())
                    else:
                        items.append((f"{new_key}[{i}]", item))
            else:
                items.append((new_key, value))
        
        return dict(items)
    
    def get_users(self, page: int = 1, limit: int = 10) -> Dict:
        """
        Get user data from Kryos.
        
        Args:
            page: Page number (default: 1)
            limit: Number of items per page (default: 10)
            
        Returns:
            Dictionary containing users and pagination info
        """
        params = {'page': page, 'limit': limit}
        return self._make_request('GET', '/data/users', params=params)
    
    def get_entries(self, page: int = 1, limit: int = 10, data_type: Optional[str] = None, 
                   user_id: Optional[str] = None, tags: Optional[List[str]] = None) -> Dict:
        """
        Get data entries from Kryos.
        
        Args:
            page: Page number (default: 1)
            limit: Number of items per page (default: 10)
            data_type: Filter by data type (optional)
            user_id: Filter by user ID (optional)
            tags: Filter by tags (optional)
            
        Returns:
            Dictionary containing entries and pagination info
        """
        params = {'page': page, 'limit': limit}
        if data_type:
            params['dataType'] = data_type
        if user_id:
            params['userId'] = user_id
        if tags:
            params['tags'] = ','.join(tags)
            
        return self._make_request('GET', '/data/entries', params=params)
    
    def get_files(self, page: int = 1, limit: int = 10, mimetype: Optional[str] = None,
                 user_id: Optional[str] = None) -> Dict:
        """
        Get files from Kryos.
        
        Args:
            page: Page number (default: 1)
            limit: Number of items per page (default: 10)
            mimetype: Filter by MIME type (optional)
            user_id: Filter by user ID (optional)
            
        Returns:
            Dictionary containing files and pagination info
        """
        params = {'page': page, 'limit': limit}
        if mimetype:
            params['mimetype'] = mimetype
        if user_id:
            params['userId'] = user_id
            
        return self._make_request('GET', '/data/files', params=params)


# Example usage and testing
if __name__ == "__main__":
    # Example usage
    client = KryosClient(
        api_key="your_api_key_here",
        base_url="http://localhost:5000/api"
    )
    
    try:
        # Validate API key
        health = client.validate_api_key()
        print("API Key is valid:", health)
        
        # Submit user data
        user_data = {
            "externalId": "user_123",
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "+1-555-0124",
            "metadata": {
                "source": "mobile_app",
                "version": "1.2.0"
            }
        }
        
        response = client.submit_user_data(user_data)
        print("User data submitted:", response)
        
        # Submit data entry
        entry_data = {
            "externalId": "event_456",
            "dataType": "event_data",
            "data": {
                "action": "login",
                "timestamp": "2024-01-15T10:30:00Z",
                "ip_address": "192.168.1.100"
            },
            "user": {
                "externalId": "user_123",
                "name": "Jane Smith",
                "email": "jane@example.com"
            },
            "tags": ["login", "authentication"]
        }
        
        response = client.submit_data_entry(entry_data)
        print("Data entry submitted:", response)
        
        # Get users
        users = client.get_users(page=1, limit=5)
        print("Users:", users)
        
    except KryosAPIError as e:
        print(f"API Error: {e.message} (Status: {e.status_code})")
    except KryosError as e:
        print(f"SDK Error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")