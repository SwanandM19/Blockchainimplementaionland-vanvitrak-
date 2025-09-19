// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LandRecords {
    struct Document {
        uint id;
        string fileHash;
        address uploader;
        uint256 timestamp;
    }

    mapping(uint => Document) public documents;
    uint public docCount;

    event DocumentStored(uint indexed id, string fileHash, address indexed uploader, uint256 timestamp);

    function storeDocument(string memory _fileHash) public returns (uint) {
        docCount++;
        documents[docCount] = Document(docCount, _fileHash, msg.sender, block.timestamp);
        emit DocumentStored(docCount, _fileHash, msg.sender, block.timestamp);
        return docCount;
    }

    function getDocument(uint _id) public view returns (string memory, address, uint256) {
        Document memory d = documents[_id];
        return (d.fileHash, d.uploader, d.timestamp);
    }

    function verifyHash(uint _id, string memory _fileHash) public view returns (bool) {
        return keccak256(bytes(documents[_id].fileHash)) == keccak256(bytes(_fileHash));
    }
}
