let web3; //this is the extension we need for ethereum
let marketplace;
const ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "itemId",
				"type": "uint256"
			}
		],
		"name": "buyItem",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllItems",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "price",
						"type": "uint256"
					},
					{
						"internalType": "address payable",
						"name": "seller",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "isSold",
						"type": "bool"
					}
				],
				"internalType": "struct Marketplace.Item[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getItemsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "items",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isSold",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "listItem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "nextItem",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const addy = "0xf32F2E1641b1560F2317Ad27B871cCDcB7B4a946";

window.addEventListener("load", async () => {
  if (window.ethereum) { //make sure ethereum is installed
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.enable(); 
      initApp(); //initial the website contract
    } catch (error) {
      console.error("user denied"); 
    }
  } else if (window.web3) { //no ethereum
    web3 = new Web3(window.web3.currentProvider);
    initApp();
  } else {
    console.log("install metamask fr");  //its not detecting the metamask
  }
});

function initApp() {
  marketplace = new web3.eth.Contract(ABI, addy); //this is how the smart contract is connected to the website
  loadItemsForSale(); //load all the items for sale everytime
}

async function listItem() { //this function gets the info for the items from the HTML document
  const name = document.getElementById("name").value; 
  const price = document.getElementById("price").value;
  const accounts = await web3.eth.getAccounts(); //get the users metamask account
  marketplace.methods
    .listItem(name, price) //use the contract function to list the item
    .send({ from: accounts[0] }) //get the user (who listed the item)
    .on("receipt", function (receipt) { //make a recipt for the smart contract
      console.log("item listed! yerrrrr"); //letsgooooo
      const item = { name: name, price: price }; //create the new item
      showTransactionHash("Listing", item, receipt.transactionHash); //showing item and the hash on the blockchain
      loadItemsForSale(); //loading the items for sale
    })
    .on("error", function (error) {
      console.error("error when listing", error); //cringeeee catching error
    });
}

async function buyItem(itemId) {
  const accounts = await web3.eth.getAccounts(); //get the account again
  try {
    const item = await marketplace.methods.items(itemId).call();
    //this is saying that the item is available (not sold) then attempt to buy
    if (!item.sold) {
      marketplace.methods
        .buyItem(itemId)
        .send({ from: accounts[0], value: item.price }) //get the wei from the user
        .on("receipt", function (receipt) {
          console.log("item bought! yerrr"); //letsgo pt2
          showTransactionHash("Buying", item, receipt.transactionHash);  //we need to display the transaction 
          loadItemsForSale(); // refreshing the list
        })
        .on("error", function (error) {
          console.error("Error purchasing the item:", error);
        });
    } else {
      console.log("This item has already been sold.");
    }
  } catch (error) {
    console.error("Failed to fetch item details:", error); 
  }
}

function showTransactionHash(type, item, hash) {
  const listOfHashes = document.getElementById("itemHashes"); //get the list of things that have been sold
  //chat gpt cooking here
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.href = `https://sepolia.etherscan.io/tx/${hash}`; //we want the etherscan addy and it's really convienent to do it like this
  //all you have to do is append the hash to the end of the URL
  link.textContent = `${type} transaction for "${item.name}" - Transaction Hash: ${hash}`; //display it on the HTML
  link.target = "_blank"; //this opens the etherscan in a new tab
  li.appendChild(link);
  listOfHashes.appendChild(li); //add the transaction link to the list
}

async function loadItemsForSale() {
    const numItems = await marketplace.methods.getItemsCount().call(); //get the number of items in the for sale 
    const itemsList = document.getElementById("items"); //get the item from the HTML
    //chat gpt cooking once again
    itemsList.innerHTML = ""; // Clear the existing list
  
    for (let i = 0; i < numItems; i++) {
      const item = await marketplace.methods.items(i).call(); 
      if (!item.sold) { // Only process items that are not sold
        const itemElement = document.createElement("li");
        itemElement.textContent = `Buy ${item.name} for ${item.price} wei `;
        
        const purchaseButton = document.createElement("button");
        purchaseButton.textContent = "Purchase"; //purchase!
        purchaseButton.onclick = function() {
          buyItem(item.id);
        };
        itemElement.appendChild(purchaseButton); //add the buy button cause that is the actual useful part
        itemsList.appendChild(itemElement);
      }
    }
  }
  