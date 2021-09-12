let db;

//indexed DB and version number
const request = window.indexedDB.open("budgetTracker", 1);

//getting db instance
request.onupgradeneeded = ({ target }) => {
    const db = target.result;
    if (db.objectStoreNames.length === 0) {
        db.createObjectStore("fundsStore", { autoIncrement: true });
    }
};


request.onsuccess = ({ target }) => {
    db = target.result;
    //will run the assessDB function to check if app is online
    if (navigator.onLine) {
        assessDB();
    }
};

//console log request error
request.onerror = function (event) {
    console.log(event.target.errorCode);
};

//
const assessDB = () => {
    let transaction = db.transaction(['fundsStore'], 'readwrite');
    //allowing access to fundsStore
    const store = transaction.objectStore('fundsStore');
    //getting records from store
    const getStore = store.getStore();

    //this function will 'bulk add' transactions when app goes back online
    getStore.onsuccess = function () {
        if (getStore.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: 'POST',
                body: JSON.stringify(getStore.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
            }).then((res) => res.json())
                .then((res) => {
                    if (res.length > 0) {
                        transaction = db.transaction(['fundsStore', 'readwrite']);
                        const currentStore = transaction.objectStore('fundsStore');
                        //clearing any existing data in the store
                        currentStore.clear();
                        console.log('Existing store cleared and transactions are submitted.')
                    }
                })
        }
    };
};

const addToStore = (recordOfTrx) => {
    console.log('Saving record of transaction.');
    // creating a transaction on fundsStore database
    const transaction = db.transaction(['fundsStore'], 'readwrite');
    // creating access to fundsStore object
    const store = transaction.objectStore('fundsStore');
    store.add(recordOfTrx);
};

//event listener to fire when app goes online
window.addEventListener('online', checkDatabase);
