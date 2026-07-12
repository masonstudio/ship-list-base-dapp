// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ShipList {
    uint256 public nextListId = 1;

    struct List {
        address maker;
        string projectName;
        bool mobileReady;
        bool contractReady;
        bool assetsReady;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => List) private lists;

    event ListSaved(
        uint256 indexed listId,
        address indexed maker,
        string projectName,
        uint8 readyCount
    );

    function saveList(
        string calldata projectName,
        bool mobileReady,
        bool contractReady,
        bool assetsReady,
        string calldata note
    ) external returns (uint256 listId) {
        require(bytes(projectName).length > 0 && bytes(projectName).length <= 48, "Invalid project");
        require(bytes(note).length > 0 && bytes(note).length <= 140, "Invalid note");

        listId = nextListId++;
        lists[listId] = List({
            maker: msg.sender,
            projectName: projectName,
            mobileReady: mobileReady,
            contractReady: contractReady,
            assetsReady: assetsReady,
            note: note,
            createdAt: block.timestamp
        });

        uint8 readyCount = 0;
        if (mobileReady) readyCount++;
        if (contractReady) readyCount++;
        if (assetsReady) readyCount++;
        emit ListSaved(listId, msg.sender, projectName, readyCount);
    }

    function getList(
        uint256 listId
    )
        external
        view
        returns (
            address maker,
            string memory projectName,
            bool mobileReady,
            bool contractReady,
            bool assetsReady,
            string memory note,
            uint256 createdAt
        )
    {
        List storage entry = lists[listId];
        return (
            entry.maker,
            entry.projectName,
            entry.mobileReady,
            entry.contractReady,
            entry.assetsReady,
            entry.note,
            entry.createdAt
        );
    }
}
