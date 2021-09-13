let db;

//indexed DB and version number
const request = indexedDB.open("budgetTracker", 1);

//getting db instance
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore("fundsStore", { autoIncrement: true });
    }
};


request.onsuccess = function (event) {
    db = event.target.result;
    //will run the assessDB function to check if app is online
    if (navigator.onLine) {
        assessDB();
    }
};

//console log request error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

const addToStore = (recordOfTrx) => {
    // creating a transaction on fundsStore database
    const transaction = db.transaction(['fundsStore'], 'readwrite');
    // creating access to fundsStore object
    const store = transaction.objectStore('fundsStore');
    store.add(recordOfTrx);
};

function assessDB() {
    let transaction = db.transaction(['fundsStore'], 'readwrite');
    //allowing access to fundsStore
    const store = transaction.objectStore('fundsStore');
    //getting records from store
    const getAll = store.getAll();

    //this function will 'bulk add' transactions when app goes back online
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
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
                    // If our returned response is not empty
                    if (res.length !== 0) {
                        // Open another transaction to fundsStore with the ability to read and write
                        transaction = db.transaction(['fundsStore'], 'readwrite');
                        // Assign the current store to a variable
                        const currentStore = transaction.objectStore('fundsStore');
                        // Clear existing entries because our bulk add was successful
                        currentStore.clear();
                        alert('Transactions submitted.');
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

//event listener to fire when app goes online
window.addEventListener('online', assessDB);
