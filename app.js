import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("billForm");
const billList = document.getElementById("billList");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const data = {
        person: document.getElementById("person").value,
        billName: document.getElementById("billName").value,
        amount: Number(document.getElementById("amount").value),
        dueDate: document.getElementById("dueDate").value,
        status: "Due"
    };

    await addDoc(
        collection(db, "bills"),
        data
    );

    form.reset();

    loadBills();

});

async function markPaid(id) {

    const billRef = doc(db, "bills", id);

    await updateDoc(billRef, {
        status: "Paid",
        paidDate: new Date().toISOString()
    });

    loadBills();
}

window.markPaid = markPaid;

async function loadBills() {

    billList.innerHTML = "";

    let outstandingTotal = 0;
    let overdueCount = 0;
    let paidCount = 0;

    const snapshot = await getDocs(
        collection(db, "bills")
    );

    snapshot.forEach((billDoc) => {

        const bill = billDoc.data();
        const today = new Date();

today.setHours(0, 0, 0, 0);

const dueDate = new Date(bill.dueDate);

let cardClass = "";
let displayStatus = bill.status;

if (bill.status === "Paid") {

    cardClass = "paid";

} else if (dueDate < today) {

    cardClass = "overdue";
    displayStatus = "Overdue";
    overdueCount++;

} else {

    cardClass = "due";

}

    
        if (bill.status === "Paid") {
            paidCount++;
        } else {
            outstandingTotal += bill.amount;
        }

        billList.innerHTML += `
            <div class="bill-card">

                <h3>${bill.person}</h3>

                <p>${bill.billName}</p>

                <p>$${bill.amount.toFixed(2)}</p>

                <p>Due: ${bill.dueDate}</p>

                <p>Status: ${bill.status}</p>

                ${
                  bill.status !== "Paid"
                  ? `<button onclick="markPaid('${billDoc.id}')">
                        Mark Paid
                     </button>`
                  : ""
                }

            </div>
        `;
    });

    document.getElementById("outstandingTotal").textContent =
        `$${outstandingTotal.toFixed(2)}`;

    document.getElementById("overdueCount").textContent =
        overdueCount;

    document.getElementById("paidCount").textContent =
        paidCount;
}

loadBills();
