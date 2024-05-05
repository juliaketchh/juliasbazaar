// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Marketplace {
    struct Item {
        uint id;
        string name;
        uint price;
        address payable seller;
        bool isSold;
    }

    Item[] public items;
    uint public nextItem;

    function getItemsCount() public view returns (uint) {
        return items.length;
    }
    
    function getAllItems() external view returns (Item[] memory) {
        return items;
    }

    function listItem(string memory name, uint price) public {
        require(price > 0, "Price must be greater than zero");
        items.push(Item(nextItem, name, price, payable(msg.sender), false));
        nextItem++;
    }

    function buyItem(uint itemId) public payable {
        require(itemId < items.length && items[itemId].id == itemId, "Item does not exist");
        Item storage item = items[itemId];
        require(msg.value >= item.price, "Not enough Ether provided");
        require(!item.isSold, "Item already sold");
        item.seller.transfer(msg.value);
        item.isSold = true;
    }
}
