// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract KryosDataHash {
    // Struct to store data hash information
    struct DataHash {
        string externalId;
        string dataType;
        string dataHash;
        string companyId;
        uint256 timestamp;
        address storedBy;
    }

    // Mapping to store hashes by external ID
    mapping(string => DataHash) public dataHashes;
    
    // Array to store all external IDs for enumeration
    string[] public allExternalIds;
    
    // Events
    event DataHashStored(
        string indexed externalId,
        string dataType,
        string dataHash,
        string companyId,
        uint256 timestamp,
        address storedBy
    );
    
    event DataHashUpdated(
        string indexed externalId,
        string newDataHash,
        uint256 timestamp
    );

    // Store a new data hash
    function storeDataHash(
        string memory _externalId,
        string memory _dataType,
        string memory _dataHash,
        string memory _companyId
    ) public {
        require(bytes(_externalId).length > 0, "External ID cannot be empty");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");
        
        // Check if this external ID already exists
        bool exists = bytes(dataHashes[_externalId].externalId).length > 0;
        
        if (!exists) {
            allExternalIds.push(_externalId);
        }
        
        dataHashes[_externalId] = DataHash({
            externalId: _externalId,
            dataType: _dataType,
            dataHash: _dataHash,
            companyId: _companyId,
            timestamp: block.timestamp,
            storedBy: msg.sender
        });
        
        emit DataHashStored(
            _externalId,
            _dataType,
            _dataHash,
            _companyId,
            block.timestamp,
            msg.sender
        );
    }

    // Update an existing data hash
    function updateDataHash(
        string memory _externalId,
        string memory _newDataHash
    ) public {
        require(bytes(dataHashes[_externalId].externalId).length > 0, "Data hash not found");
        require(bytes(_newDataHash).length > 0, "New data hash cannot be empty");
        
        dataHashes[_externalId].dataHash = _newDataHash;
        dataHashes[_externalId].timestamp = block.timestamp;
        
        emit DataHashUpdated(_externalId, _newDataHash, block.timestamp);
    }

    // Get data hash by external ID
    function getDataHash(string memory _externalId) public view returns (
        string memory externalId,
        string memory dataType,
        string memory dataHash,
        string memory companyId,
        uint256 timestamp,
        address storedBy
    ) {
        DataHash memory hash = dataHashes[_externalId];
        return (
            hash.externalId,
            hash.dataType,
            hash.dataHash,
            hash.companyId,
            hash.timestamp,
            hash.storedBy
        );
    }

    // Check if data hash exists
    function dataHashExists(string memory _externalId) public view returns (bool) {
        return bytes(dataHashes[_externalId].externalId).length > 0;
    }

    // Get total number of stored hashes
    function getTotalHashes() public view returns (uint256) {
        return allExternalIds.length;
    }

    // Get external ID by index
    function getExternalIdByIndex(uint256 _index) public view returns (string memory) {
        require(_index < allExternalIds.length, "Index out of bounds");
        return allExternalIds[_index];
    }

    // Get all external IDs (for pagination)
    function getAllExternalIds(uint256 _offset, uint256 _limit) public view returns (string[] memory) {
        require(_offset < allExternalIds.length, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > allExternalIds.length) {
            end = allExternalIds.length;
        }
        
        string[] memory result = new string[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            result[i - _offset] = allExternalIds[i];
        }
        
        return result;
    }

    // Get data hashes by company ID
    function getDataHashesByCompany(string memory _companyId) public view returns (
        string[] memory externalIds,
        string[] memory dataTypes,
        string[] memory dataHashes,
        uint256[] memory timestamps
    ) {
        uint256 count = 0;
        
        // First pass: count matching records
        for (uint256 i = 0; i < allExternalIds.length; i++) {
            if (keccak256(bytes(dataHashes[allExternalIds[i]].companyId)) == keccak256(bytes(_companyId))) {
                count++;
            }
        }
        
        // Second pass: populate arrays
        externalIds = new string[](count);
        dataTypes = new string[](count);
        dataHashes = new string[](count);
        timestamps = new uint256[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < allExternalIds.length; i++) {
            if (keccak256(bytes(dataHashes[allExternalIds[i]].companyId)) == keccak256(bytes(_companyId))) {
                externalIds[index] = dataHashes[allExternalIds[i]].externalId;
                dataTypes[index] = dataHashes[allExternalIds[i]].dataType;
                dataHashes[index] = dataHashes[allExternalIds[i]].dataHash;
                timestamps[index] = dataHashes[allExternalIds[i]].timestamp;
                index++;
            }
        }
    }
}
