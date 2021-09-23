//Varibale to hold connection
let db;

//Requesting a database instance
const request = indexedDB.open('budget_tracker', 1);

//Creating object store
request.onupgradeneeded = function (event) {
   const db = event.target.result;
   if (db.objectStoreNames.length === 0) {
       //if no objectStore create one, autoincrement primary key
    db.createObjectStore('BudgetStore', {autoIncrement: true });
}
};

//Create the onsuccess

request.onsuccess = function (event) {
     db = event.target.result;

    //Check to see if app is online before reading from database
    if(navigator.onLine) {
        checkDatabase();
    }
};

//If an error occurs, log the error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//Function for when user submits new transaction offline to save their input
const saveRecord = (record) => {
    console.log('saving record invoked');
    //creating transaction that can read and write on database
    const transaction = db.transaction(['BudgetStore'], 'readwrite');
    //Access object store
    const store = transaction.objectStore('BudgetStore');
    //Add record to store
    store.add(record);
};

//Checkdatabase function

const checkDatabase = () => {
    //Opens a transaction of budgettracker database
    let transaction = db.transaction(['BudgetStore'], 'readwrite');
    //Access the budgetstore
    const store = transaction.objectStore('BudgetStore');
    //Get all records from store and set to a variable
    const getAll = store.getAll();

    //If the request is successful 
    getAll.onsuccess = function () {
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => response.json())
            .then((res) => {
    //If returned response is not empty open another transaction to BudgetStore that can read and write 
                if (res.length !== 0) {
                    transaction = db.transaction(['BudgetStore'], 'readwrite');
            //Create variable for the current store
                    const currentStore = transaction.objectStore('BudgetStore');
            //Clear exisiting entries when bulk add is successful
                    currentStore.clear();
                }
            });
        }
    };
};



//Listen for app to get back online
window.addEventListener('online', checkDatabase);